-- Migration 012: Performance Metrics
-- Purpose: Track objective performance data for users
-- Created: 2025-10-31

-- ========================================
-- 1. Create user_performance_metrics table
-- ========================================

CREATE TABLE IF NOT EXISTS public.user_performance_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Productivity metrics
    tasks_completed_count integer DEFAULT 0,
    tasks_completed_on_time integer DEFAULT 0,
    tasks_completed_late integer DEFAULT 0,
    average_task_completion_days numeric(5,2), -- Average days to complete tasks
    estimated_vs_actual_ratio numeric(5,2), -- Ratio of estimated time to actual (1.0 = perfect estimate)
    
    -- Quality metrics
    tasks_requiring_rework integer DEFAULT 0,
    feedback_requests_received integer DEFAULT 0,
    bugs_reported integer DEFAULT 0,
    manager_rating numeric(3,2), -- 0.00 to 5.00
    peer_rating numeric(3,2), -- 0.00 to 5.00
    
    -- Activity metrics
    total_logins integer DEFAULT 0,
    meetings_created integer DEFAULT 0,
    meetings_attended integer DEFAULT 0,
    comments_posted integer DEFAULT 0,
    reactions_given integer DEFAULT 0,
    
    -- Initiative metrics
    ideas_submitted integer DEFAULT 0,
    proposals_created integer DEFAULT 0,
    voluntary_tasks_taken integer DEFAULT 0,
    help_requests_fulfilled integer DEFAULT 0,
    
    -- Project involvement
    active_projects_count integer DEFAULT 0,
    projects_led_count integer DEFAULT 0,
    projects_member_count integer DEFAULT 0,
    
    -- Output metrics
    commits_count integer DEFAULT 0, -- If integrated with Git
    documents_created integer DEFAULT 0,
    reports_submitted integer DEFAULT 0,
    completion_rate numeric(5,2), -- Percentage of completed vs assigned tasks
    
    -- Time period
    period_start date NOT NULL,
    period_end date NOT NULL,
    period_type text DEFAULT 'month' CHECK (period_type IN ('week', 'month', 'quarter', 'year')),
    
    -- Metadata
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    last_calculated_at timestamptz,
    
    -- Ensure one record per user per org per period
    UNIQUE(user_id, org_id, period_start, period_end)
);

-- ========================================
-- 2. Create performance_reviews table
-- ========================================

CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    review_type text NOT NULL CHECK (review_type IN ('manager', 'peer', 'self', '360')),
    
    -- Ratings (1-5 scale)
    technical_skills_rating integer CHECK (technical_skills_rating BETWEEN 1 AND 5),
    communication_rating integer CHECK (communication_rating BETWEEN 1 AND 5),
    collaboration_rating integer CHECK (collaboration_rating BETWEEN 1 AND 5),
    initiative_rating integer CHECK (initiative_rating BETWEEN 1 AND 5),
    quality_rating integer CHECK (quality_rating BETWEEN 1 AND 5),
    productivity_rating integer CHECK (productivity_rating BETWEEN 1 AND 5),
    overall_rating integer CHECK (overall_rating BETWEEN 1 AND 5),
    
    -- Qualitative feedback
    strengths text,
    areas_for_improvement text,
    comments text,
    goals_set text,
    
    -- Review period
    review_period_start date,
    review_period_end date,
    
    -- Status
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged')),
    submitted_at timestamptz,
    acknowledged_at timestamptz,
    
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- ========================================
-- 3. Create activity_log table
-- ========================================

CREATE TABLE IF NOT EXISTS public.activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    activity_type text NOT NULL, -- 'login', 'task_completed', 'meeting_created', 'comment_posted', etc.
    entity_type text, -- 'task', 'project', 'meeting', 'document', etc.
    entity_id uuid, -- Reference to the entity
    
    metadata jsonb DEFAULT '{}'::jsonb, -- Additional context data
    
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ========================================
-- 4. Create indexes for performance
-- ========================================

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.user_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_org_id ON public.user_performance_metrics(org_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_period ON public.user_performance_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_period ON public.user_performance_metrics(user_id, period_start, period_end);

-- Performance reviews indexes
CREATE INDEX IF NOT EXISTS idx_performance_reviews_user_id ON public.performance_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_reviewer_id ON public.performance_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_org_id ON public.performance_reviews(org_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON public.performance_reviews(status);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_org_id ON public.activity_log(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_activity_type ON public.activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log(entity_type, entity_id);

-- ========================================
-- 5. RLS Policies
-- ========================================

-- Performance metrics policies
ALTER TABLE public.user_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_metrics" ON public.user_performance_metrics
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "managers_can_view_team_metrics" ON public.user_performance_metrics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.org_id = user_performance_metrics.org_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'manager')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.user_id = user_performance_metrics.user_id
            AND om.manager_id = auth.uid()
        )
    );

