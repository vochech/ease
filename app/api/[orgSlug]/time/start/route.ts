import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { requireFeatureAccess } from "@/lib/visibility-server";

/**
 * Start a new timer for the current user
 * POST /api/[orgSlug]/time/start
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

    // Check feature access (FREE tier minimum)
    await requireFeatureAccess(user.id, org.id, "time_entries_own");

    // Check if user already has an active timer
    const { data: activeTimer } = await supabase.rpc("get_active_timer", {
      p_user_id: user.id,
    });

    if (activeTimer && activeTimer.length > 0) {
      return NextResponse.json(
        { error: "Timer already running", active_timer: activeTimer[0] },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { project_id, task_id, description, tags, billable } = body;

    // Create new timer entry
    const { data: entry, error } = await supabase
      .from("time_entries")
      .insert({
        org_id: org.id,
        user_id: user.id,
        started_at: new Date().toISOString(),
        project_id: project_id || null,
        task_id: task_id || null,
        description: description || "",
        tags: tags || [],
        billable: billable !== undefined ? billable : true,
        entry_type: "timer",
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("[time/start] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ timer: entry }, { status: 201 });
  } catch (error) {
    console.error("[time/start] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
