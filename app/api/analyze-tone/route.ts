import { NextRequest, NextResponse } from "next/server";
import { analyzeMessageTone } from "@/lib/ai-mediator";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const tone = await analyzeMessageTone(message);
    return NextResponse.json({ tone });
  } catch (e) {
    return NextResponse.json({ error: "Tone analysis failed" }, { status: 500 });
  }
}
