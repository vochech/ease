import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

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

    const {
      mood_score,
      stress_score,
      energy_level,
      external_stressors,
      wants_lighter_day,
      wants_day_off,
      notes,
    } = body;

    // Validate scores
    if (
      mood_score < 1 ||
      mood_score > 10 ||
      stress_score < 1 ||
      stress_score > 10 ||
      energy_level < 1 ||
      energy_level > 10
    ) {
      return NextResponse.json(
        { error: "Scores must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Calculate complexity preference
    let preferred_task_complexity: string | null = null;
    if (wants_lighter_day || stress_score >= 8 || energy_level <= 3) {
      preferred_task_complexity = "light";
    } else if (energy_level >= 8 && stress_score <= 4) {
      preferred_task_complexity = "challenging";
    } else {
      preferred_task_complexity = "normal";
    }

    // Determine family situation based on stressors
    let family_situation = "all_good";
    if (external_stressors?.includes("family")) {
      family_situation = stress_score >= 8 ? "serious_issue" : "minor_issue";
    }

    // Upsert daily check-in
    const { data: checkin, error: checkinError } = await supabase
      .from("daily_check_ins")
      .upsert(
        {
          user_id: user.id,
          org_id: org.id,
          check_in_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
          mood_score,
          stress_score,
          energy_level,
          had_difficult_morning: external_stressors?.length > 0,
          family_situation,
          external_stressors: external_stressors || [],
          preferred_task_complexity,
          can_handle_meetings: energy_level >= 5 && stress_score <= 7,
          needs_quiet_time: stress_score >= 7 || energy_level <= 4,
          available_hours_today: wants_day_off ? 0 : null,
          wants_lighter_day: wants_lighter_day || false,
          wants_day_off: wants_day_off || false,
          manager_notified: false, // Will be set by notification system
          notes,
        },
        { onConflict: "user_id,org_id,check_in_date" }
      )
      .select()
      .single();

    if (checkinError) {
      console.error("Daily check-in error:", checkinError);
      return NextResponse.json(
        { error: "Failed to save daily check-in" },
        { status: 500 }
      );
    }

    // If wants day off, notify manager (we'll do this via separate notification system)
    if (wants_day_off) {
      // TODO: Send notification to manager
      // For now, just log it
      console.log(
        `User ${user.id} requested day off for ${
          new Date().toISOString().split("T")[0]
        }`
      );
    }

    return NextResponse.json({
      success: true,
      checkin,
      recommended_complexity: preferred_task_complexity,
    });
  } catch (error) {
    console.error("Daily check-in error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// GET: Check if user has checked in today
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

    const { data: checkin } = await supabase
      .from("daily_check_ins")
      .select("*")
      .eq("user_id", user.id)
      .eq("org_id", org.id)
      .eq("check_in_date", new Date().toISOString().split("T")[0])
      .single();

    return NextResponse.json({
      hasCheckedToday: !!checkin,
      checkin: checkin || null,
    });
  } catch (error) {
    console.error("Daily check-in status error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
