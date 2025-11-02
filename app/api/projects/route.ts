import { NextResponse } from "next/server";
import { requireRole, getUser } from "../../../lib/roles";
import { supabaseServer } from "../../../lib/supabaseServer";
import { z } from "zod";

/**
 * GET /api/projects
 * List all projects for the user's organizations.
 * Requires: authenticated user
 */
export async function GET(req: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const supabase = await supabaseServer();

    // Get all projects (in production, filter by user's org memberships)
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch projects", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ projects: data || [] });
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

const createProjectSchema = z.object({
  org_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  status: z
    .enum(["active", "paused", "completed", "archived"])
    .default("active"),
});

/**
 * POST /api/projects
 * Create a new project.
 * Requires: owner, manager, or member
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = createProjectSchema.parse(body);

    // Check permissions - owner, manager, and member can create projects
    await requireRole(validatedData.org_id, ["owner", "manager", "member"]);

    const supabase = await supabaseServer();

    // Create the project
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        org_id: validatedData.org_id,
        status: validatedData.status,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create project", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ project: data }, { status: 201 });
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

    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
