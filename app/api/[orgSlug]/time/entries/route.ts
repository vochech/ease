import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { requireFeatureAccess, checkFeatureAccess } from "@/lib/visibility";

/**
 * List time entries with filters
 * GET /api/[orgSlug]/time/entries?from=YYYY-MM-DD&to=YYYY-MM-DD&user_id=X&status=draft
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
    const { searchParams } = new URL(req.url);
    
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const userId = searchParams.get("user_id");
    const projectId = searchParams.get("project_id");
    const status = searchParams.get("status");
    
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

    // Check if user can see team entries (BUSINESS+)
    const teamAccess = await checkFeatureAccess(user.id, org.id, "time_entries_team_view");
    
    // Build query
    let query = supabase
      .from("time_entries")
      .select(`
        *,
        project:projects(id, name, slug),
        task:tasks(id, title)
      `)
      .eq("org_id", org.id)
      .order("started_at", { ascending: false });

    // Filter by user: own entries or team (if has access)
    if (userId) {
      if (userId !== user.id && !teamAccess.hasAccess) {
        return NextResponse.json(
          { error: "Insufficient permissions to view other users' entries" },
          { status: 403 }
        );
      }
      query = query.eq("user_id", userId);
    } else if (!teamAccess.hasAccess) {
      // FREE/TEAM tier: can only see own entries
      query = query.eq("user_id", user.id);
    }

    // Date range
    if (from) {
      query = query.gte("started_at", new Date(from).toISOString());
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1); // Include the entire 'to' day
      query = query.lt("started_at", toDate.toISOString());
    }

    // Project filter
    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    // Status filter
    if (status) {
      query = query.eq("status", status);
    }

    const { data: entries, error } = await query;

    if (error) {
      console.error("[time/entries] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entries: entries || [] });
  } catch (error) {
    console.error("[time/entries] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create a manual time entry
 * POST /api/[orgSlug]/time/entries
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

    // Check feature access
    await requireFeatureAccess(user.id, org.id, "time_entries_own");

    const body = await req.json();
    const {
      started_at,
      ended_at,
      project_id,
      task_id,
      description,
      tags,
      billable,
    } = body;

    if (!started_at || !ended_at) {
      return NextResponse.json(
        { error: "started_at and ended_at are required" },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(started_at);
    const end = new Date(ended_at);
    if (end <= start) {
      return NextResponse.json(
        { error: "ended_at must be after started_at" },
        { status: 400 }
      );
    }

    // Create entry
    const { data: entry, error } = await supabase
      .from("time_entries")
      .insert({
        org_id: org.id,
        user_id: user.id,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        project_id: project_id || null,
        task_id: task_id || null,
        description: description || "",
        tags: tags || [],
        billable: billable !== undefined ? billable : true,
        entry_type: "manual",
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("[time/entries] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("[time/entries] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