-- Performance reviews policies
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_reviews" ON public.performance_reviews
    FOR SELECT
    USING (user_id = auth.uid() OR reviewer_id = auth.uid());

CREATE POLICY "managers_can_view_team_reviews" ON public.performance_reviews
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.org_id = performance_reviews.org_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "reviewers_can_create_reviews" ON public.performance_reviews
    FOR INSERT
    WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "reviewers_can_update_own_reviews" ON public.performance_reviews
    FOR UPDATE
    USING (reviewer_id = auth.uid() AND status = 'draft');

-- Activity log policies
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_activity" ON public.activity_log
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "managers_can_view_team_activity" ON public.activity_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.org_id = activity_log.org_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'manager')
        )
    );

-- ========================================
-- 6. Functions for calculating metrics
-- ========================================

-- Function to calculate current period metrics
CREATE OR REPLACE FUNCTION public.calculate_user_metrics(
    p_user_id uuid,
    p_org_id uuid,
    p_period_start date,
    p_period_end date
)
RETURNS void AS $$
DECLARE
    v_tasks_completed integer;
    v_tasks_on_time integer;
    v_tasks_late integer;
    v_completion_rate numeric;
    v_meetings_created integer;
    v_meetings_attended integer;
    v_comments_count integer;
    v_active_projects integer;
    v_projects_led integer;
BEGIN
    -- Calculate task metrics (disabled - tasks table structure unknown)
    v_tasks_completed := 0;
    v_tasks_on_time := 0;
    v_tasks_late := 0;
    v_completion_rate := 0;
    
    -- Calculate meeting metrics
    SELECT COUNT(*)
    INTO v_meetings_created
    FROM public.meetings
    WHERE created_by = p_user_id
    AND start_time::date BETWEEN p_period_start AND p_period_end;
    
    SELECT COUNT(DISTINCT mp.meeting_id)
    INTO v_meetings_attended
    FROM public.meeting_participants mp
    JOIN public.meetings m ON m.id = mp.meeting_id
    WHERE mp.user_id = p_user_id
    AND m.start_time::date BETWEEN p_period_start AND p_period_end;
    
    -- Calculate activity metrics from activity_log
    SELECT COUNT(*)
    INTO v_comments_count
    FROM public.activity_log
    WHERE user_id = p_user_id
    AND activity_type = 'comment_posted'
    AND created_at::date BETWEEN p_period_start AND p_period_end;
    
    -- Calculate project involvement (disabled - schema unknown)
    v_active_projects := 0;
    v_projects_led := 0;
    
    -- Insert or update metrics
    INSERT INTO public.user_performance_metrics (
        user_id,
        org_id,
        period_start,
        period_end,
        tasks_completed_count,
        tasks_completed_on_time,
        tasks_completed_late,
        completion_rate,
        meetings_created,
        meetings_attended,
        comments_posted,
        active_projects_count,
        projects_led_count,
        last_calculated_at
    ) VALUES (
        p_user_id,
        p_org_id,
        p_period_start,
        p_period_end,
        v_tasks_completed,
        v_tasks_on_time,
        v_tasks_late,
        v_completion_rate,
        v_meetings_created,
        v_meetings_attended,
        v_comments_count,
        v_active_projects,
        v_projects_led,
        now()
    )
    ON CONFLICT (user_id, org_id, period_start, period_end)
    DO UPDATE SET
        tasks_completed_count = EXCLUDED.tasks_completed_count,
        tasks_completed_on_time = EXCLUDED.tasks_completed_on_time,
        tasks_completed_late = EXCLUDED.tasks_completed_late,
        completion_rate = EXCLUDED.completion_rate,
        meetings_created = EXCLUDED.meetings_created,
        meetings_attended = EXCLUDED.meetings_attended,
        comments_posted = EXCLUDED.comments_posted,
        active_projects_count = EXCLUDED.active_projects_count,
        projects_led_count = EXCLUDED.projects_led_count,
        last_calculated_at = now(),
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_user_id uuid,
    p_org_id uuid,
    p_activity_type text,
    p_entity_type text DEFAULT NULL,
    p_entity_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
    v_log_id uuid;
