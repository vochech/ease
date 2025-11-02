import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { ProfileEditForm } from "@/components/profile-edit-form";

type ProfilePageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/${orgSlug}/settings/profile`);
  }

  // Get org
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    redirect(`/${orgSlug}`);
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("org_id", org.id)
    .single();

  // Get user's org membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("role, department")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Můj profil
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Uprav své osobní údaje, dovednosti a pracovní preference
          </p>
        </div>

        <ProfileEditForm
          orgSlug={orgSlug}
          initialProfile={profile}
          userEmail={user.email!}
          currentRole={membership?.role || "member"}
        />
      </div>
    </div>
  );
}
