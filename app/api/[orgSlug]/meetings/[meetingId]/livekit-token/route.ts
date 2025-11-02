import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY as string;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET as string;
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL as string; // wss://.../ or ws:// for local

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> },
) {
  const { meetingId } = await params;

  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
    return NextResponse.json({ error: "LiveKit env missing" }, { status: 500 });
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve meeting + org membership
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

  const isHost =
    member.role === "owner" ||
    member.role === "manager" ||
    meeting.created_by === user.id;

  // Build token with role-based permissions
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: user.id,
    name: user.email || "Guest",
    ttl: "1h",
  });
  at.addGrant({
    room: meeting.id,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost, // hosts can perform admin actions
  });

  const token = await at.toJwt();
  return NextResponse.json({ token, wsUrl: LIVEKIT_WS_URL, isHost });
}
