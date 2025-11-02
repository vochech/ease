import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { TimesheetClient } from "@/app/[orgSlug]/(workspace)/time/timesheet-client";

export default async function TimePage({
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
    redirect(`/auth/login?next=/${orgSlug}/time`);
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Time Tracking</h1>
          <p className="text-sm text-gray-500">Track your time and view timesheets</p>
        </div>
      </div>

      <TimesheetClient orgSlug={orgSlug} userRole={membership.role} />
    </div>
  );
}
