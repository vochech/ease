import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS will enforce org membership via policies
  const { data, error } = await supabase
    .from("meeting_messages")
    .select("id, user_id, content, created_at")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ messages: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = (await req.json()) as { content: string };
  if (!content || !content.trim())
    return NextResponse.json({ error: "content required" }, { status: 400 });

  const { data, error } = await supabase
    .from("meeting_messages")
    .insert({ meeting_id: meetingId, user_id: user.id, content })
    .select("id, user_id, content, created_at")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: data });
}
