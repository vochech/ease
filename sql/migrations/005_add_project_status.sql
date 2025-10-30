-- Add status column on projects to align with UI (safe re-run)

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS status text;

-- Backfill NULLs to 'active'
UPDATE public.projects
SET status = 'active'
WHERE status IS NULL;

-- Add a CHECK constraint if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.check_constraints c
    JOIN   information_schema.constraint_table_usage u
      ON   u.constraint_name = c.constraint_name
     AND   u.table_schema = c.constraint_schema
    WHERE  c.constraint_schema = 'public'
    AND    u.table_name = 'projects'
    AND    c.constraint_name = 'projects_status_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_status_check
      CHECK (status IN ('active','paused','completed','archived'));
  END IF;
END;
$$;
