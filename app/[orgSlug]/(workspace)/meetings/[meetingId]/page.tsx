import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { InAppMeeting } from "@/components/meeting/in-app-meeting";

export default async function MeetingRoomPage({
  params,
}: {
  params: Promise<{ orgSlug: string; meetingId: string }>;
}) {
  const { orgSlug, meetingId } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Gate: require auth to access meeting room
  redirect("/auth/login");
  }

  // Fetch meeting with RLS enforcing org membership
  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, org_id, title, created_by")
    .eq("id", meetingId)
    .single();

  if (!meeting) {
    return notFound();
  }

  // Fetch user's org member record for display name and role
  const { data: me } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", meeting.org_id)
    .eq("user_id", user.id)
    .single();

  const userRole = (me?.role as "owner" | "manager" | "member") || "member";

  return (
    <main className="mx-auto max-w-6xl p-4">
      <header className="mb-3">
        <h1 className="text-xl font-semibold text-gray-900">{meeting.title}</h1>
        <p className="text-sm text-gray-500">
          In-app meeting • Room {meeting.id.slice(0, 8)}
        </p>
      </header>
      <InAppMeeting
        orgSlug={orgSlug}
        meetingId={meeting.id}
        userId={user.id}
        userRole={userRole}
      />
    </main>
  );
}
