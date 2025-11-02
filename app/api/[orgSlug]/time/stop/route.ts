import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { requireFeatureAccess } from "@/lib/visibility";

/**
 * Stop the active timer for the current user
 * POST /api/[orgSlug]/time/stop
 * Body: { entry_id: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
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

    // Check feature access
    await requireFeatureAccess(user.id, org.id, "time_entries_own");

    const body = await req.json();
    const { entry_id } = body;

    if (!entry_id) {
      return NextResponse.json({ error: "Missing entry_id" }, { status: 400 });
    }

    // Stop the timer by setting ended_at
    const { data: entry, error } = await supabase
      .from("time_entries")
      .update({
        ended_at: new Date().toISOString(),
      })
      .eq("id", entry_id)
      .eq("user_id", user.id) // Security: only own entries
      .is("ended_at", null) // Only stop running timers
      .select()
      .single();

    if (error) {
      console.error("[time/stop] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!entry) {
      return NextResponse.json(
        { error: "Timer not found or already stopped" },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("[time/stop] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
