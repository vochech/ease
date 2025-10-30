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

  if (!user) {
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

  // Get user's membership
  const membership = await getOrgMembership(org.id);

  if (!membership) {
    redirect(`/join/${orgSlug}`);
  }

  return (
    <OrgProvider
      value={{
        orgId: org.id,
        orgSlug: org.slug,
        orgName: org.name,
        userId: user.id,
        userRole: membership.role,
      }}
    >
      {children}
    </OrgProvider>
  );
}
