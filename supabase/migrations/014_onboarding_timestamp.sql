-- Migration 014: Add onboarding fields to user_profiles
-- Purpose: Track 2-step onboarding (manager pre-fill + user confirmation)

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS onboarding_prefilled_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS onboarding_prefilled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON public.user_profiles(onboarding_completed_at);

COMMENT ON COLUMN public.user_profiles.onboarding_completed_at IS 'Timestamp when user completed their onboarding';
COMMENT ON COLUMN public.user_profiles.onboarding_prefilled_by IS 'Manager/lead who pre-filled the profile';
COMMENT ON COLUMN public.user_profiles.onboarding_prefilled_at IS 'Timestamp when manager pre-filled the profile';
