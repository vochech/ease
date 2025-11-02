// Visibility and access control utilities
// Purpose: Check feature access based on role + subscription tier

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { OrgRole } from "@/types/roles";
import { RoleRank } from "@/types/roles";

export type SubscriptionTier = "free" | "team" | "business" | "enterprise";

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: SubscriptionTier;
}

/**
 * Check if user has access to a specific feature
 * @param userId - User UUID
 * @param orgId - Organization UUID
 * @param featureKey - Feature identifier (e.g., 'daily_checkins_own')
 * @returns FeatureAccess object with hasAccess boolean and optional reason
 */
export async function checkFeatureAccess(
  userId: string,
  orgId: string,
  featureKey: string,
): Promise<FeatureAccess> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  const { data, error } = await supabase.rpc("can_access_feature", {
    p_user_id: userId,
    p_org_id: orgId,
    p_feature_key: featureKey,
  });

  if (error) {
    console.error("[checkFeatureAccess]", error);
    return { hasAccess: false, reason: "Error checking access" };
  }

  if (!data) {
    // Get required tier from rules
    const { data: rule } = await supabase
      .from("data_visibility_rules")
      .select("min_subscription_tier, min_role, description")
      .eq("feature_key", featureKey)
      .single();

    return {
      hasAccess: false,
      reason: rule?.description || "Feature not available",
      upgradeRequired: rule?.min_subscription_tier as SubscriptionTier,
    };
  }

  return { hasAccess: true };
}

/**
 * Get all accessible features for a user
 * @param userId - User UUID
 * @param orgId - Organization UUID
 * @returns Array of feature keys user has access to
 */
export async function getUserFeatures(
  userId: string,
  orgId: string,
): Promise<string[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  const { data, error } = await supabase.rpc("get_user_features", {
    p_user_id: userId,
    p_org_id: orgId,
  });

  if (error) {
    console.error("[getUserFeatures]", error);
    return [];
  }

  return data?.map((f: { feature_key: string }) => f.feature_key) || [];
}

/**
 * Middleware helper: Require feature access or return 403
 * @param userId - User UUID
 * @param orgId - Organization UUID
 * @param featureKey - Feature identifier
 * @throws Response with 403 status if access denied
 */
