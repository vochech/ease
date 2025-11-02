# Role-Based Visibility & Freemium Model

## Koncept

Systém transparentnosti dat s **role-based access control (RBAC)** + **subscription tiers**:

- **Role**: Určuje, kdo může vidět jaká data (viewer, member, manager, owner)
- **Subscription Tier**: Určuje, jaké funkce jsou dostupné (free, team, business, enterprise)
- **Feature Key**: Identifikátor konkrétní funkce (např. `team_daily_status_individual`)

## Subscription Tiers

### FREE (0 Kč)

**Základní funkce pro malé týmy**

- ✅ Neomezené organizace
- ✅ Vlastní daily check-ins
- ✅ Základní profily (jméno, role, pozice)
- ✅ Agregované statistiky týmu (manažeři vidí průměry, ne jednotlivce)

**Omezení:**

- ❌ Manažeři nevidí individuální check-iny
- ❌ Žádná historie dat (pouze aktuální stav)
- ❌ Žádné AI insights

### TEAM (199 Kč/user/měsíc)

**Pro týmy, které chtějí sledovat individuální stav**

- ✅ Vše z FREE +
- ✅ **Individuální daily status** (manažeři vidí check-iny každého člena)
- ✅ Základní performance metriky (počet meetingů, komentářů, úkolů)
- ✅ 30-denní historie nálad a stresu
- ✅ Export dat (CSV)

### BUSINESS (399 Kč/user/měsíc)

**Pro pokročilé HR a people analytics**

- ✅ Vše z TEAM +
- ✅ **Behaviorální profily** (pracovní styl, preference komunikace)
- ✅ **Context snapshots** (dovolené, kapacity, workload)
- ✅ **Performance reviews** (kompletní hodnocení)
- ✅ Social graf (anonymizovaný - vidíš vzory spolupráce, ne detaily)
- ✅ 90-denní historie

### ENTERPRISE (999 Kč/user/měsíc)

**Pro velké firmy s pokročilou analytikou**

- ✅ Vše z BUSINESS +
- ✅ **AI-powered insights** (predikce burnoutu, doporučení)
- ✅ **Kompletní social graf** (detailní síťová analýza s jmény)
- ✅ **Kariérní tracking** (historie postupů a promocí)
- ✅ **Compensation data** (platy a odměny - pouze owner)
- ✅ Neomezená historie
- ✅ Prioritní podpora

## Databázová struktura

### `data_visibility_rules`

Definuje, jaké feature jsou dostupné pro jaké role a subscription tiers.

```sql
CREATE TABLE data_visibility_rules (
  feature_key text NOT NULL,         -- 'daily_checkins_own', 'team_daily_status_individual', ...
  table_name text NOT NULL,          -- 'daily_check_ins', 'user_profiles', ...
  column_name text,                  -- 'mood_score, stress_score' nebo '*' pro všechny
  min_role text NOT NULL,            -- 'viewer', 'member', 'manager', 'owner'
  min_subscription_tier subscription_tier NOT NULL,
  self_only boolean DEFAULT false,   -- Uživatel vidí jen svá data
  aggregated_only boolean DEFAULT false, -- Pouze agregované (průměry, sumy)
  description text
);
```

**Příklady pravidel:**

```sql
-- FREE tier: Uživatel vidí vlastní check-iny
('daily_checkins_own', 'daily_check_ins', '*', 'member', 'free', true, false)

-- FREE tier: Manažer vidí pouze agregované statistiky týmu
('team_daily_status_aggregated', 'daily_check_ins', 'mood_score,stress_score', 'manager', 'free', false, true)

-- TEAM tier: Manažer vidí individuální check-iny
('team_daily_status_individual', 'daily_check_ins', '*', 'manager', 'team', false, false)

-- BUSINESS tier: Manažer vidí behaviorální profily
('behavioral_profiles_view', 'behavioral_profiles', '*', 'manager', 'business', false, false)

-- ENTERPRISE tier: Owner vidí kompenzace
('compensation_view', 'compensation_records', '*', 'owner', 'enterprise', false, false)
```

### Funkce `can_access_feature()`

Kontroluje, jestli má user přístup k feature:

