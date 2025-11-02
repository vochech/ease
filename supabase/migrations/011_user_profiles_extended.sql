-- Migration 011: Extended User Profiles
-- Purpose: Add comprehensive user data for better task assignment and team management
-- Created: 2025-10-31

-- ========================================
-- 1. Create user_profiles table
-- ========================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    -- Primary identification
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal identification
    full_name text,
    display_name text, -- Preferred name for display
    profile_photo_url text,
    bio text,
    phone_number text,
    
    -- Organizational data
    department text, -- e.g., 'engineering', 'design', 'marketing', 'sales', 'hr', 'finance'
    team text, -- Sub-team within department
    office_location text,
    timezone text DEFAULT 'UTC',
    
    -- Role and experience
    role_level text CHECK (role_level IN ('junior', 'mid', 'senior', 'lead', 'principal')),
    position_title text, -- e.g., 'Frontend Developer', 'UX Designer'
    specialization text, -- Specific skills or focus area
    years_of_experience integer,
    
    -- Employment details
    start_date date, -- Date joined company
    contract_type text CHECK (contract_type IN ('full-time', 'part-time', 'contractor', 'intern')),
    employment_status text DEFAULT 'active' CHECK (employment_status IN ('active', 'on-leave', 'terminated')),
    
    -- Work preferences
    shift_pattern text, -- e.g., 'day', 'night', 'flexible'
    working_hours_per_week integer DEFAULT 40,
    preferred_work_style text, -- e.g., 'async', 'sync', 'hybrid'
    
    -- Capacity and availability
    current_capacity_percentage integer DEFAULT 100 CHECK (current_capacity_percentage >= 0 AND current_capacity_percentage <= 100),
    is_available_for_tasks boolean DEFAULT true,
    
    -- Skills and certifications
    skills text[], -- Array of skills
    certifications text[], -- Array of certifications
    languages text[], -- Spoken languages
    
    -- Metadata
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    last_profile_update_at timestamptz,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ========================================
-- 2. Extend org_members table
-- ========================================

-- Add manager relationship
ALTER TABLE public.org_members 
ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add department (denormalized for quick filtering)
ALTER TABLE public.org_members 
ADD COLUMN IF NOT EXISTS department text;

-- Add custom permissions JSON
ALTER TABLE public.org_members 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

-- Add invitation metadata
ALTER TABLE public.org_members 
ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.org_members 
ADD COLUMN IF NOT EXISTS invited_at timestamptz;

ALTER TABLE public.org_members 
ADD COLUMN IF NOT EXISTS joined_at timestamptz;

-- ========================================
-- 3. Create indexes for performance
-- ========================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON public.user_profiles(department);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_level ON public.user_profiles(role_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employment_status ON public.user_profiles(employment_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_available ON public.user_profiles(is_available_for_tasks);

-- Org members indexes
CREATE INDEX IF NOT EXISTS idx_org_members_manager_id ON public.org_members(manager_id);
CREATE INDEX IF NOT EXISTS idx_org_members_department ON public.org_members(department);

-- Skills search (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_user_profiles_skills ON public.user_profiles USING GIN(skills);

-- ========================================
-- 4. RLS Policies for user_profiles
-- ========================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view profiles of people in their organizations
CREATE POLICY "org_members_can_view_profiles" ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.org_members om1
            JOIN public.org_members om2 ON om1.org_id = om2.org_id
            WHERE om1.user_id = auth.uid()
            AND om2.user_id = user_profiles.user_id
        )
    );

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile" ON public.user_profiles
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Owners and managers can update profiles in their org
CREATE POLICY "owners_managers_can_update_profiles" ON public.user_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.org_members om1
            JOIN public.org_members om2 ON om1.org_id = om2.org_id
            WHERE om1.user_id = auth.uid()
            AND om1.role IN ('owner', 'manager')
            AND om2.user_id = user_profiles.user_id
        )
    );

-- Users can insert their own profile
CREATE POLICY "users_can_insert_own_profile" ON public.user_profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ========================================
-- 5. Triggers for updated_at
-- ========================================

CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.last_profile_update_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- ========================================
-- 6. Helper function to get user workload
-- ========================================

CREATE OR REPLACE FUNCTION public.get_user_workload(p_user_id uuid)
RETURNS TABLE (
    total_tasks integer,
    high_priority_tasks integer,
    overdue_tasks integer,
    workload_score numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer as total_tasks,
        COUNT(*) FILTER (WHERE priority IN ('high', 'urgent'))::integer as high_priority_tasks,
        COUNT(*) FILTER (WHERE due_date < now() AND NOT completed)::integer as overdue_tasks,
        (
            COUNT(*)::numeric + 
            (COUNT(*) FILTER (WHERE priority = 'high')::numeric * 1.5) + 
            (COUNT(*) FILTER (WHERE priority = 'urgent')::numeric * 2) +
            (COUNT(*) FILTER (WHERE due_date < now() AND NOT completed)::numeric * 3)
        ) as workload_score
    FROM public.tasks
    WHERE assigned_to = p_user_id
    AND NOT completed;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. View for team member overview
-- ========================================

CREATE OR REPLACE VIEW public.team_members_overview AS
SELECT 
    om.id as org_member_id,
    om.org_id,
    om.user_id,
    om.role as org_role,
    om.department as org_department,
    om.manager_id,
    u.email,
    up.full_name,
    up.display_name,
    up.profile_photo_url,
    up.position_title,
    up.role_level,
    up.department as profile_department,
    up.specialization,
    up.employment_status,
    up.current_capacity_percentage,
    up.is_available_for_tasks,
    up.skills,
    om.created_at as joined_org_at,
    up.start_date as employment_start_date
FROM public.org_members om
JOIN auth.users u ON u.id = om.user_id
LEFT JOIN public.user_profiles up ON up.user_id = om.user_id;

-- ========================================
-- 8. Comments for documentation
-- ========================================

COMMENT ON TABLE public.user_profiles IS 'Extended user profile data for task assignment and team management';
COMMENT ON COLUMN public.user_profiles.role_level IS 'Career level: junior, mid, senior, lead, principal';
COMMENT ON COLUMN public.user_profiles.current_capacity_percentage IS 'Current available capacity (0-100%). Used for workload balancing.';
COMMENT ON COLUMN public.user_profiles.is_available_for_tasks IS 'Whether user is currently available for new task assignments';
COMMENT ON FUNCTION public.get_user_workload IS 'Calculate user workload including priority weights and overdue penalties';

-- ========================================
-- 9. Seed data for existing users
-- ========================================

-- Create profiles for existing org members without profiles
INSERT INTO public.user_profiles (user_id, full_name, role_level, employment_status)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    'mid', -- Default to mid-level
    'active'
FROM auth.users u
LEFT JOIN public.user_profiles up ON up.user_id = u.id
WHERE up.id IS NULL
AND EXISTS (
    SELECT 1 FROM public.org_members om WHERE om.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- 10. Verification queries
-- ========================================

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check created profiles
SELECT 
    up.full_name,
    up.role_level,
    up.department,
    up.employment_status,
    u.email
FROM public.user_profiles up
JOIN auth.users u ON u.id = up.user_id
LIMIT 5;

-- Check team overview
SELECT * FROM public.team_members_overview LIMIT 5;
