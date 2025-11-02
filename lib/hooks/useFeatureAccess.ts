"use client";

// Client-side feature access hooks
// Purpose: Check subscription tier and feature access in React components

import { useEffect, useState } from "react";

export type SubscriptionTier = "free" | "team" | "business" | "enterprise";

interface UseFeatureAccessResult {
  hasAccess: boolean;
  loading: boolean;
  upgradeRequired?: SubscriptionTier;
  reason?: string;
}

/**
 * Hook to check if current user has access to a feature
 * @param orgSlug - Organization slug
 * @param featureKey - Feature identifier
 * @returns Object with hasAccess boolean and loading state
 */
export function useFeatureAccess(
  orgSlug: string,
  featureKey: string,
): UseFeatureAccessResult {
  const [result, setResult] = useState<UseFeatureAccessResult>({
    hasAccess: false,
    loading: true,
  });

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch(
          `/api/${orgSlug}/subscription/check-feature?feature=${featureKey}`,
        );
        const data = await res.json();

        setResult({
          hasAccess: data.hasAccess || false,
          loading: false,
          upgradeRequired: data.upgradeRequired,
          reason: data.reason,
        });
      } catch (error) {
        console.error("[useFeatureAccess]", error);
        setResult({ hasAccess: false, loading: false });
      }
    }

    checkAccess();
  }, [orgSlug, featureKey]);

  return result;
}

/**
 * Hook to get current organization subscription tier
 * @param orgSlug - Organization slug
 * @returns Subscription tier and loading state
 */
export function useSubscriptionTier(orgSlug: string): {
  tier: SubscriptionTier | null;
  loading: boolean;
} {
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTier() {
      try {
        const res = await fetch(`/api/${orgSlug}/subscription/tier`);
        const data = await res.json();
        setTier(data.tier || "free");
      } catch (error) {
        console.error("[useSubscriptionTier]", error);
        setTier("free");
      } finally {
        setLoading(false);
      }
    }

    fetchTier();
  }, [orgSlug]);

  return { tier, loading };
}

/**
 * Hook to get all accessible features for current user
 * @param orgSlug - Organization slug
 * @returns Array of feature keys
 */
export function useUserFeatures(orgSlug: string): {
  features: string[];
  loading: boolean;
} {
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatures() {
      try {
        const res = await fetch(`/api/${orgSlug}/subscription/features`);
        const data = await res.json();
        setFeatures(data.features || []);
      } catch (error) {
        console.error("[useUserFeatures]", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeatures();
  }, [orgSlug]);

  return { features, loading };
}
