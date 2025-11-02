"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useOrg } from "./org-provider";

export type SubscriptionTier = "free" | "team" | "business" | "enterprise";

interface FeatureAccessContextValue {
  tier: SubscriptionTier;
  features: Set<string>;
  loading: boolean;
  hasFeature: (featureKey: string) => boolean;
  checkFeatureAccess: (featureKey: string) => Promise<{
    hasAccess: boolean;
    reason?: string;
    upgradeRequired?: SubscriptionTier;
  }>;
}

const FeatureAccessContext = createContext<FeatureAccessContextValue | null>(null);

/**
 * Provider that caches org subscription tier and accessible features for the session.
 * Reduces redundant API calls for feature checks across components.
 */
export function FeatureAccessProvider({ children }: { children: ReactNode }) {
  const { orgSlug } = useOrg();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [features, setFeatures] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchAccess() {
      try {
        const [tierRes, featuresRes] = await Promise.all([
          fetch(`/api/${orgSlug}/subscription/tier`),
          fetch(`/api/${orgSlug}/subscription/features`),
        ]);

        const tierData = await tierRes.json();
        const featuresData = await featuresRes.json();

        if (mounted) {
          setTier(tierData.tier || "free");
          setFeatures(new Set(featuresData.features || []));
          setLoading(false);
        }
      } catch (error) {
        console.error("[FeatureAccessProvider]", error);
        if (mounted) {
          setTier("free");
          setFeatures(new Set());
          setLoading(false);
        }
      }
    }

    fetchAccess();

    return () => {
      mounted = false;
    };
  }, [orgSlug]);

  const hasFeature = (featureKey: string) => features.has(featureKey);

  const checkFeatureAccess = async (featureKey: string) => {
    try {
      const res = await fetch(`/api/${orgSlug}/subscription/check-feature?feature=${featureKey}`);
      return await res.json();
    } catch (error) {
      console.error("[checkFeatureAccess]", error);
      return { hasAccess: false, reason: "Error checking access" };
    }
  };

  return (
    <FeatureAccessContext.Provider value={{ tier, features, loading, hasFeature, checkFeatureAccess }}>
      {children}
    </FeatureAccessContext.Provider>
  );
}

/**
 * Hook to access feature access context (tier, features set, loading state).
 */
export function useFeatureAccessContext(): FeatureAccessContextValue {
  const context = useContext(FeatureAccessContext);
  if (!context) {
    throw new Error("useFeatureAccessContext must be used within FeatureAccessProvider");
  }
  return context;
}
