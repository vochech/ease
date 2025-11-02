-- Time Tracking System Migration
-- Purpose: Add time entries, tracking settings, and billable rates for agencies/freelancers

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TIME ENTRIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time data
  started_at timestamptz NOT NULL,
  ended_at timestamptz,                    -- NULL = timer running
  duration_minutes integer,                -- Computed or manually entered
  
  -- Work context
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Description
  description text,
  tags text[],                             -- ['development', 'meeting', 'bug-fix']
  
  -- Billing
  billable boolean DEFAULT true,
  hourly_rate numeric(10,2),               -- Override default rate if needed
  
  -- Workflow
  status text DEFAULT 'draft',             -- 'draft', 'submitted', 'approved', 'rejected', 'invoiced'
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  
  -- Metadata
  entry_type text DEFAULT 'timer',         -- 'timer' or 'manual'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_duration CHECK (
    (ended_at IS NULL) OR (ended_at > started_at)
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('draft', 'submitted', 'approved', 'rejected', 'invoiced')
  ),
  CONSTRAINT valid_entry_type CHECK (
    entry_type IN ('timer', 'manual')
  )
);

-- Indexes for performance
CREATE INDEX idx_time_entries_user ON time_entries(user_id, started_at DESC);
CREATE INDEX idx_time_entries_org ON time_entries(org_id, started_at DESC);
CREATE INDEX idx_time_entries_project ON time_entries(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_time_entries_task ON time_entries(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_time_entries_status ON time_entries(org_id, status, started_at DESC);
CREATE INDEX idx_time_entries_billable ON time_entries(org_id, billable, started_at DESC);

-- Function to auto-calculate duration on update
CREATE OR REPLACE FUNCTION calculate_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_duration
  BEFORE INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_entry_duration();

-- ============================================================================
-- TIME TRACKING SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_tracking_settings (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Global settings
  enabled boolean DEFAULT true,
  require_approval boolean DEFAULT false,          -- Manager must approve?
  require_project_task boolean DEFAULT false,      -- Must link to project/task?
  
  -- Default billable rate
  default_hourly_rate numeric(10,2),               -- CZK/hour
  currency text DEFAULT 'CZK',
  
  -- Limits
  min_entry_minutes integer DEFAULT 1,
  max_entry_minutes integer DEFAULT 480,           -- Max 8h per entry
  allow_overlapping_entries boolean DEFAULT false,
  
  -- Workflow
  auto_submit_after_hours integer,                 -- Auto-submit draft entries after X hours
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_currency CHECK (currency IN ('CZK', 'EUR', 'USD', 'GBP'))
);

-- ============================================================================
-- BILLABLE RATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS billable_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Rate applies to
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text,                                        -- Or general role ('developer', 'designer')
  
  -- Rate details
  hourly_rate numeric(10,2) NOT NULL,
  currency text DEFAULT 'CZK',
  
  -- Validity period
  valid_from date NOT NULL,
  valid_until date,
  
  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT rate_target CHECK (
    (user_id IS NOT NULL AND role IS NULL) OR
    (user_id IS NULL AND role IS NOT NULL)
  ),
  CONSTRAINT valid_currency CHECK (currency IN ('CZK', 'EUR', 'USD', 'GBP'))
);

CREATE INDEX idx_billable_rates_user ON billable_rates(user_id, valid_from DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_billable_rates_org ON billable_rates(org_id, valid_from DESC);
CREATE INDEX idx_billable_rates_role ON billable_rates(org_id, role, valid_from DESC) WHERE role IS NOT NULL;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Time Entries RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Users can always see their own entries
CREATE POLICY time_entries_own_view ON time_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY time_entries_own_insert ON time_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own draft entries
CREATE POLICY time_entries_own_update ON time_entries
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

-- Users can delete their own draft entries
CREATE POLICY time_entries_own_delete ON time_entries
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');

-- Managers can view team entries (BUSINESS+)
-- This will be enhanced by app-level visibility checks based on subscription tier

-- Time Tracking Settings RLS
ALTER TABLE time_tracking_settings ENABLE ROW LEVEL SECURITY;

-- All org members can view settings
CREATE POLICY time_tracking_settings_view ON time_tracking_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = time_tracking_settings.org_id
        AND org_members.user_id = auth.uid()
    )
  );

-- Only owners can modify settings
CREATE POLICY time_tracking_settings_modify ON time_tracking_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = time_tracking_settings.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'owner'
    )
  );

-- Billable Rates RLS
ALTER TABLE billable_rates ENABLE ROW LEVEL SECURITY;

-- Managers and owners can view rates (BUSINESS+)
CREATE POLICY billable_rates_view ON billable_rates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = billable_rates.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('manager', 'owner')
    )
  );

