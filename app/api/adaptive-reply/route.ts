import { NextRequest, NextResponse } from "next/server";
import { generateAdaptiveReply } from "@/lib/ai-mediator";

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }
    const reply = await generateAdaptiveReply(message, context || {});
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}
