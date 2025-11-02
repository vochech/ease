import { NextRequest, NextResponse } from "next/server";
import { EgressClient } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY as string;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET as string;
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL as string;
const SEED_SECRET = process.env.SEED_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Not available in production" },
        { status: 404 },
      );
    }

    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    if (!secret || secret !== SEED_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
      return NextResponse.json(
        { error: "LiveKit env missing" },
        { status: 500 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as unknown;
    const { egressId } = (
      typeof body === "object" && body !== null ? body : {}
    ) as { egressId?: string };
    const id = egressId || url.searchParams.get("egressId") || undefined;
    if (!id)
      return NextResponse.json({ error: "Missing egressId" }, { status: 400 });

    const egress = new EgressClient(
      LIVEKIT_WS_URL,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
    );
    const res = await egress.stopEgress(id);

    return NextResponse.json({ ok: true, egress: res });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to stop recording" },
      { status: 500 },
    );
  }
}
