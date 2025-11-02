-- RESET & COMPLETE MIGRATION SCRIPT
-- This will DROP all existing tables and recreate everything from scratch
-- ⚠️ WARNING: This will delete ALL data in your database!
-- ✅ Storage bucket "recordings" will NOT be deleted - it stays intact
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/xpnbghyxdzvhqkopplut/sql/new)

-- ========================================
-- PART 1: DROP ALL EXISTING TABLES
-- ========================================

-- Disable RLS first
ALTER TABLE IF EXISTS public.meeting_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations DISABLE ROW LEVEL SECURITY;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.meeting_recordings CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.org_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Drop trigger function
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- ========================================
-- PART 2: ALL_IN_ONE MIGRATION (001-009)
-- ========================================

-- 0) Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- 1) Tables
-- organizations
CREATE TABLE public.organizations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- org_members (RBAC)
CREATE TABLE public.org_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('owner', 'manager', 'member', 'viewer', 'invited')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- projects (org-scoped)
CREATE TABLE public.projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- tasks (project-scoped)
CREATE TABLE public.tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  title       text NOT NULL,
  completed   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- meetings (project-scoped)
CREATE TABLE public.meetings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id  uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title       text NOT NULL,
  starts_at   timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 2) Indexes
CREATE INDEX idx_org_members_org_id   ON public.org_members(org_id);
CREATE INDEX idx_org_members_user_id  ON public.org_members(user_id);
CREATE INDEX idx_projects_org_id      ON public.projects(org_id);
CREATE INDEX idx_tasks_project_id     ON public.tasks(project_id);
CREATE INDEX idx_meetings_org_id      ON public.meetings(org_id);
CREATE INDEX idx_meetings_project_id  ON public.meetings(project_id);

-- 3) Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings     ENABLE ROW LEVEL SECURITY;

-- 4) Policies
-- Organizations
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

CREATE POLICY orgs_insert ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

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

-- Org members
CREATE POLICY org_members_select ON public.org_members
  FOR SELECT
  USING (org_members.user_id = auth.uid());

CREATE POLICY org_members_insert ON public.org_members
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY org_members_update ON public.org_members
  FOR UPDATE
  USING (org_members.user_id = auth.uid())
  WITH CHECK (org_members.user_id = auth.uid());

CREATE POLICY org_members_delete_self ON public.org_members
  FOR DELETE
  USING (org_members.user_id = auth.uid());

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
CREATE POLICY meetings_select ON public.meetings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.org_id = meetings.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member','viewer')
    )
  );

CREATE POLICY meetings_mutate ON public.meetings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.org_id = meetings.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.org_id = meetings.org_id
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

CREATE TRIGGER trg_orgs_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_org_members_updated_at
BEFORE UPDATE ON public.org_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- PART 3: MEETING RECORDINGS (010)
-- ========================================

CREATE TABLE public.meeting_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_size bigint,
  duration_seconds int,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_meeting_recordings_meeting_id ON public.meeting_recordings(meeting_id);

ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;

-- Users can view recordings for meetings in their orgs
CREATE POLICY "Users can view recordings in their orgs"
  ON public.meeting_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.org_members om ON om.org_id = m.org_id
      WHERE m.id = meeting_recordings.meeting_id
        AND om.user_id = auth.uid()
    )
  );

-- Users can create recordings for meetings in their orgs
CREATE POLICY "Users can create recordings in their orgs"
  ON public.meeting_recordings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.org_members om ON om.org_id = m.org_id
      WHERE m.id = meeting_recordings.meeting_id
        AND om.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_meeting_recordings_updated_at
BEFORE UPDATE ON public.meeting_recordings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- PART 4: SEED SAMPLE DATA
-- ========================================

DO $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  v_project_id uuid;
BEGIN
  -- 1) Create demo organization
  INSERT INTO public.organizations (name, slug)
  VALUES ('Acme Inc', 'acme')
  RETURNING id INTO v_org_id;
  RAISE NOTICE 'Created organization Acme Inc (slug=acme) id=%', v_org_id;

  -- 2) Pick first existing auth user to be owner
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner');
    RAISE NOTICE 'Added user % as owner to org %', v_user_id, v_org_id;
  ELSE
    RAISE NOTICE 'No users found in auth.users; skipped creating org membership.';
  END IF;

  -- 3) Create demo project
  INSERT INTO public.projects (org_id, name, description, status)
  VALUES (v_org_id, 'Demo Project', 'Sample project seeded by script.', 'active')
  RETURNING id INTO v_project_id;
  RAISE NOTICE 'Created Demo Project id=%', v_project_id;

  -- 4) Seed tasks
  INSERT INTO public.tasks (project_id, title, completed) VALUES
    (v_project_id, 'Set up repository', true),
    (v_project_id, 'Plan sprint 1', false);
  RAISE NOTICE 'Inserted demo tasks for project %', v_project_id;

  -- 5) Seed meeting
  INSERT INTO public.meetings (org_id, project_id, title, starts_at)
  VALUES (v_org_id, v_project_id, 'Kickoff', now() + interval '2 days');
  RAISE NOTICE 'Inserted demo meeting for project %', v_project_id;
END $$;

-- ========================================
-- DONE! 🎉
-- ========================================
-- You should see:
-- - 5 tables created: organizations, org_members, projects, tasks, meetings, meeting_recordings
-- - RLS enabled with policies
-- - Demo org "Acme Inc" (slug=acme)
-- - First auth user assigned as owner
-- - Demo project with 2 tasks and 1 meeting
