-- Migration 013: People Analytics Extension
-- Purpose: Capture behavioral, subjective, context, social, compensation/career, AI insights, and technical metadata
-- Created: 2025-10-31

-- ========================================
-- 1) Behavioral profiles (static/slow-changing traits)
-- ========================================
CREATE TABLE IF NOT EXISTS public.behavioral_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  personality_type text, -- e.g., MBTI code or other label
  big_five jsonb,        -- {openness, conscientiousness, extraversion, agreeableness, neuroticism}
  dominance text,        -- e.g., 'introvert', 'extrovert', 'balanced'
  motivators jsonb,      -- e.g., {recognition: true, purpose: true, stability: false}
  work_tempo text CHECK (work_tempo IN ('fast','balanced','precise')),
  emotional_stability numeric(4,2) CHECK (emotional_stability BETWEEN 0 AND 1),
  communication_style text, -- e.g., 'concise', 'detailed', 'direct', 'empathetic'
  feedback_openness numeric(4,2) CHECK (feedback_openness BETWEEN 0 AND 1),
  collaboration_score numeric(5,2) CHECK (collaboration_score BETWEEN 0 AND 100),
  autonomy_level numeric(5,2) CHECK (autonomy_level BETWEEN 0 AND 100),

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, org_id)
);

CREATE OR REPLACE FUNCTION public.update_behavioral_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_behavioral_profiles
  BEFORE UPDATE ON public.behavioral_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_behavioral_profiles_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_behavioral_profiles_user ON public.behavioral_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_profiles_org ON public.behavioral_profiles(org_id);

-- RLS
ALTER TABLE public.behavioral_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "behavioral_view_self" ON public.behavioral_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "behavioral_view_managers" ON public.behavioral_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = behavioral_profiles.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);
CREATE POLICY "behavioral_upsert_self" ON public.behavioral_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "behavioral_update_self" ON public.behavioral_profiles FOR UPDATE USING (user_id = auth.uid());

-- ========================================
-- 2) Subjective metrics (self-reports, feedback)
-- ========================================
CREATE TABLE IF NOT EXISTS public.subjective_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  checkin_at timestamptz DEFAULT now() NOT NULL,
  metric text NOT NULL CHECK (metric IN ('self_performance','satisfaction','trust','meaning','stress','mood')),
  score integer CHECK (score BETWEEN 1 AND 10),
  mood_emoji text,   -- optional emoji label
  comment text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_subjective_user_time ON public.subjective_checkins(user_id, checkin_at desc);
CREATE INDEX IF NOT EXISTS idx_subjective_org_time ON public.subjective_checkins(org_id, checkin_at desc);

ALTER TABLE public.subjective_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjective_view_self" ON public.subjective_checkins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "subjective_insert_self" ON public.subjective_checkins FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "subjective_view_managers" ON public.subjective_checkins FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = subjective_checkins.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);

-- Latest subjective state per metric
CREATE OR REPLACE VIEW public.current_subjective_state AS
SELECT DISTINCT ON (user_id, org_id, metric)
  user_id, org_id, metric, score, mood_emoji, comment, checkin_at
FROM public.subjective_checkins
ORDER BY user_id, org_id, metric, checkin_at DESC;

-- ========================================
-- 3) Context snapshots (environment and availability)
-- ========================================
CREATE TABLE IF NOT EXISTS public.context_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  snapshot_at timestamptz DEFAULT now() NOT NULL,
  work_mode text CHECK (work_mode IN ('remote','hybrid','onsite')),
  chronotype text CHECK (chronotype IN ('morning','evening','neutral')),
  sleep_hours numeric(4,2) CHECK (sleep_hours BETWEEN 0 AND 24),
  health_note text,
  on_sick_leave boolean,
  weekly_capacity_hours integer CHECK (weekly_capacity_hours BETWEEN 0 AND 80),
  on_vacation boolean,
  project_context jsonb,   -- e.g., {client_type: 'enterprise', complexity: 'high'}
  company_context jsonb    -- e.g., {season: 'Q4', crisis: false}
);

