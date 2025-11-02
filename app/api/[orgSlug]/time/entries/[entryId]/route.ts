import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

/**
 * Update a time entry
 * PATCH /api/[orgSlug]/time/entries/[entryId]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; entryId: string }> }
) {
  try {
    const { orgSlug, entryId } = await params;
    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      started_at,
      ended_at,
      project_id,
      task_id,
      description,
      tags,
      billable,
    } = body;

    // Build update object (only include provided fields)
    const updates: Record<string, unknown> = {};
    if (started_at !== undefined) updates.started_at = started_at;
    if (ended_at !== undefined) updates.ended_at = ended_at;
    if (project_id !== undefined) updates.project_id = project_id;
    if (task_id !== undefined) updates.task_id = task_id;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags;
    if (billable !== undefined) updates.billable = billable;

    // Update entry (only if user owns it and it's draft)
    const { data: entry, error } = await supabase
      .from("time_entries")
      .update(updates)
      .eq("id", entryId)
      .eq("user_id", user.id) // Security: only own entries
      .eq("status", "draft") // Can only update draft entries
      .select()
      .single();

    if (error) {
      console.error("[time/entries/update] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!entry) {
      return NextResponse.json(
        { error: "Entry not found or cannot be updated" },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("[time/entries/update] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Delete a time entry
 * DELETE /api/[orgSlug]/time/entries/[entryId]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; entryId: string }> }
) {
  try {
    const { orgSlug, entryId } = await params;
    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete entry (only if user owns it and it's draft)
    const { error } = await supabase
      .from("time_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", user.id) // Security: only own entries
      .eq("status", "draft"); // Can only delete draft entries

    if (error) {
      console.error("[time/entries/delete] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[time/entries/delete] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
