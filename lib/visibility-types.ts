// Shared types and constants for visibility/subscription features
// This file is safe to import in both client and server components

export type SubscriptionTier = "free" | "team" | "business" | "enterprise";

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
