-- All-in-one migration: Apply all task enhancements
-- This combines 003_extend_tasks.sql and 004_tasks_rls_policies.sql
-- Run this in Supabase SQL Editor to update existing database

-- ============================================================
-- PART 1: Extend tasks table schema
-- ============================================================

-- Add task_type column (manager tasks vs personal subtasks)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'manager' 
CHECK (task_type IN ('manager', 'personal'));

-- Add parent_task_id for personal subtasks (references manager task)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS parent_task_id uuid 
REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Add assigned_to for task assignment
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS assigned_to uuid 
REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by to track who created the task
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS created_by uuid 
REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add due_date for deadlines
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS due_date timestamptz;

-- Add priority field
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium'
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add description field
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS description text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON public.tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Add constraint: personal tasks must have a parent_task_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_personal_has_parent'
  ) THEN
    ALTER TABLE public.tasks 
    ADD CONSTRAINT check_personal_has_parent 
    CHECK (
      (task_type = 'manager' AND parent_task_id IS NULL) OR
      (task_type = 'personal' AND parent_task_id IS NOT NULL)
    );
  END IF;
END
$$;

-- Add comments
COMMENT ON COLUMN public.tasks.task_type IS 
  'manager: official tasks created by managers/owners; personal: subtasks created by any member';
COMMENT ON COLUMN public.tasks.parent_task_id IS 
  'For personal tasks only - references the manager task this is derived from';
COMMENT ON COLUMN public.tasks.assigned_to IS 
  'User assigned to this task. For manager tasks: assigned by manager. For personal tasks: same as created_by';

-- ============================================================
-- PART 2: Update RLS policies
-- ============================================================

-- Drop old task policies
DROP POLICY IF EXISTS tasks_select ON public.tasks;
DROP POLICY IF EXISTS tasks_mutate ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_manager ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_personal ON public.tasks;
DROP POLICY IF EXISTS tasks_update_manager ON public.tasks;
DROP POLICY IF EXISTS tasks_update_personal ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_manager ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_personal ON public.tasks;

-- Select policy - users can see:
-- 1) Manager tasks in projects they're members of
-- 2) Personal tasks they created
CREATE POLICY tasks_select ON public.tasks
  FOR SELECT
  USING (
    -- Manager tasks: visible to all project members
    (
      task_type = 'manager' AND
      EXISTS (
        SELECT 1
        FROM public.projects p
        JOIN public.org_members m ON m.org_id = p.org_id
        WHERE p.id = tasks.project_id
          AND m.user_id = auth.uid()
          AND m.role IN ('owner','manager','member','viewer')
      )
    )
    OR
    -- Personal tasks: only visible to creator
    (
      task_type = 'personal' AND
      created_by = auth.uid()
    )
  );

-- Insert policy for manager tasks
-- Only managers/owners can create manager tasks
CREATE POLICY tasks_insert_manager ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    task_type = 'manager' AND
    EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.org_members m ON m.org_id = p.org_id
      WHERE p.id = tasks.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  );

-- Insert policy for personal tasks
-- All members can create personal subtasks
CREATE POLICY tasks_insert_personal ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    task_type = 'personal' AND
    parent_task_id IS NOT NULL AND
    created_by = auth.uid() AND
    assigned_to = auth.uid() AND
    -- User must have access to parent manager task
    EXISTS (
      SELECT 1
      FROM public.tasks parent
      JOIN public.projects p ON p.id = parent.project_id
      JOIN public.org_members m ON m.org_id = p.org_id
      WHERE parent.id = tasks.parent_task_id
        AND parent.task_type = 'manager'
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  );

-- Update policy for manager tasks
-- Managers/owners OR assigned user can update manager tasks
CREATE POLICY tasks_update_manager ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    task_type = 'manager' AND
    (
      EXISTS (
        SELECT 1
        FROM public.projects p
        JOIN public.org_members m ON m.org_id = p.org_id
        WHERE p.id = tasks.project_id
          AND m.user_id = auth.uid()
          AND m.role IN ('owner','manager')
      )
      OR
      assigned_to = auth.uid()
    )
  );

-- Update policy for personal tasks
-- Only creator can update their personal tasks
CREATE POLICY tasks_update_personal ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    task_type = 'personal' AND
    created_by = auth.uid()
  );

-- Delete policy for manager tasks
-- Only managers/owners can delete manager tasks
CREATE POLICY tasks_delete_manager ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    task_type = 'manager' AND
    EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.org_members m ON m.org_id = p.org_id
      WHERE p.id = tasks.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  );

-- Delete policy for personal tasks
-- Only creator can delete their personal tasks
CREATE POLICY tasks_delete_personal ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    task_type = 'personal' AND
    created_by = auth.uid()
  );

-- ============================================================
-- Done! 
-- Now you can use manager tasks and personal subtasks
-- ============================================================