BEGIN
    INSERT INTO public.activity_log (
        user_id,
        org_id,
        activity_type,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        p_user_id,
        p_org_id,
        p_activity_type,
        p_entity_type,
        p_entity_id,
        p_metadata
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. Views for performance analytics
-- ========================================

-- Current month metrics for all users
CREATE OR REPLACE VIEW public.current_month_performance AS
SELECT 
    upm.*,
    up.full_name,
    up.position_title,
    up.department,
    up.role_level,
    om.role as org_role
FROM public.user_performance_metrics upm
JOIN public.user_profiles up ON up.user_id = upm.user_id
JOIN public.org_members om ON om.user_id = upm.user_id AND om.org_id = upm.org_id
WHERE upm.period_start = date_trunc('month', CURRENT_DATE)::date
AND upm.period_end = (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date;

-- User performance summary with rankings
CREATE OR REPLACE VIEW public.user_performance_summary AS
SELECT 
    upm.user_id,
    upm.org_id,
    up.full_name,
    up.position_title,
    up.department,
    
    -- Latest period metrics
    upm.tasks_completed_count,
    upm.completion_rate,
    upm.tasks_completed_on_time,
    upm.meetings_attended,
    upm.active_projects_count,
    
    -- Rankings within org
    RANK() OVER (PARTITION BY upm.org_id ORDER BY upm.completion_rate DESC NULLS LAST) as completion_rank,
    RANK() OVER (PARTITION BY upm.org_id ORDER BY upm.tasks_completed_count DESC) as productivity_rank,
    
    -- Average ratings from reviews
    (SELECT AVG(overall_rating) 
     FROM public.performance_reviews pr 
     WHERE pr.user_id = upm.user_id 
     AND pr.status = 'submitted'
     AND pr.review_period_end >= CURRENT_DATE - interval '1 year'
    ) as avg_rating_last_year,
    
    upm.period_start,
    upm.period_end,
    upm.last_calculated_at
FROM public.user_performance_metrics upm
JOIN public.user_profiles up ON up.user_id = upm.user_id
WHERE upm.period_start = (
    SELECT MAX(period_start) 
    FROM public.user_performance_metrics upm2 
    WHERE upm2.user_id = upm.user_id
);

-- ========================================
-- 8. Triggers for automatic activity logging
-- ========================================

-- Note: Task completion trigger disabled due to unknown tasks table structure
-- Implement manually when tasks schema is confirmed

-- Log meeting creation
CREATE OR REPLACE FUNCTION public.log_meeting_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.log_user_activity(
        NEW.created_by,
        (SELECT org_id FROM public.projects WHERE id = NEW.project_id),
        'meeting_created',
        'meeting',
        NEW.id,
        jsonb_build_object('meeting_title', NEW.title)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_meeting_creation
    AFTER INSERT ON public.meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.log_meeting_creation();

-- ========================================
-- 9. Comments for documentation
-- ========================================

COMMENT ON TABLE public.user_performance_metrics IS 'Objective performance metrics calculated per user per time period';
COMMENT ON TABLE public.performance_reviews IS 'Subjective performance reviews from managers and peers';
COMMENT ON TABLE public.activity_log IS 'Audit log of all user activities in the system';
COMMENT ON FUNCTION public.calculate_user_metrics IS 'Calculate and store performance metrics for a user in a specific period';
COMMENT ON FUNCTION public.log_user_activity IS 'Log a user activity event';

-- ========================================
-- 10. Initialize current month metrics
-- ========================================

-- Calculate metrics for current month for all active users
DO $$
DECLARE
    v_user record;
    v_period_start date := date_trunc('month', CURRENT_DATE)::date;
    v_period_end date := (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date;
BEGIN
    FOR v_user IN 
        SELECT DISTINCT om.user_id, om.org_id
        FROM public.org_members om
        JOIN public.user_profiles up ON up.user_id = om.user_id
        WHERE up.employment_status = 'active'
    LOOP
        PERFORM public.calculate_user_metrics(
            v_user.user_id,
            v_user.org_id,
            v_period_start,
            v_period_end
        );
    END LOOP;
END $$;