```sql
SELECT can_access_feature(
  'user-uuid',
  'org-uuid',
  'team_daily_status_individual'
); -- vrací true/false
```

Logika:

1. Zkontroluje user role (viewer=1, member=2, manager=3, owner=4)
2. Zkontroluje org subscription tier (free=1, team=2, business=3, enterprise=4)
3. Porovná s `min_role` a `min_subscription_tier` z pravidla

## Backend (Next.js)

### 1. Server-side visibility check

```typescript
// lib/visibility.ts
import { checkFeatureAccess, requireFeatureAccess } from "@/lib/visibility";

// Zkontrolovat přístup (vrací { hasAccess: boolean, reason?: string, upgradeRequired?: tier })
const access = await checkFeatureAccess(
  userId,
  orgId,
  "team_daily_status_individual",
);

if (!access.hasAccess) {
  console.log("Upgrade required:", access.upgradeRequired);
}

// Nebo vyhodit 403 error pokud nemá přístup
await requireFeatureAccess(userId, orgId, "team_daily_status_individual");
```

### 2. API route protection

```typescript
// app/api/[orgSlug]/analytics/team-health/route.ts
import { checkFeatureAccess, getOrgSubscription } from "@/lib/visibility";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgSlug: string }> },
) {
  // ... auth + org lookup ...

  const subscription = await getOrgSubscription(org.id);
  const canSeeIndividual = await checkFeatureAccess(
    user.id,
    org.id,
    "team_daily_status_individual",
  );

  // FREE tier: Vrátit jen agregované statistiky
  if (subscription === "free") {
    return NextResponse.json({
      subscription_tier: "free",
      aggregated: {
        total_members: 10,
        avg_stress: 5.2,
        avg_mood: 7.8,
        high_stress_count: 2,
      },
      upgrade_required: "team",
      upgrade_message: "Upgrade na Team tier pro individuální údaje",
    });
  }

  // TEAM+: Vrátit individuální data
  return NextResponse.json({
    subscription_tier: subscription,
    team_health: [...individualData],
  });
}
```

### 3. Podmíněné filtrování dat

```typescript
const teamHealth = members.map((member) => ({
  user_id: member.user_id,
  email: member.users?.email,
  // Zobraz pouze pokud má přístup
  stress_score: canSeeIndividual.hasAccess ? stressCheckin?.score : null,
  mood_score: canSeeIndividual.hasAccess ? moodCheckin?.score : null,
  // Vždycky zobraz základní info
  on_vacation: context?.on_vacation || false,
}));
```

## Frontend (React)

### 1. Feature access hook

```typescript
// components/team-dashboard.tsx
"use client";

import { useFeatureAccess, useSubscriptionTier } from "@/lib/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export function TeamDashboard({ orgSlug }: { orgSlug: string }) {
  const { tier } = useSubscriptionTier(orgSlug);
  const { hasAccess, upgradeRequired } = useFeatureAccess(
    orgSlug,
    "team_daily_status_individual"
  );

  return (
    <div>
      {!hasAccess && (
        <UpgradePrompt
          currentTier={tier}
          requiredTier={upgradeRequired}
          featureName="Individuální daily status"
          orgSlug={orgSlug}
        />
      )}

      {hasAccess && <DetailedTeamView />}
    </div>
  );
}
```

### 2. Upgrade prompt component

```tsx
<UpgradePrompt
  currentTier="free"
  requiredTier="team"
  featureName="Individuální daily status členů týmu"
  orgSlug="acme-inc"
/>
```

Zobrazí:

- Aktuální tier (FREE)
- Co chybí
- Co získáš upgradem
- Cena nového tieru
- Tlačítko "Upgradovat"

### 3. Feature locked badge

```tsx
<div className="flex items-center gap-2">
  <span>Behavioral Profiles</span>
  <FeatureLockedBadge requiredTier="business" small />
</div>
```

## Příklady použití

### Dashboard s conditional rendering

```tsx
// app/[orgSlug]/analytics/page.tsx
export default async function AnalyticsPage({ params }) {
  const subscription = await getOrgSubscription(org.id);

  return (
    <div>
      {/* Vždy zobraz základní info */}
      <BasicStats />

      {/* FREE tier: Agregované + upgrade prompt */}
      {subscription === "free" && (
        <>
          <AggregatedStats />
          <UpgradePrompt currentTier="free" requiredTier="team" />
        </>
      )}

      {/* TEAM+: Full dashboard */}
      {subscription !== "free" && <DetailedDashboard />}
    </div>
  );
}
```

