import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { ApprovalClient } from "@/app/[orgSlug]/(workspace)/time/approvals/approval-client";

export default async function TimeApprovalsPage({
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
    redirect(`/auth/login?next=/${orgSlug}/time/approvals`);
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

  // Get user membership - must be manager+
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["manager", "owner"].includes(membership.role)) {
    redirect(`/${orgSlug}/time`);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Time Entry Approvals
        </h1>
        <p className="text-sm text-gray-500">
          Review and approve time entries submitted by your team
        </p>
      </div>

      <ApprovalClient orgSlug={orgSlug} />
    </div>
  );
}
