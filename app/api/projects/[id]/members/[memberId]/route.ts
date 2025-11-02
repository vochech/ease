import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; memberId: string }> },
) {
  const { id: projectId, memberId } = await context.params;

  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    // Validate input
    if (!role) {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
    }

    if (!["manager", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'manager' or 'member'" },
        { status: 400 },
      );
    }

    // Check if user has permission (owner or manager of the org)
    const { data: project } = await supabase
      .from("projects")
      .select("org_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: orgMember } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", project.org_id)
      .eq("user_id", user.id)
      .single();

    if (!orgMember || !["owner", "manager"].includes(orgMember.role)) {
      return NextResponse.json(
        { error: "Forbidden: You must be an owner or manager" },
        { status: 403 },
      );
    }

    // Update member role
    const { data: updatedMember, error } = await supabase
      .from("project_members")
      .update({ role })
      .eq("id", memberId)
      .eq("project_id", projectId)
      .select(
        `
        id,
        project_id,
        user_id,
        role,
        added_by,
        created_at,
        updated_at,
        users:user_id (
          email
        )
      `,
      )
      .single();

    if (error) {
      console.error("Error updating project member:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error(
      "Error in PATCH /api/projects/[id]/members/[memberId]:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; memberId: string }> },
) {
  const { id: projectId, memberId } = await context.params;

  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission (owner or manager of the org)
    const { data: project } = await supabase
      .from("projects")
      .select("org_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: orgMember } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", project.org_id)
      .eq("user_id", user.id)
      .single();

    if (!orgMember || !["owner", "manager"].includes(orgMember.role)) {
      return NextResponse.json(
        { error: "Forbidden: You must be an owner or manager" },
        { status: 403 },
      );
    }

    // Delete member from project
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (error) {
      console.error("Error removing project member:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Error in DELETE /api/projects/[id]/members/[memberId]:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
