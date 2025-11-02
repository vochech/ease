-- Migration 017: Organization and User Settings
-- Purpose: Provide configurable settings per organization and per user
-- Created: 2025-11-02

-- ==============================
-- 1) Organization settings
-- ==============================
CREATE TABLE IF NOT EXISTS public.org_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  timezone text DEFAULT 'Europe/Prague',
  work_days text[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  default_work_hours_per_day integer DEFAULT 8 CHECK (default_work_hours_per_day BETWEEN 0 AND 12),
  notifications jsonb DEFAULT '{}'::jsonb,
  meeting_policy jsonb DEFAULT '{}'::jsonb,
  ai_assistant_enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_settings_org ON public.org_settings(org_id);

ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- Members can view their org settings
CREATE POLICY "org_settings_view_members" ON public.org_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = org_settings.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Only owner/manager can insert/update
CREATE POLICY "org_settings_upsert_admins" ON public.org_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = org_settings.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','manager')
    )
  );

CREATE POLICY "org_settings_update_admins" ON public.org_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = org_settings.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','manager')
    )
  );

CREATE OR REPLACE FUNCTION public.update_org_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_org_settings
  BEFORE UPDATE ON public.org_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_org_settings_updated_at();

COMMENT ON TABLE public.org_settings IS 'Configurable settings per organization (work week, timezone, policies)';

-- ==============================
-- 2) User settings
-- ==============================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  theme text DEFAULT 'system' CHECK (theme IN ('system','light','dark')),
  language text DEFAULT 'cs',
  notifications jsonb DEFAULT '{}'::jsonb,
  focus_start time,
  focus_end time,
  meeting_reminders boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_org ON public.user_settings(user_id, org_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- User can view and update their own settings
CREATE POLICY "user_settings_view_self" ON public.user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_settings_insert_self" ON public.user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_update_self" ON public.user_settings
  FOR UPDATE USING (user_id = auth.uid());

-- Managers/Owners can view team members' settings (read-only)
CREATE POLICY "user_settings_view_managers" ON public.user_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = user_settings.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','manager')
    )
  );

CREATE OR REPLACE FUNCTION public.update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_settings_updated_at();

COMMENT ON TABLE public.user_settings IS 'Per-user preferences within an organization (theme, locale, notifications)';
