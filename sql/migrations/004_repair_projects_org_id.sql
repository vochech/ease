-- Repair migration: ensure projects.org_id exists with FK and index

-- 1) Add the org_id column if missing
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS org_id uuid;

-- 2) Create FK to organizations if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.table_constraints tc
    WHERE  tc.table_schema = 'public'
    AND    tc.table_name   = 'projects'
    AND    tc.constraint_type = 'FOREIGN KEY'
    AND    tc.constraint_name = 'projects_org_id_fkey'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- 3) Index for org_id lookups
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON public.projects(org_id);

-- NOTE: If you already have projects without org_id, you may want to backfill:
-- UPDATE public.projects p
-- SET org_id = <some_org_uuid>
-- WHERE p.org_id IS NULL;
-- Replace <some_org_uuid> with a real organization id per project.
