import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/roles";
import { autoScheduleTasks } from "@/lib/scheduling/auto-scheduler";

/**
 * POST /api/projects/[id]/auto-schedule
 * Automatically schedule tasks for a project using the auto-scheduling algorithm.
 * Only managers and owners can trigger auto-scheduling.
 *
 * Query params:
 * - ?preview=true : Returns scheduling plan without applying changes
 * - ?apply=true : Applies the scheduling plan to tasks
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(req.url);
    const isPreview = searchParams.get("preview") === "true";
    const shouldApply = searchParams.get("apply") === "true";

    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get project and check permissions
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, org_id, status")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only managers and owners can auto-schedule
    await requireRole(project.org_id, ["owner", "manager"]);

    // Fetch all tasks for this project
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: "No tasks found for this project" },
        { status: 400 },
      );
    }

    // Get team members
    const { data: orgMembersRaw } = await supabase
      .from("org_members")
      .select("user_id, users(email)")
      .eq("org_id", project.org_id);

    const orgMembers = (orgMembersRaw || []).map((m: any) => ({
      user_id: m.user_id,
      users:
        m.users && Array.isArray(m.users) && m.users[0]
          ? m.users[0]
          : undefined,
    }));

    if (orgMembers.length === 0) {
      return NextResponse.json(
        { error: "No team members found" },
        { status: 400 },
      );
    }

    // Run auto-scheduling algorithm
    const schedulingResult = await autoScheduleTasks(tasks, orgMembers);

    // If preview mode, just return the plan
    if (isPreview || !shouldApply) {
      return NextResponse.json({
        preview: true,
        result: schedulingResult,
        message: "Scheduling plan generated. Use ?apply=true to apply changes.",
      });
    }

    // Apply scheduling changes
    const results = [];
    for (const scheduled of schedulingResult.scheduledTasks) {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          start_date: scheduled.suggestedStartDate.toISOString(),
          due_date: scheduled.suggestedDueDate.toISOString(),
          assigned_to: scheduled.assignedTo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scheduled.taskId);

      results.push({ data, error });
    }

    const failures = results.filter((r) => r.error);

    if (failures.length > 0) {
      console.error("Auto-schedule update failures:", failures);
      return NextResponse.json(
        {
          error: "Some tasks failed to update",
          applied: results.length - failures.length,
          failed: failures.length,
          result: schedulingResult,
        },
        { status: 207 },
      );
    }

    return NextResponse.json({
      success: true,
      applied: results.length,
      result: schedulingResult,
      message: `Successfully scheduled ${results.length} tasks`,
    });
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("POST /api/projects/[id]/auto-schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
