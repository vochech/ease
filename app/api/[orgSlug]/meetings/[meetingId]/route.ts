import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> },
) {
  const { meetingId } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get meeting with participants
  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("*, meeting_participants(user_id, status)")
    .eq("id", meetingId)
    .single();

  if (error || !meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  return NextResponse.json(meeting);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> },
) {
  const { orgSlug, meetingId } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    title?: string;
    description?: string;
    start_time?: string;
    end_time?: string | null;
    location?: string;
    meeting_link?: string;
  };

  // Get the meeting to check permissions and get old times for notification
  const { data: meeting, error: fetchError } = await supabase
    .from("meetings")
    .select("*, meeting_participants(user_id)")
    .eq("id", meetingId)
    .single();

  if (fetchError || !meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Check if user has permission (creator or org owner/manager)
  const { data: orgMember } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", meeting.org_id)
    .eq("user_id", user.id)
    .single();

  const canEdit =
    meeting.created_by === user.id ||
    orgMember?.role === "owner" ||
    orgMember?.role === "manager";

  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if time changed for notifications
  const timeChanged =
    (body.start_time && body.start_time !== meeting.start_time) ||
    (body.end_time !== undefined && body.end_time !== meeting.end_time);

  // Update meeting
  const { data: updatedMeeting, error: updateError } = await supabase
    .from("meetings")
    .update({
      title: body.title,
      description: body.description,
      start_time: body.start_time,
      end_time: body.end_time,
      location: body.location,
      meeting_link: body.meeting_link,
      updated_at: new Date().toISOString(),
    })
    .eq("id", meetingId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // If time changed, notify participants
  if (timeChanged && meeting.meeting_participants) {
    const participantIds = meeting.meeting_participants
      .map((p: { user_id: string }) => p.user_id)
      .filter((id: string) => id !== user.id); // Don't notify the person making the change

    if (participantIds.length > 0) {
      // TODO: Send actual notifications (email, push, etc.)
      console.log("📅 Meeting time changed - notifying participants:", {
        meetingId,
        meetingTitle: updatedMeeting.title,
        oldTime: meeting.start_time,
        newTime: updatedMeeting.start_time,
        participantIds,
      });

      // For now, we could create a simple notification record in the database
      // You can add a notifications table later
    }
  }

  revalidatePath(`/${orgSlug}/calendar`, "page");
  return NextResponse.json({ meeting: updatedMeeting });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> },
) {
  const { orgSlug, meetingId } = await params;
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("meetings")
      .delete()
      .eq("id", meetingId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath(`/${orgSlug}/calendar`, "page");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
