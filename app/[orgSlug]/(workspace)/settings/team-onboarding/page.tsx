import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { TeamMembersOnboardingList } from "@/components/team-onboarding-list";

type TeamOnboardingPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function TeamOnboardingPage({
  params,
}: TeamOnboardingPageProps) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
  redirect(`/auth/login?redirect=/${orgSlug}/settings/team-onboarding`);
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    redirect(`/${orgSlug}`);
  }

  // Check if user is manager/owner
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  const isManager =
    membership && ["owner", "manager"].includes(membership.role);

  if (!isManager) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-sm text-gray-600">
            Only managers and owners can manage team onboarding.
          </p>
        </div>
      </div>
    );
  }

  // Get all team members
  const { data: members } = await supabase
    .from("org_members")
    .select(
      `
      user_id,
      role,
      created_at,
      users:user_id (
        id,
        email,
        raw_user_meta_data
      )
    `,
    )
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  // Get profiles for members
  const memberIds = members?.map((m: any) => m.user_id) || [];
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("*")
    .in("user_id", memberIds)
    .eq("org_id", org.id);

  // Combine data
  const teamMembers =
    members?.map((member: any) => {
      const profile = profiles?.find((p: any) => p.user_id === member.user_id);
      return {
        user_id: member.user_id,
        email: member.users?.email,
        name:
          member.users?.raw_user_meta_data?.full_name || member.users?.email,
        role: member.role,
        joined_at: member.created_at,
        onboarding_completed: !!profile?.onboarding_completed_at,
        onboarding_prefilled: !!profile?.onboarding_prefilled_at,
        profile,
      };
    }) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Team Onboarding
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Předvyplň profily nových členů týmu - usnadníš jim start
          </p>
        </header>

        <TeamMembersOnboardingList
          orgSlug={orgSlug}
          members={teamMembers}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
