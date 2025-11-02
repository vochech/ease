import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { requireFeatureAccess } from "@/lib/visibility-server";

/**
 * Reject a time entry (Manager, BUSINESS+)
 * POST /api/[orgSlug]/time/entries/[entryId]/reject
 * Body: { reason: string }
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

    // Check approval permission
    await requireFeatureAccess(user.id, org.id, "time_entries_approve");

    const body = await req.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Reject entry
    const { data: entry, error } = await supabase
      .from("time_entries")
      .update({
        status: "rejected",
        rejection_reason: reason,
        approved_by: user.id, // Track who rejected
        approved_at: new Date().toISOString(),
      })
      .eq("id", entryId)
      .eq("org_id", org.id)
      .eq("status", "submitted")
      .select()
      .single();

    if (error) {
      console.error("[time/reject] Error:", error);
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
    console.error("[time/reject] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
