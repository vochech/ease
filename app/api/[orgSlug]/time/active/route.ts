import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { requireFeatureAccess } from "@/lib/visibility-server";

/**
 * Get the active timer for the current user
 * GET /api/[orgSlug]/time/active
 */
export async function GET(
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

    // Get active timer
    const { data: activeTimer } = await supabase.rpc("get_active_timer", {
      p_user_id: user.id,
    });

    if (!activeTimer || activeTimer.length === 0) {
      return NextResponse.json({ active_timer: null });
    }

    // Fetch related project/task data if present
    const timer = activeTimer[0];
    let project = null;
    let task = null;

    if (timer.project_id) {
      const { data: projectData } = await supabase
        .from("projects")
        .select("id, name, slug")
        .eq("id", timer.project_id)
        .single();
      project = projectData;
    }

    if (timer.task_id) {
      const { data: taskData } = await supabase
        .from("tasks")
        .select("id, title")
        .eq("id", timer.task_id)
        .single();
      task = taskData;
    }

    return NextResponse.json({
      active_timer: {
        ...timer,
        project,
        task,
      },
    });
  } catch (error) {
    console.error("[time/active] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
