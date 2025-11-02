import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
    const body = await req.json();

    const { metric, score, mood_emoji, comment } = body;

    // Validate metric
    const validMetrics = [
      "self_performance",
      "satisfaction",
      "trust",
      "meaning",
      "stress",
      "mood",
    ];
    if (!metric || !validMetrics.includes(metric)) {
      return NextResponse.json(
        { error: "Invalid metric. Must be one of: " + validMetrics.join(", ") },
        { status: 400 }
      );
    }

    // Validate score
    if (score === undefined || score < 1 || score > 10) {
      return NextResponse.json(
        { error: "Score must be between 1 and 10" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get org
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

    // Verify user is member
    const { data: membership } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", org.id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    // Insert check-in
    const { data: checkin, error: checkinError } = await supabase
      .from("subjective_checkins")
      .insert({
        user_id: user.id,
        org_id: org.id,
        metric,
        score,
        mood_emoji: mood_emoji || null,
        comment: comment || null,
        checkin_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (checkinError) {
      console.error("Checkin insert error:", checkinError);
      return NextResponse.json(
        { error: "Failed to save check-in" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, checkin });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// GET: Fetch user's recent check-ins
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
    const { searchParams } = new URL(req.url);
    const metric = searchParams.get("metric");
    const limit = parseInt(searchParams.get("limit") || "30");

    const supabase = await supabaseServer();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get org
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

    // Build query
    let query = supabase
      .from("subjective_checkins")
      .select("*")
      .eq("user_id", user.id)
      .eq("org_id", org.id)
      .order("checkin_at", { ascending: false })
      .limit(limit);

    if (metric) {
      query = query.eq("metric", metric);
    }

    const { data: checkins, error: checkinsError } = await query;

    if (checkinsError) {
      console.error("Checkins fetch error:", checkinsError);
      return NextResponse.json(
        { error: "Failed to fetch check-ins" },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkins });
  } catch (error) {
    console.error("Check-in fetch error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
