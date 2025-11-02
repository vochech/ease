import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ orgSlug: string; meetingId: string }> }
) {
  try {
    const { orgSlug, meetingId } = await context.params;
    const { status } = (await req.json()) as { status: string };
    if (
      !status ||
      !["pending", "accepted", "declined", "maybe"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("meeting_participants")
      .update({ status })
      .eq("meeting_id", meetingId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath(`/${orgSlug}/calendar`, "page");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
