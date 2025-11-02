import type { Metadata } from "next";
import { NotificationsWidget } from "@/components/dashboard/notifications-widget";
import { DashboardMetricsCards } from "@/components/dashboard/dashboard-metrics-cards";
import { supabaseServer } from "@/lib/supabaseServer";
import { getUrgentItems } from "@/lib/notifications/get-urgent-items";
import { getDashboardMetrics } from "@/lib/dashboard/get-metrics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard - Ease",
};

type DashboardPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get organization by slug
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return <div>Organization not found</div>;
  }

  // Check if user completed onboarding
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_completed_at")
      .eq("user_id", user.id)
      .eq("org_id", org.id)
      .single();

    if (!profile?.onboarding_completed_at) {
      const { redirect } = await import("next/navigation");
      redirect(`/${orgSlug}/onboarding`);
    }
  }

  if (!user) {
    return <div>Unauthorized</div>;
  }

  // Get user's role in this org
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", org.id)
    .single();

  const userRole =
    (membership?.role as "owner" | "manager" | "member") || "member";

  // Fetch data
  const urgentItems = await getUrgentItems(org.id);
  const metrics = await getDashboardMetrics(org.id, userRole, user.id);

  return (
    <div className="p-8 space-y-8">
      <header className="mb-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-2 text-base text-gray-600">Your daily overview</p>
      </header>

      {/* Essentials only */}
      <DashboardMetricsCards
        metrics={metrics}
        userRole={userRole}
        variant="compact"
      />

      <NotificationsWidget urgentItems={urgentItems} orgSlug={orgSlug} />
    </div>
  );
}
