import { NextRequest, NextResponse } from "next/server";
import {
  EgressClient,
  EncodedFileType,
  EncodedFileOutput,
} from "livekit-server-sdk";

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
    const { room } = (
      typeof body === "object" && body !== null ? body : {}
    ) as { room?: string };
    const roomName = room || "health-check";

    const egress = new EgressClient(
      LIVEKIT_WS_URL,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
    );
    const filepath = `livekit-demo/health-${Date.now()}.mp4`;

    // Create EncodedFileOutput instance
    const fileOutput = new EncodedFileOutput();
    fileOutput.filepath = filepath;
    fileOutput.fileType = EncodedFileType.MP4;

    // Wrap in EncodedOutputs interface
    const outputs = {
      file: fileOutput,
    };

    const result = await egress.startRoomCompositeEgress(roomName, outputs);

    return NextResponse.json({
      ok: true,
      room: roomName,
      filepath,
      egress: result,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to start recording" },
      { status: 500 },
    );
  }
}
