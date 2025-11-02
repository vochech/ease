import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { requireFeatureAccess } from "@/lib/visibility-server";

/**
 * Submit a time entry for approval (BUSINESS+)
 * POST /api/[orgSlug]/time/entries/[entryId]/submit
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

    // Check if org requires approval (via settings)
    const { data: settings } = await supabase
      .from("time_tracking_settings")
      .select("require_approval")
      .eq("org_id", org.id)
      .single();

    if (!settings?.require_approval) {
      return NextResponse.json(
        { error: "This organization does not require time entry approval" },
        { status: 400 }
      );
    }

    // Update status to 'submitted'
    const { data: entry, error } = await supabase
      .from("time_entries")
      .update({ status: "submitted" })
      .eq("id", entryId)
      .eq("user_id", user.id) // Only own entries
      .eq("status", "draft") // Can only submit draft
      .select()
      .single();

    if (error) {
      console.error("[time/submit] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!entry) {
      return NextResponse.json(
        { error: "Entry not found or already submitted" },
        { status: 404 }
      );
    }

    // TODO: Send notification to managers

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("[time/submit] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
