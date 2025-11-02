import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> },
) {
  const { meetingId } = await params;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS enforces org membership
  const { data, error } = await supabase
    .from("meeting_agenda_items")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("item_order", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> },
) {
  const { meetingId } = await params;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    title: string;
    description?: string;
    assigned_to?: string;
    duration_minutes?: number;
    item_order?: number;
  };

  if (!body.title)
    return NextResponse.json({ error: "title required" }, { status: 400 });

  const { data, error } = await supabase
    .from("meeting_agenda_items")
    .insert({
      meeting_id: meetingId,
      title: body.title,
      description: body.description,
      assigned_to: body.assigned_to,
      duration_minutes: body.duration_minutes,
      item_order: body.item_order ?? 0,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}
