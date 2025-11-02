import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

type OrgHomeProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgHome({ params }: OrgHomeProps) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/${orgSlug}`);
  }

  // Check onboarding status
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (org) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_completed_at")
      .eq("user_id", user.id)
      .eq("org_id", org.id)
      .maybeSingle();

    // If not onboarded, go to onboarding
    if (!profile?.onboarding_completed_at) {
      redirect(`/${orgSlug}/onboarding`);
    }

    // If onboarded but no daily check-in today, go to daily check-in
    const today = new Date().toISOString().split("T")[0];
    const { data: todayCheckin } = await supabase
      .from("daily_check_ins")
      .select("id")
      .eq("user_id", user.id)
      .eq("org_id", org.id)
      .eq("check_in_date", today)
      .maybeSingle();

    if (!todayCheckin) {
      redirect(`/${orgSlug}/daily`);
    }
  }

  // Redirect to dashboard
  redirect(`/${orgSlug}/dashboard`);
}
