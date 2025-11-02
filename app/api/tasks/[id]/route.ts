import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  start_date: z.string().datetime().nullable().optional(),
  estimated_hours: z.number().positive().nullable().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

/**
 * GET /api/tasks/[id]
 * Get a single task with its subtasks if it's a manager task
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();

    const { data: task, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If manager task, fetch subtasks
    if (task.task_type === "manager") {
      const { data: subtasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("parent_task_id", id)
        .order("created_at", { ascending: false });

      return NextResponse.json({ task: { ...task, subtasks: subtasks || [] } });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = updateTaskSchema.parse(body);

    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.completed !== undefined)
      updateData.completed = validatedData.completed;
    if (validatedData.assigned_to !== undefined)
      updateData.assigned_to = validatedData.assigned_to;
    if (validatedData.due_date !== undefined)
      updateData.due_date = validatedData.due_date;
    if (validatedData.start_date !== undefined)
      updateData.start_date = validatedData.start_date;
    if (validatedData.estimated_hours !== undefined)
      updateData.estimated_hours = validatedData.estimated_hours;
    if (validatedData.progress !== undefined)
      updateData.progress = validatedData.progress;
    if (validatedData.priority !== undefined)
      updateData.priority = validatedData.priority;

    const { data: task, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Task update error:", error);
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 },
      );
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task (RLS policies handle permissions)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Task delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete task" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
