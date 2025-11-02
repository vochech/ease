-- Migration 006: Add project_members table
-- Purpose: Allow assigning specific org members to specific projects
-- Created: 2025-10-31

-- ========================================
-- 1. Create project_members table
-- ========================================

CREATE TABLE IF NOT EXISTS public.project_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('manager', 'member')),
    added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- Ensure user can only be added once per project
    UNIQUE(project_id, user_id)
);

-- ========================================
-- 2. Indexes for performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON public.project_members(role);

-- ========================================
-- 3. RLS Policies
-- ========================================

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Allow org members to view project members if they have access to the project
CREATE POLICY "org_members_can_view_project_members" ON public.project_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.org_members om ON om.org_id = p.org_id
            WHERE p.id = project_members.project_id
            AND om.user_id = auth.uid()
        )
    );

-- Allow owners and managers to add project members
CREATE POLICY "owners_managers_can_add_project_members" ON public.project_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.org_members om ON om.org_id = p.org_id
            WHERE p.id = project_members.project_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'manager')
        )
    );

-- Allow owners and managers to remove project members
CREATE POLICY "owners_managers_can_remove_project_members" ON public.project_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.org_members om ON om.org_id = p.org_id
            WHERE p.id = project_members.project_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'manager')
        )
    );

-- Allow owners and managers to update project member roles
CREATE POLICY "owners_managers_can_update_project_members" ON public.project_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.org_members om ON om.org_id = p.org_id
            WHERE p.id = project_members.project_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'manager')
        )
    );

-- ========================================
-- 4. Trigger for updated_at
-- ========================================

CREATE OR REPLACE FUNCTION public.update_project_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_members_updated_at
    BEFORE UPDATE ON public.project_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_members_updated_at();

-- ========================================
-- 5. Note: No backfill needed
-- ========================================

-- Projects table doesn't have created_by column
-- Project members will be added manually via UI

-- ========================================
-- 6. Verification
-- ========================================

-- Check table
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'project_members'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'project_members';

-- Check policies
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'project_members';

-- Check data
SELECT 
    pm.id,
    p.name AS project_name,
    u.email AS user_email,
    pm.role,
    pm.created_at
FROM public.project_members pm
JOIN public.projects p ON p.id = pm.project_id
JOIN auth.users u ON u.id = pm.user_id
ORDER BY pm.created_at DESC
LIMIT 10;