CREATE INDEX IF NOT EXISTS idx_context_user_time ON public.context_snapshots(user_id, snapshot_at desc);
CREATE INDEX IF NOT EXISTS idx_context_org_time ON public.context_snapshots(org_id, snapshot_at desc);

ALTER TABLE public.context_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "context_view_self" ON public.context_snapshots FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "context_insert_self" ON public.context_snapshots FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "context_view_managers" ON public.context_snapshots FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = context_snapshots.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);

CREATE OR REPLACE VIEW public.user_context_current AS
SELECT DISTINCT ON (user_id, org_id)
  user_id, org_id, snapshot_at, work_mode, chronotype, weekly_capacity_hours, on_vacation
FROM public.context_snapshots
ORDER BY user_id, org_id, snapshot_at DESC;

-- ========================================
-- 4) Social graph
-- ========================================
CREATE TABLE IF NOT EXISTS public.social_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL, -- 'comment','reaction','pairing','meeting','kudos','conflict'
  weight integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_social_pairs ON public.social_interactions(org_id, from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_social_type_time ON public.social_interactions(interaction_type, created_at desc);

ALTER TABLE public.social_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_view_self" ON public.social_interactions FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
CREATE POLICY "social_view_managers" ON public.social_interactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = social_interactions.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);
CREATE POLICY "social_insert_self" ON public.social_interactions FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.mentoring_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  mentor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz
);

ALTER TABLE public.mentoring_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mentoring_view_self" ON public.mentoring_relations FOR SELECT USING (mentor_user_id = auth.uid() OR mentee_user_id = auth.uid());
CREATE POLICY "mentoring_view_managers" ON public.mentoring_relations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = mentoring_relations.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);
CREATE POLICY "mentoring_insert_self" ON public.mentoring_relations FOR INSERT WITH CHECK (mentor_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.social_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type text CHECK (feedback_type IN ('kudos','thanks','conflict','report')),
  score integer, -- optional score scale
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.social_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_view_self" ON public.social_feedback FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
CREATE POLICY "feedback_view_managers" ON public.social_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = social_feedback.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);
CREATE POLICY "feedback_insert_self" ON public.social_feedback FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE OR REPLACE VIEW public.social_network_overview AS
SELECT 
  org_id,
  to_user_id AS user_id,
  COUNT(*) FILTER (WHERE feedback_type IN ('kudos','thanks')) AS kudos_received,
  COUNT(*) FILTER (WHERE feedback_type = 'conflict') AS conflicts_received
FROM public.social_feedback
GROUP BY org_id, to_user_id;

-- ========================================
-- 5) Compensation and career
-- ========================================
CREATE TABLE IF NOT EXISTS public.compensation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  effective_from date NOT NULL,
  base_salary numeric(14,2) NOT NULL,
  currency text DEFAULT 'EUR',
  bonus_structure jsonb,
  note text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comp_user_time ON public.compensation_records(user_id, effective_from desc);

ALTER TABLE public.compensation_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comp_view_self" ON public.compensation_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "comp_view_managers" ON public.compensation_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = compensation_records.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);
CREATE POLICY "comp_upsert_managers" ON public.compensation_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = compensation_records.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);
CREATE POLICY "comp_update_managers" ON public.compensation_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = compensation_records.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);

CREATE TABLE IF NOT EXISTS public.career_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  position_title text,
  level text,
  department text,
  start_date date,
  end_date date,
  reason text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.career_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_view_self" ON public.career_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "career_view_managers" ON public.career_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = career_history.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);
CREATE POLICY "career_insert_manager" ON public.career_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = career_history.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);

CREATE TABLE IF NOT EXISTS public.promotion_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('ready','candidate','not-eligible')),
  recommendation text,
  decided_by uuid REFERENCES auth.users(id),
  decided_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.promotion_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promo_view_managers" ON public.promotion_candidates FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = promotion_candidates.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);
