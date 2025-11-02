-- Migration: Add timeline/scheduling fields to tasks
-- Purpose: Enable timeline visualization and auto-scheduling
-- Run after: 003_004_combined_tasks_upgrade.sql

-- Add updated_at if missing (needed by trigger)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add start_date for when work begins
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS start_date timestamptz;

-- Add estimated_hours for workload calculation
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS estimated_hours numeric(5,2) CHECK (estimated_hours > 0);

-- Add progress tracking (0-100%)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0 
CHECK (progress >= 0 AND progress <= 100);

-- Add indexes for timeline queries
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON public.tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_start_date ON public.tasks(due_date, start_date);

-- Add comments
COMMENT ON COLUMN public.tasks.start_date IS 
  'When work on this task should begin. Can be auto-calculated or manually set.';
COMMENT ON COLUMN public.tasks.estimated_hours IS 
  'Estimated hours to complete this task. Used for workload calculation and auto-scheduling.';
COMMENT ON COLUMN public.tasks.progress IS 
  'Completion progress from 0-100%. Helps track task status beyond boolean completed flag.';

-- Update existing tasks to have sensible defaults
-- If task has due_date, set start_date to 7 days before (if not already set)
UPDATE public.tasks 
SET start_date = due_date - INTERVAL '7 days'
WHERE start_date IS NULL 
  AND due_date IS NOT NULL 
  AND task_type = 'manager';

-- Set default estimated_hours based on priority for existing tasks
UPDATE public.tasks 
SET estimated_hours = CASE 
  WHEN priority = 'urgent' THEN 4
  WHEN priority = 'high' THEN 8
  WHEN priority = 'medium' THEN 16
  WHEN priority = 'low' THEN 24
  ELSE 16
END
WHERE estimated_hours IS NULL;

-- Set progress to 100 for completed tasks
UPDATE public.tasks 
SET progress = 100
WHERE completed = true AND progress = 0;

-- Done! Timeline fields ready
