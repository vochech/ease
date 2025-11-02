import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/roles";
import { z } from "zod";

const createManagerTaskSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  start_date: z.string().datetime().nullable().optional(),
  estimated_hours: z.number().positive().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

const createPersonalTaskSchema = z.object({
  parent_task_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  start_date: z.string().datetime().nullable().optional(),
  estimated_hours: z.number().positive().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

/**
 * GET /api/tasks
 * List tasks (manager tasks + personal subtasks user created)
 * Query params: ?project_id=uuid&type=manager|personal
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    const taskType = searchParams.get("type");

    let query = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (taskType) {
      query = query.eq("task_type", taskType);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error("Tasks fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 },
      );
    }

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tasks
 * Create a manager task or personal subtask
 * Body must include task_type to determine which schema to use
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const taskType = body.task_type as "manager" | "personal";

    if (taskType === "manager") {
      // Create manager task
      const validatedData = createManagerTaskSchema.parse(body);

      // Get project to find org_id for permission check
      const { data: project } = await supabase
        .from("projects")
        .select("org_id")
        .eq("id", validatedData.project_id)
        .single();

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 },
        );
      }

      // Check permissions - only owner/manager can create manager tasks
      await requireRole(project.org_id, ["owner", "manager"]);

      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          project_id: validatedData.project_id,
          title: validatedData.title,
          description: validatedData.description,
          assigned_to: validatedData.assigned_to,
          due_date: validatedData.due_date,
          start_date: validatedData.start_date,
          estimated_hours: validatedData.estimated_hours,
          priority: validatedData.priority,
          task_type: "manager",
          created_by: user.id,
          completed: false,
          progress: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Manager task creation error:", error);
        return NextResponse.json(
          { error: "Failed to create task" },
          { status: 500 },
        );
      }

      return NextResponse.json({ task }, { status: 201 });
    } else if (taskType === "personal") {
      // Create personal subtask
      const validatedData = createPersonalTaskSchema.parse(body);

      // Verify parent task exists and user has access
      const { data: parentTask } = await supabase
        .from("tasks")
        .select("id, project_id, task_type")
        .eq("id", validatedData.parent_task_id)
        .single();

      if (!parentTask || parentTask.task_type !== "manager") {
        return NextResponse.json(
          { error: "Invalid parent task" },
          { status: 400 },
        );
      }

      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          project_id: parentTask.project_id,
          title: validatedData.title,
          description: validatedData.description,
          due_date: validatedData.due_date,
          start_date: validatedData.start_date,
          estimated_hours: validatedData.estimated_hours,
          priority: validatedData.priority,
          task_type: "personal",
          parent_task_id: validatedData.parent_task_id,
          created_by: user.id,
          assigned_to: user.id,
          completed: false,
          progress: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Personal task creation error:", error);
        return NextResponse.json(
          { error: "Failed to create subtask" },
          { status: 500 },
        );
      }

      return NextResponse.json({ task }, { status: 201 });
    } else {
      return NextResponse.json({ error: "Invalid task_type" }, { status: 400 });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof NextResponse) {
      return error;
    }

    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
