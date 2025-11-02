import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  EgressClient,
  EncodedFileType,
  EncodedFileOutput,
} from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY as string;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET as string;
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL as string;

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ orgSlug: string; meetingId: string }> }
) {
  try {
    const { meetingId } = await context.params;
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
      return NextResponse.json(
        { error: "LiveKit env missing" },
        { status: 500 }
      );
    }

    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const canRecord =
      member.role === "owner" ||
      member.role === "manager" ||
      meeting.created_by === user.id;
    if (!canRecord)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const egress = new EgressClient(
      LIVEKIT_WS_URL,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    );

    // Start a room composite egress (records the full layout). Output configuration must be set per deployment.
    const output = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: `recordings/${meetingId}-${Date.now()}.mp4`,
    });
    const result = await egress.startRoomCompositeEgress(meeting.id, output);

    return NextResponse.json({ ok: true, egress: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to start recording" },
      { status: 500 }
    );
  }
}
