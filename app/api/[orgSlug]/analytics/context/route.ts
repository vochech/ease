import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch user's latest context snapshot
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const { data: snapshot, error: snapshotError } = await supabase
      .from("context_snapshots")
      .select("*")
      .eq("user_id", user.id)
      .eq("org_id", org.id)
      .order("snapshot_at", { ascending: false })
      .limit(1)
      .single();

    if (snapshotError && snapshotError.code !== "PGRST116") {
      console.error("Context snapshot fetch error:", snapshotError);
      return NextResponse.json(
        { error: "Failed to fetch context snapshot" },
        { status: 500 }
      );
    }

    return NextResponse.json({ snapshot: snapshot || null });
  } catch (error) {
    console.error("Context snapshot error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST: Create new context snapshot
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
    const body = await req.json();
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const { data: snapshot, error: snapshotError } = await supabase
      .from("context_snapshots")
      .insert({
        user_id: user.id,
        org_id: org.id,
        snapshot_at: new Date().toISOString(),
        work_mode: body.work_mode || null,
        chronotype: body.chronotype || null,
        sleep_hours: body.sleep_hours || null,
        health_note: body.health_note || null,
        on_sick_leave: body.on_sick_leave || false,
        weekly_capacity_hours: body.weekly_capacity_hours || null,
        on_vacation: body.on_vacation || false,
        project_context: body.project_context || null,
        company_context: body.company_context || null,
      })
      .select()
      .single();

    if (snapshotError) {
      console.error("Context snapshot insert error:", snapshotError);
      return NextResponse.json(
        { error: "Failed to save context snapshot" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error("Context snapshot save error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
