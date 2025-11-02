-- Seed script: Create test organizations with different roles for testing
-- Run this in Supabase SQL Editor to set up test environment

-- Get your user ID (replace with your actual email)
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Find your user by email (UPDATE THIS!)
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'vojta.skuplik@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found. Update the email in this script!';
    END IF;

    -- Create test organizations if they don't exist
    INSERT INTO public.organizations (id, name, slug)
    VALUES 
        (gen_random_uuid(), 'Test Owner Org', 'test-owner'),
        (gen_random_uuid(), 'Test Manager Org', 'test-manager'),
        (gen_random_uuid(), 'Test Member Org', 'test-member')
    ON CONFLICT (slug) DO NOTHING;

    -- Add yourself to each org with different roles
    -- Owner role
    INSERT INTO public.org_members (org_id, user_id, role)
    SELECT id, v_user_id, 'owner'
    FROM public.organizations
    WHERE slug = 'test-owner'
    ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'owner';

    -- Manager role
    INSERT INTO public.org_members (org_id, user_id, role)
    SELECT id, v_user_id, 'manager'
    FROM public.organizations
    WHERE slug = 'test-manager'
    ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'manager';

    -- Member role
    INSERT INTO public.org_members (org_id, user_id, role)
    SELECT id, v_user_id, 'member'
    FROM public.organizations
    WHERE slug = 'test-member'
    ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'member';

    RAISE NOTICE 'Successfully created test organizations for user: %', v_user_id;
END $$;

-- Verify
SELECT 
    o.name,
    o.slug,
    om.role
FROM public.org_members om
JOIN public.organizations o ON o.id = om.org_id
JOIN auth.users u ON u.id = om.user_id
WHERE u.email = 'vojta.skuplik@gmail.com'
ORDER BY om.role DESC;