-- Only owners can modify rates
CREATE POLICY billable_rates_modify ON billable_rates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = billable_rates.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'owner'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get active timer for user
CREATE OR REPLACE FUNCTION get_active_timer(p_user_id uuid)
RETURNS SETOF time_entries AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM time_entries
  WHERE user_id = p_user_id
    AND ended_at IS NULL
  ORDER BY started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get total hours for user in date range
CREATE OR REPLACE FUNCTION get_user_hours(
  p_user_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
RETURNS TABLE (
  total_minutes integer,
  total_hours numeric,
  billable_minutes integer,
  billable_hours numeric,
  entry_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(duration_minutes), 0)::integer AS total_minutes,
    ROUND(COALESCE(SUM(duration_minutes), 0) / 60.0, 2) AS total_hours,
    COALESCE(SUM(CASE WHEN billable THEN duration_minutes ELSE 0 END), 0)::integer AS billable_minutes,
    ROUND(COALESCE(SUM(CASE WHEN billable THEN duration_minutes ELSE 0 END), 0) / 60.0, 2) AS billable_hours,
    COUNT(*)::bigint AS entry_count
  FROM time_entries
  WHERE user_id = p_user_id
    AND started_at >= p_from
    AND started_at < p_to
    AND ended_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get team hours summary (for managers)
CREATE OR REPLACE FUNCTION get_team_hours_summary(
  p_org_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
RETURNS TABLE (
  user_id uuid,
  user_email text,
  total_hours numeric,
  billable_hours numeric,
  entry_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    te.user_id,
    u.email,
    ROUND(COALESCE(SUM(te.duration_minutes), 0) / 60.0, 2) AS total_hours,
    ROUND(COALESCE(SUM(CASE WHEN te.billable THEN te.duration_minutes ELSE 0 END), 0) / 60.0, 2) AS billable_hours,
    COUNT(*)::bigint AS entry_count
  FROM time_entries te
  JOIN auth.users u ON u.id = te.user_id
  WHERE te.org_id = p_org_id
    AND te.started_at >= p_from
    AND te.started_at < p_to
    AND te.ended_at IS NOT NULL
  GROUP BY te.user_id, u.email
  ORDER BY total_hours DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATA VISIBILITY RULES (for RBAC + subscription tiers)
-- ============================================================================

-- FREE: Own time entries
INSERT INTO data_visibility_rules (feature_key, table_name, column_name, min_role, min_subscription_tier, self_only, aggregated_only, description)
VALUES
  ('time_entries_own', 'time_entries', '*', 'member', 'free', true, false, 'Vlastní záznamy času');

-- TEAM: Aggregated team hours
INSERT INTO data_visibility_rules (feature_key, table_name, column_name, min_role, min_subscription_tier, self_only, aggregated_only, description)
VALUES
  ('time_tracking_team_aggregated', 'time_entries', 'duration_minutes,billable', 'manager', 'team', false, true, 'Agregované hodiny týmu'),
  ('time_entries_export', 'time_entries', '*', 'manager', 'team', false, false, 'Export timesheets');

-- BUSINESS: Individual entries + approval
INSERT INTO data_visibility_rules (feature_key, table_name, column_name, min_role, min_subscription_tier, self_only, aggregated_only, description)
VALUES
  ('time_entries_team_view', 'time_entries', '*', 'manager', 'business', false, false, 'Detailní time entries týmu'),
  ('time_entries_approve', 'time_entries', 'status', 'manager', 'business', false, false, 'Schvalování času'),
  ('billable_rates_view', 'billable_rates', '*', 'manager', 'business', false, false, 'Sazby za hodinu');

-- ENTERPRISE: Invoicing + AI insights
INSERT INTO data_visibility_rules (feature_key, table_name, column_name, min_role, min_subscription_tier, self_only, aggregated_only, description)
VALUES
  ('time_entries_invoicing', 'time_entries', '*', 'owner', 'enterprise', false, false, 'Fakturace z time entries'),
  ('time_tracking_ai_insights', 'time_entries', '*', 'manager', 'enterprise', false, false, 'AI analýza času');

-- ============================================================================
-- INITIAL SETTINGS FOR EXISTING ORGS
-- ============================================================================

-- Create default settings for all existing orgs
INSERT INTO time_tracking_settings (org_id, enabled, default_hourly_rate, currency)
SELECT id, true, 1000.00, 'CZK'
FROM organizations
ON CONFLICT (org_id) DO NOTHING;

COMMENT ON TABLE time_entries IS 'Time tracking entries for users working on projects/tasks';
COMMENT ON TABLE time_tracking_settings IS 'Organization-level time tracking configuration';
COMMENT ON TABLE billable_rates IS 'Hourly rates for users or roles';
