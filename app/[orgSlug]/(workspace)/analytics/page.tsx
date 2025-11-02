import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { PeopleAnalyticsDashboard } from "@/components/people-analytics-dashboard";
import { getOrgSubscription, checkFeatureAccess } from "@/lib/visibility";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export const metadata: Metadata = {
  title: "People Analytics - Ease",
};

export const dynamic = "force-dynamic";

type AnalyticsPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
  redirect(`/auth/login?redirect=/${orgSlug}/analytics`);
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return <div>Organization not found</div>;
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", org.id)
    .single();

  const isManager =
    membership && ["owner", "manager"].includes(membership.role);

  // Only managers can see team analytics
  if (!isManager) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-sm text-gray-600">
            People Analytics is only available to managers and owners.
          </p>
        </div>
      </div>
    );
  }

  // Check subscription tier
  const subscription = await getOrgSubscription(org.id);
  const canSeeIndividual = await checkFeatureAccess(
    user.id,
    org.id,
    "team_daily_status_individual",
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              People Analytics
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Team health, performance, mood trends, and burnout risk
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Aktuální plán:</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-900 uppercase text-xs">
              {subscription}
            </span>
          </div>
        </div>
      </header>

      {/* FREE tier - show aggregated data + upgrade prompt */}
      {subscription === "free" && (
        <div className="space-y-6">
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-yellow-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-900">
                  Omezený přístup (FREE)
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Vidíš pouze agregované statistiky týmu. Pro individuální údaje
                  potřebuješ Team plán nebo vyšší.
                </p>
              </div>
            </div>
          </div>

          <PeopleAnalyticsDashboard orgSlug={orgSlug} />

          <UpgradePrompt
            currentTier={subscription}
            requiredTier="team"
            featureName="Individuální daily status členů týmu"
            orgSlug={orgSlug}
          />
        </div>
      )}

      {/* TEAM+ tier - show full dashboard */}
      {subscription !== "free" && (
        <PeopleAnalyticsDashboard orgSlug={orgSlug} />
      )}
    </div>
  );
}
