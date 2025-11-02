import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

/**
 * Seed route - inserts sample data into Supabase tables.
 * For dev/demo purposes only. Protect this route in production!
 */
export async function POST(req: Request) {
  try {
    // Optional: check for a secret header to prevent unauthorized seeding
    const authHeader = req.headers.get("x-seed-secret");
    const expectedSecret = process.env.SEED_SECRET || "dev-seed-secret";

    if (authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized. Provide correct x-seed-secret header." },
        { status: 401 },
      );
    }

    const supabase = await supabaseServer();

    // Insert sample projects
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .insert([
        {
          name: "Website Redesign",
          description: "Modernize company website with new branding",
        },
        {
          name: "Mobile App Launch",
          description: "Launch iOS and Android apps for Q4",
        },
        {
          name: "API v2 Migration",
          description: "Migrate all services to new REST API",
        },
        {
          name: "Customer Dashboard",
          description: "Build self-service portal for customers",
        },
      ])
      .select();

    if (projectsError) {
      console.error("Projects seed error:", projectsError);
      return NextResponse.json(
        { error: "Failed to seed projects", details: projectsError.message },
        { status: 500 },
      );
    }

    // Insert sample tasks (linked to projects)
    const projectIds = projects?.map((p) => p.id) || [];
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .insert([
        {
          project_id: projectIds[0],
          title: "Design homepage mockups",
          completed: true,
        },
        {
          project_id: projectIds[0],
          title: "Update color palette",
          completed: false,
        },
        {
          project_id: projectIds[0],
          title: "Review wireframes with team",
          completed: false,
        },
        {
          project_id: projectIds[1],
          title: "Setup app store accounts",
          completed: true,
        },
        {
          project_id: projectIds[1],
          title: "Prepare marketing materials",
          completed: false,
        },
        {
          project_id: projectIds[1],
          title: "Submit for app review",
          completed: false,
        },
        {
          project_id: projectIds[2],
          title: "Write migration guide",
          completed: false,
        },
        {
          project_id: projectIds[2],
          title: "Test backward compatibility",
          completed: false,
        },
        {
          project_id: projectIds[3],
          title: "Design user flows",
          completed: true,
        },
        {
          project_id: projectIds[3],
          title: "Implement authentication",
          completed: false,
        },
      ])
      .select();

    if (tasksError) {
      console.error("Tasks seed error:", tasksError);
      return NextResponse.json(
        { error: "Failed to seed tasks", details: tasksError.message },
        { status: 500 },
      );
    }

    // Insert sample meetings
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: meetings, error: meetingsError } = await supabase
      .from("meetings")
      .insert([
        {
          project_id: projectIds[0],
          title: "Design Review",
          starts_at: tomorrow.toISOString(),
        },
        {
          project_id: projectIds[1],
          title: "Sprint Planning",
          starts_at: new Date(
            now.getTime() + 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          project_id: projectIds[2],
          title: "API Migration Sync",
          starts_at: nextWeek.toISOString(),
        },
      ])
      .select();

    if (meetingsError) {
      console.error("Meetings seed error:", meetingsError);
      return NextResponse.json(
        { error: "Failed to seed meetings", details: meetingsError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      counts: {
        projects: projects?.length || 0,
        tasks: tasks?.length || 0,
        meetings: meetings?.length || 0,
      },
    });
  } catch (error: any) {
    console.error("Seed route error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}
