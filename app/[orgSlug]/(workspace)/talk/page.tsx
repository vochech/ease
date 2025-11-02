import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { TalkClient } from "@/app/[orgSlug]/(workspace)/talk/talk-client";

export default async function TalkPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/${orgSlug}/talk`);
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    redirect("/dashboard");
  }

  // Get user membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/dashboard");
  }

  return <TalkClient orgSlug={orgSlug} userId={user.id} />;
}
