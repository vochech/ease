import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { requireFeatureAccess } from "@/lib/visibility-server";

/**
 * Approve a time entry (Manager, BUSINESS+)
 * POST /api/[orgSlug]/time/entries/[entryId]/approve
 */
export async function POST(
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

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check approval permission (BUSINESS+, manager role)
    await requireFeatureAccess(user.id, org.id, "time_entries_approve");

    // Approve entry
    const { data: entry, error } = await supabase
      .from("time_entries")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", entryId)
      .eq("org_id", org.id)
      .eq("status", "submitted") // Can only approve submitted entries
      .select()
      .single();

    if (error) {
      console.error("[time/approve] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!entry) {
      return NextResponse.json(
        { error: "Entry not found or not submitted" },
        { status: 404 }
      );
    }

    // TODO: Send notification to entry owner

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("[time/approve] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
