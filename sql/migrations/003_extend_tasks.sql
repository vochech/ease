-- Migration: Extend tasks table for manager/personal task types
-- Purpose: Add support for manager-assigned tasks and personal subtasks

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
ALTER TABLE public.tasks 
ADD CONSTRAINT check_personal_has_parent 
CHECK (
  (task_type = 'manager' AND parent_task_id IS NULL) OR
  (task_type = 'personal' AND parent_task_id IS NOT NULL)
);

-- Add constraint: personal tasks should be assigned to creator
-- (enforced at application level, but good to document)
COMMENT ON COLUMN public.tasks.task_type IS 
  'manager: official tasks created by managers/owners; personal: subtasks created by any member';
COMMENT ON COLUMN public.tasks.parent_task_id IS 
  'For personal tasks only - references the manager task this is derived from';
COMMENT ON COLUMN public.tasks.assigned_to IS 
  'User assigned to this task. For manager tasks: assigned by manager. For personal tasks: same as created_by';

-- Notes:
-- 1) Run this migration after 001_create_tables.sql and 002_rls_policies.sql
-- 2) Existing tasks will be marked as task_type='manager' by default
-- 3) RLS policies need to be updated separately to handle task visibility
