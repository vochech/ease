import { NextResponse } from "next/server";
import { requireRole } from "../../../../lib/roles";
import { supabaseServer } from "../../../../lib/supabaseServer";

/**
 * GET /api/projects/[id]
 * Get a single project by ID.
 * Requires: viewer or above
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Note: In production, you'd check org membership for the project's org_id
    // For now, we'll allow any authenticated user to view
    // Example: await requireRole(data.org_id, ['viewer', 'member', 'manager', 'owner']);

    return NextResponse.json({ project: data });
  } catch (error: any) {
    // If requireRole throws a NextResponse, return it
    if (error instanceof NextResponse) {
      return error;
    }
    
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project.
 * Requires: owner or manager
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const supabase = await supabaseServer();

    // First, get the project to find its org_id
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("org_id")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check permissions - only owner and manager can update
    await requireRole(project.org_id, ["owner", "manager"]);

    // Update the project
    const { data, error } = await supabase
      .from("projects")
      .update({
        name: body.name,
        description: body.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update project", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ project: data });
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project.
 * Requires: owner or manager
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await supabaseServer();

    // First, get the project to find its org_id
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("org_id")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check permissions - only owner and manager can delete
    await requireRole(project.org_id, ["owner", "manager"]);

    // Delete the project
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete project", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
