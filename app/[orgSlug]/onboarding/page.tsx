import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { OnboardingChat } from "@/components/onboarding-chat";

type OnboardingPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/${orgSlug}/onboarding`);
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    redirect(`/${orgSlug}`);
  }

  // Check if user already completed onboarding
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed_at")
    .eq("user_id", user.id)
    .eq("org_id", org.id)
    .single();

  // If already onboarded, redirect to dashboard
  if (profile?.onboarding_completed_at) {
    redirect(`/${orgSlug}/dashboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Vítej v {org.name}! 👋
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Pojďme si chvíli popovídat, abychom tě lépe poznali
          </p>
        </div>

        <OnboardingChat
          orgSlug={orgSlug}
          orgName={org.name}
          userEmail={user.email!}
        />
      </div>
    </div>
  );
}
