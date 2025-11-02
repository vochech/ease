import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{ orgSlug: string; meetingId: string; itemId: string }>;
  }
) {
  const { itemId } = await context.params;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    title?: string;
    description?: string;
    assigned_to?: string;
    duration_minutes?: number;
    item_order?: number;
    completed?: boolean;
  };

  const { data, error } = await supabase
    .from("meeting_agenda_items")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}

export async function DELETE(
  _req: NextRequest,
  context: {
    params: Promise<{ orgSlug: string; meetingId: string; itemId: string }>;
  }
) {
  const { itemId } = await context.params;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("meeting_agenda_items")
    .delete()
    .eq("id", itemId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
