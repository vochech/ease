import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { getOrgMembership } from "@/lib/roles";
import { OrgProvider } from "@/components/providers/org-provider";

type OrgLayoutProps = {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // DEV MODE: Allow bypassing auth if no user exists and dev mode is enabled
  const isDev = process.env.NODE_ENV === "development";
  const bypassAuth = isDev && process.env.BYPASS_AUTH === "true";

  if (!user && !bypassAuth) {
    redirect(`/login?redirect=/${orgSlug}`);
  }

  // Fetch organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", orgSlug)
    .single();

  if (orgError || !org) {
    redirect("/404");
  }

  // Get user's membership (or mock in dev bypass mode)
  let membership;
  let userId: string;

  if (bypassAuth && !user) {
    // DEV MODE: Create mock membership as owner
    membership = { role: "owner" as const };
    userId = "dev-user-id";
  } else {
    membership = await getOrgMembership(org.id);
    userId = user!.id;

    if (!membership) {
      redirect(`/join/${orgSlug}`);
    }
  }

  return (
    <OrgProvider
      value={{
        orgId: org.id,
        orgSlug: org.slug,
        orgName: org.name,
        userId,
        userRole: membership.role,
      }}
    >
      {children}
    </OrgProvider>
  );
}
