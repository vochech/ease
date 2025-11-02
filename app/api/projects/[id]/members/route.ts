import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await context.params;

  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch project members with user details
    const { data: members, error } = await supabase
      .from("project_members")
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
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching project members:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error("Error in GET /api/projects/[id]/members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await context.params;

  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, role } = body;

    // Validate input
    if (!user_id || !role) {
      return NextResponse.json(
        { error: "user_id and role are required" },
        { status: 400 },
      );
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

    // Check if user_id is a member of the organization
    const { data: targetOrgMember } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", project.org_id)
      .eq("user_id", user_id)
      .single();

    if (!targetOrgMember) {
      return NextResponse.json(
        { error: "User is not a member of this organization" },
        { status: 400 },
      );
    }

    // Add member to project
    const { data: newMember, error } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id,
        role,
        added_by: user.id,
      })
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
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "User is already a member of this project" },
          { status: 409 },
        );
      }
      console.error("Error adding project member:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/projects/[id]/members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
