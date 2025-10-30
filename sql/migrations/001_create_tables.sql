-- Example migration for Ease scaffold
-- Apply this SQL in your Supabase project's SQL editor or via psql.

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Meetings
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  starts_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for faster counts (optional)
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);

-- Notes:
-- 1) Run this in the Supabase SQL editor or with psql connected to your Supabase DB.
-- 2) If using Supabase CLI, you can place this file in your migrations folder and run `supabase db push`.
