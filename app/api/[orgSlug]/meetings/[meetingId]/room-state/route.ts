import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { RoomServiceClient } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY as string;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET as string;
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL as string;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orgSlug: string; meetingId: string }> }
) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
    return NextResponse.json({ error: "LiveKit env missing" }, { status: 500 });
  }
  const { meetingId } = await context.params;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify membership to org of meeting
  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, org_id, created_by")
    .eq("id", meetingId)
    .single();
  if (!meeting)
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

  const { data: member } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", meeting.org_id)
    .eq("user_id", user.id)
    .single();
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = new RoomServiceClient(
    LIVEKIT_WS_URL,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET
  );
  const participants = await svc.listParticipants(meetingId).catch(() => []);
  // Host present when any participant has permissions.roomAdmin set
  const hostPresent =
    Array.isArray(participants) &&
    participants.some((p: any) => p.permissions?.roomAdmin);

  return NextResponse.json({ hostPresent });
}