### API endpoint s tier filtering

```typescript
// GET /api/[orgSlug]/analytics/team-health
if (subscription === "free") {
  // Vrať jen průměry
  return { avg_stress: 5.2, avg_mood: 7.8 };
}

if (subscription === "team") {
  // Vrať individuální data, ale bez AI insights
  return { team_health: members.map(m => ({ ...m, burnout_risk: null })) };
}

if (subscription === "business") {
  // Vrať vše včetně behavioral profiles
  return { team_health: members };
}

if (subscription === "enterprise") {
  // Vrať vše včetně AI predictions a compensation (pokud je user owner)
  return { team_health: members, ai_insights: [...] };
}
```

## Feature Keys (Reference)

| Feature Key                    | Description                   | Min Role | Min Tier   |
| ------------------------------ | ----------------------------- | -------- | ---------- |
| `user_profiles_basic`          | Základní profil (jméno, role) | member   | free       |
| `user_profiles_own`            | Vlastní kompletní profil      | member   | free       |
| `daily_checkins_own`           | Vlastní daily check-ins       | member   | free       |
| `team_daily_status_aggregated` | Agregované statistiky týmu    | manager  | free       |
| `team_daily_status_individual` | Individuální check-iny        | manager  | team       |
| `performance_metrics_basic`    | Základní metriky výkonu       | manager  | team       |
| `subjective_checkins_history`  | Historie nálad (30 dní)       | member   | team       |
| `behavioral_profiles_view`     | Behaviorální profily          | manager  | business   |
| `context_snapshots_view`       | Context (dovolené, kapacity)  | manager  | business   |
| `performance_reviews_view`     | Performance reviews           | manager  | business   |
| `social_graph_anonymized`      | Social graf (anonymizovaný)   | manager  | business   |
| `ai_insights_full`             | AI insights a predikce        | manager  | enterprise |
| `social_graph_full`            | Kompletní social graf         | manager  | enterprise |
| `career_history_view`          | Kariérní historie             | manager  | enterprise |
| `advanced_analytics`           | Pokročilá analytika           | owner    | enterprise |
| `compensation_view`            | Kompenzační data              | owner    | enterprise |

## Upgrade Flow

1. User klikne na "Upgradovat" v UpgradePrompt
2. Redirect na `/${orgSlug}/settings/billing?upgrade=team`
3. Billing page zobrazí comparison tabulku (FREE vs TEAM vs BUSINESS vs ENTERPRISE)
4. User vybere tier → redirect na Stripe Checkout
5. Po úspěšné platbě: webhook aktualizuje `organizations.subscription_tier`
6. User má okamžitě přístup k novým features

## Migrace (SQL)

```bash
# Spustit migraci
psql -U postgres -d ease -f supabase/migrations/016_subscription_visibility.sql

# Ověřit
SELECT * FROM data_visibility_rules;
SELECT can_access_feature('user-uuid', 'org-uuid', 'team_daily_status_individual');
```

## Pricing Page (budoucí)

```tsx
// app/[orgSlug]/pricing/page.tsx
import { PRICING_TIERS } from "@/lib/visibility";

export default function PricingPage() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {Object.entries(PRICING_TIERS).map(([tier, info]) => (
        <PricingCard key={tier} tier={tier} info={info} />
      ))}
    </div>
  );
}
```

## Filozofie

**Maximální transparentnost na FREE tier:**

- Všichni vidí základní profily
- Každý vidí vlastní data
- Manažeři vidí agregované statistiky (průměry, trendy)

**Premium = Individuální detail:**

- TEAM: Vidíš, kdo konkrétně má vysoký stress
- BUSINESS: Vidíš behaviorální profily a workload
- ENTERPRISE: AI ti řekne, kdo je v riziku burnoutu

**Nikdy neskrýváme data před vlastníkem:**

- Každý user vidí vždy 100% svých vlastních dat
- Premium jen přidává viditelnost _ostatních_ dat a AI insights

