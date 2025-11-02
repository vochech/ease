import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string | undefined;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgSlug: string; meetingId: string }> }
) {
  const { meetingId } = await context.params;
  if (!OPENAI_API_KEY)
    return NextResponse.json(
      { error: "OPENAI_API_KEY missing" },
      { status: 500 }
    );

  const { transcript } = (await req.json()) as { transcript: string };
  if (!transcript || transcript.length < 10) {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // simple prompt for summary + action items
  const prompt = `Summarize the following meeting transcript in 5-8 bullet points, then list action items with owners if mentioned. Keep it concise and neutral. Transcript:\n\n${transcript}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that produces clear, concise meeting summaries.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.error?.message || "OpenAI error" },
      { status: 400 }
    );
  }

  const data = (await res.json()) as any;
  const summary = data.choices?.[0]?.message?.content ?? "";

  // store notes
  const { error } = await supabase.from("meeting_notes").insert({
    meeting_id: meetingId,
    transcript,
    summary,
    created_by: user.id,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, summary });
}
