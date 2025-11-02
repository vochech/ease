import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

type JoinPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return path
    redirect(`/auth/login?redirect=/join/${orgSlug}`);
  }

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .single();

  if (orgError || !org) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Organization Not Found
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              The organization{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">
                {orgSlug}
              </code>{" "}
              doesn&apos;t exist.
            </p>
          </div>
          <div className="flex justify-center pt-4">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Go to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("org_members")
    .select("id, role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    // Already a member - redirect to org
    redirect(`/${org.slug}/dashboard`);
  }

  // Add user as a member (default role: member)
  const { error: insertError } = await supabase.from("org_members").insert({
    org_id: org.id,
    user_id: user.id,
    role: "member",
  });

  if (insertError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-red-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Error Joining Organization
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Could not add you to the organization. Please contact an
              administrator.
            </p>
            <p className="mt-2 text-xs text-red-600">{insertError.message}</p>
          </div>
          <div className="flex justify-center pt-4">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Go to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success - redirect to org dashboard
  redirect(`/${org.slug}/dashboard`);
}
