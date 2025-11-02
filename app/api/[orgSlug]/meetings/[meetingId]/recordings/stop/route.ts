import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { EgressClient } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY as string;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET as string;
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL as string;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgSlug: string; meetingId: string }> }
) {
  try {
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
      return NextResponse.json(
        { error: "LiveKit env missing" },
        { status: 500 }
      );
    }

    const { egressId } = (await req.json()) as { egressId: string };
    if (!egressId)
      return NextResponse.json({ error: "egressId required" }, { status: 400 });

    const supabase = await supabaseServer();
    const { meetingId } = await context.params;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // auth check: user must belong to org
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
    const result = await egress.stopEgress(egressId);
    return NextResponse.json({ ok: true, egress: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to stop recording" },
      { status: 500 }
    );
  }
}
