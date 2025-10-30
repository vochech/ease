-- Ease sample seed (run after all_in_one.sql)
-- Idempotent: safe to run multiple times
-- This creates a demo organization, one project, a couple tasks, and a meeting.
-- It also assigns the first existing auth user as the org owner if any user exists.

DO $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  v_project_id uuid;
BEGIN
  -- 1) Ensure demo organization exists
  SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'acme';
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug)
    VALUES ('Acme Inc', 'acme')
    RETURNING id INTO v_org_id;
    RAISE NOTICE 'Created organization Acme Inc (slug=acme) id=%', v_org_id;
  ELSE
    RAISE NOTICE 'Organization Acme Inc already exists id=%', v_org_id;
  END IF;

  -- 2) Pick a user to own the org (first existing auth user)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  -- Optional: If you want to force a specific user, uncomment and set:
  -- v_user_id := '00000000-0000-0000-0000-000000000000';

  IF v_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.org_members WHERE org_id = v_org_id AND user_id = v_user_id
  ) THEN
    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner');
    RAISE NOTICE 'Added user % as owner to org %', v_user_id, v_org_id;
  ELSIF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found in auth.users; skipped creating org membership.';
  ELSE
    RAISE NOTICE 'Membership already exists for user % in org %', v_user_id, v_org_id;
  END IF;

  -- 3) Ensure demo project exists
  IF NOT EXISTS (
    SELECT 1 FROM public.projects WHERE org_id = v_org_id AND name = 'Demo Project'
  ) THEN
    INSERT INTO public.projects (org_id, name, description, status)
    VALUES (v_org_id, 'Demo Project', 'Sample project seeded by script.', 'active')
    RETURNING id INTO v_project_id;
    RAISE NOTICE 'Created Demo Project id=%', v_project_id;
  ELSE
    SELECT id INTO v_project_id FROM public.projects WHERE org_id = v_org_id AND name = 'Demo Project' LIMIT 1;
    RAISE NOTICE 'Demo Project already exists id=%', v_project_id;
  END IF;

  -- 4) Seed a couple tasks
  IF NOT EXISTS (
    SELECT 1 FROM public.tasks WHERE project_id = v_project_id AND title = 'Set up repository'
  ) THEN
    INSERT INTO public.tasks (project_id, title, completed) VALUES
      (v_project_id, 'Set up repository', true),
      (v_project_id, 'Plan sprint 1', false);
    RAISE NOTICE 'Inserted demo tasks for project %', v_project_id;
  ELSE
    RAISE NOTICE 'Demo tasks already present for project % (skipping)', v_project_id;
  END IF;

  -- 5) Seed one meeting
  IF NOT EXISTS (
    SELECT 1 FROM public.meetings WHERE project_id = v_project_id AND title = 'Kickoff'
  ) THEN
    INSERT INTO public.meetings (project_id, title, starts_at)
    VALUES (v_project_id, 'Kickoff', now() + interval '2 days');
    RAISE NOTICE 'Inserted demo meeting for project %', v_project_id;
  ELSE
    RAISE NOTICE 'Demo meeting already present for project % (skipping)', v_project_id;
  END IF;
END $$;