export async function requireFeatureAccess(
  userId: string,
  orgId: string,
  featureKey: string,
): Promise<void> {
  const access = await checkFeatureAccess(userId, orgId, featureKey);

  if (!access.hasAccess) {
    throw new Response(
      JSON.stringify({
        error: "Access denied",
        reason: access.reason,
        upgradeRequired: access.upgradeRequired,
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
}

/**
 * Get subscription tier for organization
 * @param orgId - Organization UUID
 * @returns Subscription tier
 */
export async function getOrgSubscription(
  orgId: string,
): Promise<SubscriptionTier> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  const { data } = await supabase
    .from("organizations")
    .select("subscription_tier")
    .eq("id", orgId)
    .single();

  return (data?.subscription_tier as SubscriptionTier) || "free";
}

/**
 * Check if user has minimum role in organization
 * @param userId - User UUID
 * @param orgId - Organization UUID
 * @param minRole - Minimum required role
 * @returns true if user has required role or higher
 */
export async function hasMinRole(
  userId: string,
  orgId: string,
  minRole: OrgRole,
): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .single();

  if (!membership) return false;

  const userPriority = RoleRank[membership.role as OrgRole] ?? 0;
  const minPriority = RoleRank[minRole] ?? 0;

  return userPriority >= minPriority;
}

/**
 * Feature definitions for pricing page and UI
 */
export const FEATURE_DEFINITIONS = {
  // FREE TIER
  user_profiles_basic: {
    name: "Základní profily",
    description: "Jméno, pozice, role_level",
    tier: "free" as SubscriptionTier,
  },
  daily_checkins_own: {
    name: "Vlastní daily check-ins",
    description: "Vidíš své denní check-iny",
    tier: "free" as SubscriptionTier,
  },
  team_daily_status_aggregated: {
    name: "Agregovaný status týmu",
    description: "Manažeři vidí průměry, ne jednotlivce",
    tier: "free" as SubscriptionTier,
  },

  // TEAM TIER
  team_daily_status_individual: {
    name: "Individuální daily status",
    description: "Manažeři vidí denní check-iny jednotlivých členů",
    tier: "team" as SubscriptionTier,
  },
  performance_metrics_basic: {
    name: "Základní metriky",
    description: "Počet meetingů, komentářů, úkolů",
    tier: "team" as SubscriptionTier,
  },
  subjective_checkins_history: {
    name: "Historie nálad (30 dní)",
    description: "Vidíš trend své nálady a stresu",
    tier: "team" as SubscriptionTier,
  },

  // BUSINESS TIER
  behavioral_profiles_view: {
    name: "Behaviorální profily",
    description: "Pracovní styl, preference komunikace",
    tier: "business" as SubscriptionTier,
  },
  context_snapshots_view: {
    name: "Kontext týmu",
    description: "Dovolené, kapacity, pracovní nasazení",
    tier: "business" as SubscriptionTier,
  },
  performance_reviews_view: {
    name: "Performance reviews",
    description: "Kompletní hodnocení výkonu",
    tier: "business" as SubscriptionTier,
  },
  social_graph_anonymized: {
    name: "Anonymizovaný social graf",
    description: "Vzory spolupráce v týmu",
    tier: "business" as SubscriptionTier,
  },

  // ENTERPRISE TIER
  ai_insights_full: {
    name: "AI insights",
    description: "Predikce burnoutu, doporučení pro management",
    tier: "enterprise" as SubscriptionTier,
  },
  social_graph_full: {
    name: "Kompletní social graf",
    description: "Detailní síťová analýza s jmény",
    tier: "enterprise" as SubscriptionTier,
  },
  career_history_view: {
    name: "Kariérní historie",
    description: "Tracking postupu a promocí",
    tier: "enterprise" as SubscriptionTier,
  },
  advanced_analytics: {
    name: "Pokročilá analytika",
    description: "Kompletní analytický suite (pouze owner)",
    tier: "enterprise" as SubscriptionTier,
  },
  compensation_view: {
    name: "Kompenzace",
    description: "Platy a odměny (pouze owner)",
    tier: "enterprise" as SubscriptionTier,
  },
};

/**
 * Central feature registry shared across BE/FE for labels and access metadata.
 * Prefer using this as the single source for min role/tier requirements in UI.
 */
export const FEATURE_REGISTRY: Record<
  string,
  { label: string; minTier: SubscriptionTier; minRole: OrgRole }
> = {
  // FREE
  user_profiles_basic: {
    label: "Základní profily",
    minTier: "free",
    minRole: "member",
  },
  user_profiles_own: {
    label: "Vlastní profil",
    minTier: "free",
    minRole: "member",
  },
  daily_checkins_own: {
    label: "Vlastní daily check-ins",
    minTier: "free",
    minRole: "member",
  },
  team_daily_status_aggregated: {
    label: "Agregovaný status týmu",
    minTier: "free",
    minRole: "manager",
  },

  // TEAM
  team_daily_status_individual: {
    label: "Individuální daily status",
    minTier: "team",
    minRole: "manager",
  },
  performance_metrics_basic: {
    label: "Základní metriky výkonu",
    minTier: "team",
    minRole: "manager",
  },
  subjective_checkins_history: {
    label: "Historie nálad (30 dní)",
    minTier: "team",
    minRole: "member",
  },

  // BUSINESS
  behavioral_profiles_view: {
    label: "Behaviorální profily",
    minTier: "business",
    minRole: "manager",
  },
  context_snapshots_view: {
    label: "Context snapshots",
    minTier: "business",
    minRole: "manager",
  },
  performance_reviews_view: {
    label: "Performance reviews",
    minTier: "business",
    minRole: "manager",
  },
  social_graph_anonymized: {
    label: "Anonymizovaný social graf",
    minTier: "business",
    minRole: "manager",
  },

  // ENTERPRISE
  ai_insights_full: {
    label: "AI insights",
    minTier: "enterprise",
    minRole: "manager",
  },
  social_graph_full: {
    label: "Kompletní social graf",
    minTier: "enterprise",
    minRole: "manager",
  },
  career_history_view: {
    label: "Kariérní historie",
    minTier: "enterprise",
    minRole: "manager",
  },
  advanced_analytics: {
    label: "Pokročilá analytika",
    minTier: "enterprise",
    minRole: "owner",
  },
  compensation_view: {
    label: "Kompenzace",
    minTier: "enterprise",
    minRole: "owner",
  },
};

/**
 * Optional: audit access attempt (no-op if table doesn't exist)
 */
export async function logFeatureAccess(
  params: {
    userId: string;
    orgId: string;
    featureKey: string;
    granted: boolean;
  },
): Promise<void> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );

    await supabase.from("feature_access_logs").insert({
      user_id: params.userId,
      org_id: params.orgId,
      feature_key: params.featureKey,
      access_granted: params.granted,
    });
  } catch (e) {
    // Silently ignore if table is missing or insert fails
    console.warn("[logFeatureAccess] skipped:", (e as Error).message);
  }
}

/**
 * Pricing tiers for display
 */
export const PRICING_TIERS = {
  free: {
    name: "Free",
    price: "0 Kč",
    features: [
      "Neomezené organizace",
      "Základní profily",
      "Vlastní daily check-ins",
      "Agregovaný status týmu (manažeři)",
    ],
  },
  team: {
    name: "Team",
    price: "199 Kč/uživatel/měsíc",
    features: [
      "Vše z Free +",
      "Individuální daily status",
      "Základní performance metriky",
      "30-denní historie nálad",
      "Export dat",
    ],
  },
  business: {
    name: "Business",
    price: "399 Kč/uživatel/měsíc",
    features: [
      "Vše z Team +",
      "Behaviorální profily",
      "Kontext a kapacity týmu",
      "Performance reviews",
      "Social graf (anonymizovaný)",
      "90-denní historie",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "999 Kč/uživatel/měsíc",
    features: [
      "Vše z Business +",
      "AI-powered insights",
      "Predikce burnoutu",
      "Kompletní social graf",
      "Kariérní tracking",
      "Pokročilá analytika",
      "Kompenzační data (owner)",
      "Neomezená historie",
    ],
  },
};
