import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY as string;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET as string;
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL as string;
const SEED_SECRET = process.env.SEED_SECRET as string;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Not available in production" },
        { status: 404 },
      );
    }
    if (!secret || secret !== SEED_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
      return NextResponse.json(
        { error: "LiveKit env missing" },
        { status: 500 },
      );
    }

    const identity = `health-${Date.now()}`;
    const roomName = "health-check";

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: identity,
      ttl: "5m",
    });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return NextResponse.json({
      ok: true,
      wsUrl: LIVEKIT_WS_URL,
      room: roomName,
      identity,
      token,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "LiveKit health failed" },
      { status: 500 },
    );
  }
}
