-- Migration 016: Subscription tiers and role-based data visibility
-- Purpose: Control what data is visible to different roles and subscription levels

-- Subscription tiers
CREATE TYPE public.subscription_tier AS ENUM ('free', 'team', 'business', 'enterprise');

-- Add subscription to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS subscription_tier public.subscription_tier DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Data visibility rules table
CREATE TABLE IF NOT EXISTS public.data_visibility_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What data
  table_name text NOT NULL,
  column_name text,
  feature_key text NOT NULL, -- e.g., 'daily_checkins', 'behavioral_profiles', 'ai_insights'
  
  -- Who can see it
  min_role text NOT NULL CHECK (min_role IN ('viewer', 'member', 'manager', 'owner')),
  min_subscription_tier public.subscription_tier NOT NULL,
  
  -- Additional constraints
  self_only boolean DEFAULT false, -- User can only see their own data
  aggregated_only boolean DEFAULT false, -- Only aggregated/anonymized data
  
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Insert visibility rules
INSERT INTO public.data_visibility_rules (feature_key, table_name, column_name, min_role, min_subscription_tier, self_only, aggregated_only, description) VALUES
  -- FREE TIER --
  -- Basic user profile (everyone can see basics)
  ('user_profiles_basic', 'user_profiles', 'full_name,display_name,position_title,role_level', 'member', 'free', false, false, 'Basic profile info visible to all team members'),
  ('user_profiles_own', 'user_profiles', '*', 'member', 'free', true, false, 'Users can see their full profile'),
  
  -- Own mood check-ins
  ('daily_checkins_own', 'daily_check_ins', '*', 'member', 'free', true, false, 'Users see their own daily check-ins'),
  
  -- Manager sees team status (aggregated only on free)
  ('team_daily_status_aggregated', 'daily_check_ins', 'mood_score,stress_score,wants_day_off', 'manager', 'free', false, true, 'Managers see aggregated team mood (free tier)'),
  
  -- TEAM TIER ($9/user/month) --
  -- Manager sees individual check-ins
  ('team_daily_status_individual', 'daily_check_ins', '*', 'manager', 'team', false, false, 'Managers see individual daily check-ins'),
  
  -- Performance metrics (basic)
  ('performance_metrics_basic', 'user_performance_metrics', 'meetings_created,meetings_attended,comments_posted', 'manager', 'team', false, false, 'Basic performance metrics'),
  
  -- Subjective check-ins history (30 days)
  ('subjective_checkins_history', 'subjective_checkins', '*', 'member', 'team', true, false, 'Users see their 30-day mood history'),
  
  -- BUSINESS TIER ($19/user/month) --
  -- Behavioral profiles
  ('behavioral_profiles_view', 'behavioral_profiles', '*', 'manager', 'business', false, false, 'Managers see team behavioral profiles'),
  
  -- Context snapshots
  ('context_snapshots_view', 'context_snapshots', '*', 'manager', 'business', false, false, 'Managers see team context (vacation, capacity)'),
  
  -- Social graph (anonymized)
  ('social_graph_anonymized', 'social_interactions', 'interaction_type,weight', 'manager', 'business', false, true, 'Team collaboration patterns'),
  
  -- Performance reviews
  ('performance_reviews_view', 'performance_reviews', '*', 'manager', 'business', false, false, 'Full performance review access'),
  
  -- ENTERPRISE TIER ($49/user/month) --
  -- AI insights and predictions
  ('ai_insights_full', 'ai_insights', '*', 'manager', 'enterprise', false, false, 'AI-powered burnout prediction and recommendations'),
  
  -- Compensation data (owner only)
  ('compensation_view', 'compensation_records', '*', 'owner', 'enterprise', false, false, 'Salary and compensation history'),
  
  -- Full social graph with names
  ('social_graph_full', 'social_interactions', '*', 'manager', 'enterprise', false, false, 'Full social network analysis'),
  
  -- Career progression tracking
  ('career_history_view', 'career_history', '*', 'manager', 'enterprise', false, false, 'Career path and promotion tracking'),
  
  -- Advanced analytics (owners)
  ('advanced_analytics', 'user_performance_metrics', '*', 'owner', 'enterprise', false, false, 'Full analytics suite');