CREATE POLICY "promo_insert_managers" ON public.promotion_candidates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = promotion_candidates.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);

-- ========================================
-- 6) AI & analytics insights
-- ========================================
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  ai_performance_score numeric(5,2),
  development_recommendations text,
  burnout_risk numeric(5,2),
  growth_prediction numeric(5,2),
  behavior_patterns text,
  model text,
  calculated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, org_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_ai_user_period ON public.ai_insights(user_id, period_start, period_end);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_view_self" ON public.ai_insights FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ai_view_managers" ON public.ai_insights FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = ai_insights.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);
CREATE POLICY "ai_insert_managers" ON public.ai_insights FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = ai_insights.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);
CREATE POLICY "ai_update_managers" ON public.ai_insights FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = ai_insights.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);

CREATE OR REPLACE VIEW public.ai_risk_dashboard AS
SELECT DISTINCT ON (user_id, org_id)
  user_id, org_id, ai_performance_score, burnout_risk, growth_prediction, calculated_at
FROM public.ai_insights
ORDER BY user_id, org_id, calculated_at DESC;

-- ========================================
-- 7) Technical metadata
-- ========================================
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_type text,
  os text,
  timezone text,
  ip_hash text,
  session_started_at timestamptz NOT NULL,
  session_ended_at timestamptz,
  duration_seconds integer
);

CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON public.device_sessions(user_id, session_started_at desc);

ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "device_view_self" ON public.device_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "device_view_managers" ON public.device_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = device_sessions.org_id AND om.user_id = auth.uid() AND om.role IN ('owner','manager'))
);
CREATE POLICY "device_insert_self" ON public.device_sessions FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.integration_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service text NOT NULL CHECK (service IN ('github','slack','google_calendar','notion')),
  external_user_id text,
  scopes text[],
  connected_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_integrations_user_service ON public.integration_accounts(user_id, service);

ALTER TABLE public.integration_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration_view_self" ON public.integration_accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "integration_insert_self" ON public.integration_accounts FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.privacy_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gdpr_consent boolean DEFAULT false,
  tracking_opt_in boolean DEFAULT false,
  anonymize_metrics boolean DEFAULT false,
  consent_text_version text,
  granted_at timestamptz,
  revoked_at timestamptz
);

ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_view_self" ON public.privacy_consents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "consent_insert_self" ON public.privacy_consents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "consent_update_self" ON public.privacy_consents FOR UPDATE USING (user_id = auth.uid());

-- ========================================
-- 8) Comments
-- ========================================
COMMENT ON TABLE public.behavioral_profiles IS 'Behavioral and psychological traits per user';
COMMENT ON TABLE public.subjective_checkins IS 'Self-reported subjective metrics and mood check-ins';
COMMENT ON TABLE public.context_snapshots IS 'Context factors like work mode, chronotype, capacity, vacation';
COMMENT ON TABLE public.social_interactions IS 'Interaction edges for social graph and dynamics';
COMMENT ON TABLE public.mentoring_relations IS 'Mentoring relationships across the organization';
COMMENT ON TABLE public.social_feedback IS 'Kudos/conflicts and social feedback';
COMMENT ON TABLE public.compensation_records IS 'Compensation history (sensitive)';
COMMENT ON TABLE public.career_history IS 'Career and position history';
COMMENT ON TABLE public.promotion_candidates IS 'Promotion candidacy tracking';
COMMENT ON TABLE public.ai_insights IS 'AI-generated analytics and risk signals';
COMMENT ON TABLE public.device_sessions IS 'Technical sessions metadata (anonymized IP)';
COMMENT ON TABLE public.integration_accounts IS 'Linked third-party integrations (no tokens)';
COMMENT ON TABLE public.privacy_consents IS 'User privacy and GDPR consents';
