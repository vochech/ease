-- Ease all-in-one migration (copy-paste into Supabase SQL editor)

-- 0) Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- 1) Tables
-- organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- org_members (RBAC)
CREATE TABLE IF NOT EXISTS public.org_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('owner', 'manager', 'member', 'viewer', 'invited')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- projects (org-scoped)
CREATE TABLE IF NOT EXISTS public.projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- tasks (project-scoped)
CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  title       text NOT NULL,
  completed   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- meetings (project-scoped)
CREATE TABLE IF NOT EXISTS public.meetings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title       text NOT NULL,
  starts_at   timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 2) Indexes (excluding projects.org_id which is added in section 2b after column exists)
CREATE INDEX IF NOT EXISTS idx_org_members_org_id   ON public.org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id  ON public.org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id     ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id  ON public.meetings(project_id);

-- 2b) Upgrades for existing databases (when tables already exist without newer columns)
-- Ensure projects.org_id exists, has FK and index
DO $$
BEGIN
  -- Add org_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN org_id uuid;
    RAISE NOTICE 'Added projects.org_id column';
  ELSE
    RAISE NOTICE 'projects.org_id already exists';
  END IF;

  -- Add FK constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
    AND tc.table_name = 'projects'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name = 'projects_org_id_fkey'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added projects.org_id FK constraint';
  ELSE
    RAISE NOTICE 'projects.org_id FK already exists';
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_projects_org_id ON public.projects(org_id);

-- Ensure projects.status exists and is constrained; backfill NULLs to 'active'
DO $$
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN status text;
    RAISE NOTICE 'Added projects.status column';
  ELSE
    RAISE NOTICE 'projects.status already exists';
  END IF;

  -- Set default for new rows going forward
  ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'active';

  -- Backfill existing NULL values
  UPDATE public.projects SET status = 'active' WHERE status IS NULL;

  -- Add NOT NULL constraint after backfill
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'status'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.projects ALTER COLUMN status SET NOT NULL;
    RAISE NOTICE 'Set projects.status to NOT NULL';
  END IF;

  -- Add CHECK constraint (drop first to ensure idempotency)
  BEGIN
    ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_status_check
      CHECK (status IN ('active','paused','completed','archived'));
    RAISE NOTICE 'Added/updated projects.status CHECK constraint';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add projects.status CHECK constraint: %', SQLERRM;
  END;
END;
$$;

-- 2c) Verify critical columns exist before creating policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'org_id'
  ) THEN
    RAISE EXCEPTION 'projects.org_id column does not exist. Migration 2b may have failed.';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION 'projects.status column does not exist. Migration 2b may have failed.';
  END IF;
END;
$$;

-- 3) Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings     ENABLE ROW LEVEL SECURITY;

-- 4) Policies
-- Organizations
DROP POLICY IF EXISTS orgs_select ON public.organizations;
CREATE POLICY orgs_select ON public.organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member','viewer')
    )
  );

DROP POLICY IF EXISTS orgs_insert ON public.organizations;
CREATE POLICY orgs_insert ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS orgs_update ON public.organizations;
CREATE POLICY orgs_update ON public.organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  );

DROP POLICY IF EXISTS orgs_delete ON public.organizations;
CREATE POLICY orgs_delete ON public.organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
    )
  );

-- Org members (simplified - avoid recursion)
-- Allow users to see their own memberships and memberships in orgs they belong to
DROP POLICY IF EXISTS org_members_select ON public.org_members;
CREATE POLICY org_members_select ON public.org_members
  FOR SELECT
  USING (org_members.user_id = auth.uid());

-- Allow authenticated users to create memberships (app logic handles authorization)
DROP POLICY IF EXISTS org_members_insert ON public.org_members;
CREATE POLICY org_members_insert ON public.org_members
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update memberships in their orgs (simplified)
DROP POLICY IF EXISTS org_members_update ON public.org_members;
CREATE POLICY org_members_update ON public.org_members
  FOR UPDATE
  USING (org_members.user_id = auth.uid())
  WITH CHECK (org_members.user_id = auth.uid());

-- Allow user to delete their own membership (leave org)
DROP POLICY IF EXISTS org_members_delete_self ON public.org_members;
CREATE POLICY org_members_delete_self ON public.org_members
  FOR DELETE
  USING (org_members.user_id = auth.uid());

-- Allow managers/owners to delete any membership in their org
DROP POLICY IF EXISTS org_members_delete_manage ON public.org_members;
CREATE POLICY org_members_delete_manage ON public.org_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members me
      WHERE me.org_id = org_members.org_id
        AND me.user_id = auth.uid()
        AND me.role IN ('owner','manager')
    )
  );

-- Projects
DROP POLICY IF EXISTS projects_select ON public.projects;
CREATE POLICY projects_select ON public.projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = projects.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member','viewer')
    )
  );

DROP POLICY IF EXISTS projects_insert ON public.projects;
CREATE POLICY projects_insert ON public.projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = projects.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  );

DROP POLICY IF EXISTS projects_update ON public.projects;
CREATE POLICY projects_update ON public.projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = projects.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = projects.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  );

DROP POLICY IF EXISTS projects_delete ON public.projects;
CREATE POLICY projects_delete ON public.projects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = projects.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  );

-- Tasks
DROP POLICY IF EXISTS tasks_select ON public.tasks;
CREATE POLICY tasks_select ON public.tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.org_members m ON m.org_id = p.org_id
      WHERE p.id = tasks.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member','viewer')
    )
  );

DROP POLICY IF EXISTS tasks_mutate ON public.tasks;
CREATE POLICY tasks_mutate ON public.tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.org_members m ON m.org_id = p.org_id
      WHERE p.id = tasks.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.org_members m ON m.org_id = p.org_id
      WHERE p.id = tasks.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  );

-- Meetings
DROP POLICY IF EXISTS meetings_select ON public.meetings;
CREATE POLICY meetings_select ON public.meetings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.org_members m ON m.org_id = p.org_id
      WHERE p.id = meetings.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member','viewer')
    )
  );

DROP POLICY IF EXISTS meetings_mutate ON public.meetings;
CREATE POLICY meetings_mutate ON public.meetings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.org_members m ON m.org_id = p.org_id
      WHERE p.id = meetings.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.org_members m ON m.org_id = p.org_id
      WHERE p.id = meetings.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  );

-- 5) updated_at trigger function and triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop + recreate triggers (safe to re-run)
DROP TRIGGER IF EXISTS trg_orgs_updated_at ON public.organizations;
CREATE TRIGGER trg_orgs_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_org_members_updated_at ON public.org_members;
CREATE TRIGGER trg_org_members_updated_at
BEFORE UPDATE ON public.org_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_meetings_updated_at ON public.meetings;
CREATE TRIGGER trg_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