CREATE INDEX IF NOT EXISTS idx_visibility_rules_feature ON public.data_visibility_rules(feature_key);

-- Function to check if user has access to feature
CREATE OR REPLACE FUNCTION public.can_access_feature(
  p_user_id uuid,
  p_org_id uuid,
  p_feature_key text
)
RETURNS boolean AS $$
DECLARE
  v_user_role text;
  v_org_tier public.subscription_tier;
  v_rule record;
  v_role_priority int;
  v_min_role_priority int;
  v_tier_priority int;
  v_min_tier_priority int;
BEGIN
  -- Get user's role
  SELECT role INTO v_user_role
  FROM public.org_members
  WHERE user_id = p_user_id AND org_id = p_org_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get org subscription tier
  SELECT subscription_tier INTO v_org_tier
  FROM public.organizations
  WHERE id = p_org_id;
  
  -- Get visibility rule
  SELECT * INTO v_rule
  FROM public.data_visibility_rules
  WHERE feature_key = p_feature_key
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- No rule = not accessible
    RETURN false;
  END IF;
  
  -- Role priority: viewer=1, member=2, manager=3, owner=4
  v_role_priority := CASE v_user_role
    WHEN 'viewer' THEN 1
    WHEN 'member' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'owner' THEN 4
    ELSE 0
  END;
  
  v_min_role_priority := CASE v_rule.min_role
    WHEN 'viewer' THEN 1
    WHEN 'member' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'owner' THEN 4
    ELSE 0
  END;
  
  -- Tier priority: free=1, team=2, business=3, enterprise=4
  v_tier_priority := CASE v_org_tier
    WHEN 'free' THEN 1
    WHEN 'team' THEN 2
    WHEN 'business' THEN 3
    WHEN 'enterprise' THEN 4
    ELSE 0
  END;
  
  v_min_tier_priority := CASE v_rule.min_subscription_tier
    WHEN 'free' THEN 1
    WHEN 'team' THEN 2
    WHEN 'business' THEN 3
    WHEN 'enterprise' THEN 4
    ELSE 0
  END;
  
  -- Check access
  RETURN v_role_priority >= v_min_role_priority 
    AND v_tier_priority >= v_min_tier_priority;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for feature access per user
CREATE OR REPLACE VIEW public.user_feature_access AS
SELECT 
  om.user_id,
  om.org_id,
  om.role,
  o.subscription_tier,
  dvr.feature_key,
  dvr.description,
  public.can_access_feature(om.user_id, om.org_id, dvr.feature_key) as has_access
FROM public.org_members om
CROSS JOIN public.data_visibility_rules dvr
JOIN public.organizations o ON om.org_id = o.id;

-- Function to get accessible features for user
CREATE OR REPLACE FUNCTION public.get_user_features(p_user_id uuid, p_org_id uuid)
RETURNS TABLE(feature_key text, description text) AS $$
BEGIN
  RETURN QUERY
  SELECT dvr.feature_key, dvr.description
  FROM public.data_visibility_rules dvr
  WHERE public.can_access_feature(p_user_id, p_org_id, dvr.feature_key) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tier comparison view (for pricing page)
CREATE OR REPLACE VIEW public.subscription_tier_features AS
SELECT 
  min_subscription_tier as tier,
  feature_key,
  min_role,
  description
FROM public.data_visibility_rules
ORDER BY 
  CASE min_subscription_tier
    WHEN 'free' THEN 1
    WHEN 'team' THEN 2
    WHEN 'business' THEN 3
    WHEN 'enterprise' THEN 4
  END,
  CASE min_role
    WHEN 'member' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'owner' THEN 3
  END;

COMMENT ON TABLE public.data_visibility_rules IS 'Defines what data is visible to which roles and subscription tiers';
COMMENT ON FUNCTION public.can_access_feature IS 'Check if user can access a feature based on role and subscription';
COMMENT ON VIEW public.user_feature_access IS 'Complete feature access matrix for all users';
COMMENT ON VIEW public.subscription_tier_features IS 'Features available at each subscription tier (for pricing page)';
