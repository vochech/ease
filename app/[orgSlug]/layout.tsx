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
    // Don't redirect to avoid loops - return error page directly
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center">
            <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Organization Not Found</h1>
            <p className="mt-2 text-sm text-gray-600">
              The organization <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">{orgSlug}</code> doesn't exist.
            </p>
            <p className="mt-4 text-sm text-gray-600">
              Make sure you've run the seed script (<code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">sql/seed_sample.sql</code>) in Supabase SQL Editor.
            </p>
          </div>
          <div className="flex justify-center gap-4 pt-4">
            <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              ← Go to home
            </a>
            <a href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Get user's membership (or mock in dev bypass mode)
  let membership;
  let userId: string;

  if (bypassAuth && !user) {
    // DEV MODE: Create mock membership as owner (skip DB check)
    membership = { 
      role: "owner" as const,
      org_id: org.id,
      user_id: "dev-user-id",
      created_at: new Date().toISOString()
    };
    userId = "dev-user-id";
  } else {
    // PRODUCTION: Check actual membership
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
