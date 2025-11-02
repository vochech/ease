-- Migration 015: Daily check-ins and adaptive workload
-- Purpose: Enable daily mood/context updates for smart task recommendations

-- Add daily check-in tracking
ALTER TABLE public.subjective_checkins
ADD COLUMN IF NOT EXISTS affects_scope text CHECK (affects_scope IN ('today', 'this_week', 'ongoing'));

-- Add task recommendation preferences
CREATE TABLE IF NOT EXISTS public.daily_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  mood_score integer CHECK (mood_score BETWEEN 1 AND 10),
  stress_score integer CHECK (stress_score BETWEEN 1 AND 10),
  energy_level integer CHECK (energy_level BETWEEN 1 AND 10),
  
  -- Context flags
  had_difficult_morning boolean DEFAULT false,
  family_situation text, -- 'all_good', 'minor_issue', 'serious_issue'
  external_stressors text[], -- ['traffic', 'health', 'family', 'personal']
  
  -- Work preferences for today
  preferred_task_complexity text CHECK (preferred_task_complexity IN ('light', 'normal', 'challenging')),
  can_handle_meetings boolean DEFAULT true,
  needs_quiet_time boolean DEFAULT false,
  available_hours_today integer CHECK (available_hours_today BETWEEN 0 AND 12),
  
  -- AI suggestion overrides
  wants_lighter_day boolean DEFAULT false,
  wants_day_off boolean DEFAULT false,
  manager_notified boolean DEFAULT false,
  
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, org_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON public.daily_check_ins(user_id, check_in_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_org_date ON public.daily_check_ins(org_id, check_in_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_day_off_requests ON public.daily_check_ins(org_id, check_in_date) 
  WHERE wants_day_off = true AND manager_notified = false;

-- RLS
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_checkin_view_self" ON public.daily_check_ins 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "daily_checkin_view_managers" ON public.daily_check_ins 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om 
      WHERE om.org_id = daily_check_ins.org_id 
        AND om.user_id = auth.uid() 
        AND om.role IN ('owner','manager')
    )
  );

CREATE POLICY "daily_checkin_insert_self" ON public.daily_check_ins 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_checkin_update_self" ON public.daily_check_ins 
  FOR UPDATE USING (user_id = auth.uid());

-- View for today's team status (managers)
CREATE OR REPLACE VIEW public.team_daily_status AS
SELECT 
  dc.org_id,
  dc.user_id,
  dc.check_in_date,
  dc.mood_score,
  dc.stress_score,
  dc.energy_level,
  dc.preferred_task_complexity,
  dc.wants_lighter_day,
  dc.wants_day_off,
  dc.manager_notified,
  dc.external_stressors,
  up.full_name,
  up.display_name,
  CASE 
    WHEN dc.wants_day_off THEN 'needs_attention'
    WHEN dc.stress_score >= 8 OR dc.mood_score <= 3 THEN 'struggling'
    WHEN dc.wants_lighter_day THEN 'needs_support'
    WHEN dc.energy_level <= 4 THEN 'low_energy'
    ELSE 'good'
  END as status_flag
FROM public.daily_check_ins dc
JOIN public.user_profiles up ON dc.user_id = up.user_id AND dc.org_id = up.org_id
WHERE dc.check_in_date = CURRENT_DATE;

-- Function to get recommended task complexity for user
CREATE OR REPLACE FUNCTION public.get_recommended_task_complexity(p_user_id uuid, p_org_id uuid)
RETURNS text AS $$
DECLARE
  v_check_in record;
  v_complexity text;
BEGIN
  -- Get today's check-in
  SELECT * INTO v_check_in
  FROM public.daily_check_ins
  WHERE user_id = p_user_id 
    AND org_id = p_org_id 
    AND check_in_date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    -- No check-in today, assume normal
    RETURN 'normal';
  END IF;
  
  -- Use explicit preference if set
  IF v_check_in.preferred_task_complexity IS NOT NULL THEN
    RETURN v_check_in.preferred_task_complexity;
  END IF;
  
  -- Calculate based on scores
  IF v_check_in.wants_lighter_day OR v_check_in.stress_score >= 8 OR v_check_in.energy_level <= 3 THEN
    RETURN 'light';
  ELSIF v_check_in.energy_level >= 8 AND v_check_in.stress_score <= 4 THEN
    RETURN 'challenging';
  ELSE
    RETURN 'normal';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.daily_check_ins IS 'Daily morning check-ins for adaptive task recommendations';
COMMENT ON VIEW public.team_daily_status IS 'Managers view of team daily status with flags';
COMMENT ON FUNCTION public.get_recommended_task_complexity IS 'Returns recommended task complexity based on daily check-in';
