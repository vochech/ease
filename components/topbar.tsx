import { supabaseServer } from "@/lib/supabaseServer";
import { UserMenu } from "@/components/auth/user-menu";
import { OrgSwitcher } from "@/components/org-switcher";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

export default async function Topbar({
  title = "Dashboard",
  currentOrgSlug,
}: {
  title?: string;
  currentOrgSlug?: string;
}) {
  // Check if in dev mode with bypass enabled
  const isDev = process.env.NODE_ENV === "development";
  const bypassAuth = isDev && process.env.BYPASS_AUTH === "true";

  let user = null;
  let userOrgs: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }> = [];

  if (!bypassAuth) {
    try {
      const supabase: SupabaseClient = await supabaseServer();
      const { data } = await supabase.auth.getUser();
      user = data.user;

      // Fetch user's organizations with roles
      if (user) {
        const { data: memberships } = await supabase
          .from("org_members")
          .select("role, organizations(id, name, slug)")
          .eq("user_id", user.id);

        if (memberships) {
          userOrgs = memberships
            .filter((m: any) => m.organizations)
            .map((m: any) => ({
              id: m.organizations.id,
              name: m.organizations.name,
              slug: m.organizations.slug,
              role: m.role,
            }));
        }
      }
    } catch {
      // ignore if not configured
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">
          {title}
        </h1>
        <div className="flex items-center gap-3">
          {bypassAuth ? (
            <span className="text-xs text-gray-500">Dev Mode</span>
          ) : user ? (
            <>
              {userOrgs.length > 0 && (
                <OrgSwitcher orgs={userOrgs} currentOrgSlug={currentOrgSlug} />
              )}
              <UserMenu />
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-all hover:bg-gray-50 hover:shadow-sm"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
