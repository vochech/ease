-- Migration: Update RLS policies for manager/personal task types
-- Purpose: Handle permissions for manager tasks and personal subtasks
-- Run after: 003_extend_tasks.sql

-- Drop old task policies
DROP POLICY IF EXISTS tasks_select ON public.tasks;
DROP POLICY IF EXISTS tasks_mutate ON public.tasks;

-- NEW: Select policy - users can see:
-- 1) Manager tasks in projects they're members of
-- 2) Personal tasks they created
-- 3) Manager tasks assigned to them
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

-- NEW: Insert policy for manager tasks
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

-- NEW: Insert policy for personal tasks
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

-- NEW: Update policy for manager tasks
-- Only managers/owners OR assigned user can update manager tasks
CREATE POLICY tasks_update_manager ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    task_type = 'manager' AND
    (
      -- Managers/owners can update any manager task
      EXISTS (
        SELECT 1
        FROM public.projects p
        JOIN public.org_members m ON m.org_id = p.org_id
        WHERE p.id = tasks.project_id
          AND m.user_id = auth.uid()
          AND m.role IN ('owner','manager')
      )
      OR
      -- Assigned user can update their assigned task (e.g., mark complete)
      assigned_to = auth.uid()
    )
  );

-- NEW: Update policy for personal tasks
-- Only creator can update their personal tasks
CREATE POLICY tasks_update_personal ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    task_type = 'personal' AND
    created_by = auth.uid()
  );

-- NEW: Delete policy for manager tasks
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

-- NEW: Delete policy for personal tasks
-- Only creator can delete their personal tasks
CREATE POLICY tasks_delete_personal ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    task_type = 'personal' AND
    created_by = auth.uid()
  );

-- Summary of permissions:
-- 
-- Manager Tasks (task_type='manager'):
--   - CREATE: owner, manager
--   - READ: all project members (owner, manager, member, viewer)
--   - UPDATE: owner, manager, or assigned user (for completion)
--   - DELETE: owner, manager
--
-- Personal Tasks (task_type='personal'):
--   - CREATE: any member with access to parent task
--   - READ: only creator
--   - UPDATE: only creator
--   - DELETE: only creator
--
-- Personal tasks are subtasks derived from manager tasks.
-- They allow team members to break down assigned work into their own tracking units.