---

## Enhancements (Future Implementation)

### A. Access Scope Enum (Alternative to Booleans)

Instead of `self_only` and `aggregated_only` booleans, use a cleaner enum:

```sql
CREATE TYPE access_scope AS ENUM ('self', 'aggregated', 'individual', 'full');
ALTER TABLE data_visibility_rules DROP COLUMN self_only, DROP COLUMN aggregated_only;
ALTER TABLE data_visibility_rules ADD COLUMN scope access_scope DEFAULT 'individual';
```

### B. Middleware HOF for API Routes

`lib/middleware/withFeatureAccess.ts` wraps route handlers:

```typescript
import { withFeatureAccess } from "@/lib/middleware/withFeatureAccess";

export const GET = withFeatureAccess("team_daily_status_individual")(async (req, ctx) => {
  // Access guaranteed; implement handler logic
  return NextResponse.json({ data: "..." });
});
```

→ Eliminates boilerplate in every guarded endpoint.

### C. Feature Registry (Single Source of Truth)

`lib/visibility.ts` exports `FEATURE_REGISTRY`:

```typescript
export const FEATURE_REGISTRY: Record<
  string,
  { label: string; minTier: SubscriptionTier; minRole: OrgRole }
> = {
  team_daily_status_individual: {
    label: "Individuální daily status",
    minTier: "team",
    minRole: "manager",
  },
  // ...
};
```

→ FE and BE share the same definitions; no drift between labels/requirements.

### D. Audit Log & Usage Metrics

Create `feature_access_logs` table:

```sql
CREATE TABLE feature_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  feature_key text NOT NULL,
  access_granted boolean NOT NULL,
  accessed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_feature_logs_org ON feature_access_logs(org_id, accessed_at DESC);
```

Optional utility `logFeatureAccess(userId, orgId, featureKey, granted)` in `lib/visibility.ts` logs all attempts.

Benefits:

- Identify most-requested locked features → marketing/UX insights
- Audit compliance for GDPR/enterprise customers

### E. Subscription Tier as DB Enum

```sql
CREATE TYPE subscription_tier AS ENUM ('free', 'team', 'business', 'enterprise');
ALTER TABLE organizations ALTER COLUMN subscription_tier TYPE subscription_tier USING subscription_tier::subscription_tier;
```

→ Simplifies `can_access_feature` join and tier comparisons.

### F. FeatureAccessProvider Context

`components/providers/feature-access-provider.tsx` wraps the app:

```tsx
<FeatureAccessProvider orgSlug="acme-inc">
  <YourApp />
</FeatureAccessProvider>
```

Then any component uses:

```tsx
const { tier, hasFeature } = useFeatureAccessContext();
if (hasFeature("team_daily_status_individual")) {
  /* render */
}
```

→ Eliminates repeated `useFeatureAccess` calls; centralizes upgrade flows.

### G. AI Insight Layer (Enterprise)

For `ai_insights_full`, create a background job (Supabase CRON or Node.js worker):

```sql
CREATE TABLE ai_insights_cache (
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  insight_type text NOT NULL, -- 'burnout_risk', 'team_recommendation', ...
  insight_data jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  PRIMARY KEY (org_id, user_id, insight_type)
);
```

Periodically analyze last 30 days, write predictions. Enterprise tier reads from cache via `GET /api/[orgSlug]/ai-insights`.

---

## Implementation Status

| Enhancement             | Status     | Notes                                               |
| ----------------------- | ---------- | --------------------------------------------------- |
| `access_scope` enum     | 📋 Documented | Simplifies boolean logic                          |
| `withFeatureAccess` HOF | ✅ Done    | `lib/middleware/withFeatureAccess.ts`               |
| `FEATURE_REGISTRY`      | ✅ Done    | `lib/visibility.ts` exports shared registry         |
| Audit log util          | ✅ Done    | `logFeatureAccess()` optional in visibility         |
| DB enum for tiers       | 📋 Pending | Requires migration                                  |
| `FeatureAccessProvider` | ✅ Done    | `components/providers/feature-access-provider.tsx` |
| AI insight layer        | 📋 Future  | Requires CRON job + AI pipeline                     |
