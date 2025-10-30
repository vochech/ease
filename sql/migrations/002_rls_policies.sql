-- Row Level Security and Policies for Ease

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Helper note: auth.uid() returns the current user's UUID

-- Organizations policies
DROP POLICY IF EXISTS orgs_select ON organizations;
CREATE POLICY orgs_select ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member','viewer')
    )
  );

DROP POLICY IF EXISTS orgs_insert ON organizations;
CREATE POLICY orgs_insert ON organizations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS orgs_update ON organizations;
CREATE POLICY orgs_update ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  );

DROP POLICY IF EXISTS orgs_delete ON organizations;
CREATE POLICY orgs_delete ON organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
    )
  );

-- Org members policies
DROP POLICY IF EXISTS org_members_select ON org_members;
CREATE POLICY org_members_select ON org_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members me
      WHERE me.org_id = org_members.org_id
        AND me.user_id = auth.uid()
        AND me.role IN ('owner','manager','member','viewer')
    )
  );

DROP POLICY IF EXISTS org_members_insert ON org_members;
CREATE POLICY org_members_insert ON org_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members me
      WHERE me.org_id = org_members.org_id
        AND me.user_id = auth.uid()
        AND me.role IN ('owner','manager')
    )
  );

DROP POLICY IF EXISTS org_members_update ON org_members;
CREATE POLICY org_members_update ON org_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members me
      WHERE me.org_id = org_members.org_id
        AND me.user_id = auth.uid()
        AND me.role IN ('owner','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members me
      WHERE me.org_id = org_members.org_id
        AND me.user_id = auth.uid()
        AND me.role IN ('owner','manager')
    )
  );

-- Allow users to delete their own membership (leave org)
DROP POLICY IF EXISTS org_members_delete_self ON org_members;
CREATE POLICY org_members_delete_self ON org_members
  FOR DELETE
  USING (org_members.user_id = auth.uid());

-- Allow managers/owners to delete any membership in their org
DROP POLICY IF EXISTS org_members_delete_manage ON org_members;
CREATE POLICY org_members_delete_manage ON org_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members me
      WHERE me.org_id = org_members.org_id
        AND me.user_id = auth.uid()
        AND me.role IN ('owner','manager')
    )
  );

-- Projects policies
DROP POLICY IF EXISTS projects_select ON projects;
CREATE POLICY projects_select ON projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = projects.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member','viewer')
    )
  );

DROP POLICY IF EXISTS projects_insert ON projects;
CREATE POLICY projects_insert ON projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = projects.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  );

DROP POLICY IF EXISTS projects_update ON projects;
CREATE POLICY projects_update ON projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = projects.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = projects.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  );

DROP POLICY IF EXISTS projects_delete ON projects;
CREATE POLICY projects_delete ON projects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = projects.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager')
    )
  );

-- Tasks policies
DROP POLICY IF EXISTS tasks_select ON tasks;
CREATE POLICY tasks_select ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM projects p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE p.id = tasks.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member','viewer')
    )
  );

DROP POLICY IF EXISTS tasks_mutate ON tasks;
CREATE POLICY tasks_mutate ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM projects p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE p.id = tasks.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM projects p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE p.id = tasks.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  );

-- Meetings policies
DROP POLICY IF EXISTS meetings_select ON meetings;
CREATE POLICY meetings_select ON meetings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM projects p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE p.id = meetings.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member','viewer')
    )
  );

DROP POLICY IF EXISTS meetings_mutate ON meetings;
CREATE POLICY meetings_mutate ON meetings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM projects p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE p.id = meetings.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM projects p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE p.id = meetings.project_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','manager','member')
    )
  );
