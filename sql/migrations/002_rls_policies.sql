-- Row Level Security and Policies for Ease

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Helper note: auth.uid() returns the current user's UUID

-- Organizations policies
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
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

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

-- Org members policies
DROP POLICY IF EXISTS org_members_select ON public.org_members;
CREATE POLICY org_members_select ON public.org_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members me
      WHERE me.org_id = org_members.org_id
        AND me.user_id = auth.uid()
        AND me.role IN ('owner','manager','member','viewer')
    )
  );

DROP POLICY IF EXISTS org_members_insert ON public.org_members;
CREATE POLICY org_members_insert ON public.org_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members me
      WHERE me.org_id = org_members.org_id
        AND me.user_id = auth.uid()
        AND me.role IN ('owner','manager')
    )
  );

DROP POLICY IF EXISTS org_members_update ON public.org_members;
CREATE POLICY org_members_update ON public.org_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members me
      WHERE me.org_id = org_members.org_id
        AND me.user_id = auth.uid()
        AND me.role IN ('owner','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members me
      WHERE me.org_id = org_members.org_id
        AND me.user_id = auth.uid()
        AND me.role IN ('owner','manager')
    )
  );

-- Allow users to delete their own membership (leave org)
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

-- Projects policies
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

-- Tasks policies
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

-- Meetings policies
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
