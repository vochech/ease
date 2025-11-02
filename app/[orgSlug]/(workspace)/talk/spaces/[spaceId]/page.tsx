import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { SpaceDetailClient } from "@/app/[orgSlug]/(workspace)/talk/spaces/[spaceId]/space-detail-client";

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; spaceId: string }>;
}) {
  const { orgSlug, spaceId } = await params;
  const supabase = await supabaseServer();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/${orgSlug}/talk/spaces/${spaceId}`);
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

  // Get space
  const { data: space } = await supabase
    .from("talk_spaces")
    .select("*")
    .eq("id", spaceId)
    .eq("org_id", org.id)
    .single();

  if (!space) {
    redirect(`/${orgSlug}/talk`);
  }

  return (
    <SpaceDetailClient
      orgSlug={orgSlug}
      spaceId={spaceId}
      spaceName={space.title}
      userId={user.id}
    />
  );
}
