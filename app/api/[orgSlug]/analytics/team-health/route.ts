import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { checkFeatureAccess, getOrgSubscription } from "@/lib/visibility-server";

// GET: Fetch team health overview (managers only)
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

    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", org.id)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "manager"].includes(membership.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check subscription tier for feature access
    const subscription = await getOrgSubscription(org.id);
    const canSeeIndividual = await checkFeatureAccess(
      user.id,
      org.id,
      "team_daily_status_individual"
    );

    // Get team members
    const { data: members } = await supabase
      .from("org_members")
      .select(
        `
        user_id,
        users:user_id (
          email,
          raw_user_meta_data
        )
      `
      )
      .eq("org_id", org.id);

    if (!members) {
      return NextResponse.json({ members: [] });
    }

    const memberIds = members.map((m: any) => m.user_id);

    // Get latest stress and mood for each member
    const { data: latestCheckins } = await supabase
      .from("subjective_checkins")
      .select("user_id, metric, score, mood_emoji, checkin_at")
      .in("user_id", memberIds)
      .eq("org_id", org.id)
      .order("checkin_at", { ascending: false });

    // Get AI burnout risks
    const { data: aiInsights } = await supabase
      .from("ai_insights")
      .select("user_id, burnout_risk, ai_performance_score")
      .in("user_id", memberIds)
      .eq("org_id", org.id)
      .order("calculated_at", { ascending: false });

    // Get current context (vacation, sick leave)
    const { data: contexts } = await supabase
      .from("context_snapshots")
      .select("user_id, on_vacation, on_sick_leave, weekly_capacity_hours")
      .in("user_id", memberIds)
      .eq("org_id", org.id)
      .order("snapshot_at", { ascending: false });

    // Aggregate data per user
    const teamHealth = members.map((member: any) => {
      const userId = member.user_id;

      // Latest stress
      const stressCheckin = latestCheckins?.find(
        (c: any) => c.user_id === userId && c.metric === "stress"
      );

      // Latest mood
      const moodCheckin = latestCheckins?.find(
        (c: any) => c.user_id === userId && c.metric === "mood"
      );

      // Latest AI insight
      const aiInsight = aiInsights?.find((ai: any) => ai.user_id === userId);

      // Latest context
      const context = contexts?.find((c: any) => c.user_id === userId);

      return {
        user_id: userId,
        email: member.users?.email,
        name:
          member.users?.raw_user_meta_data?.full_name || member.users?.email,
        // Only show individual data on Team+ tier
        stress_score: canSeeIndividual.hasAccess
          ? stressCheckin?.score || null
          : null,
        mood_score: canSeeIndividual.hasAccess
          ? moodCheckin?.score || null
          : null,
        mood_emoji: canSeeIndividual.hasAccess
          ? moodCheckin?.mood_emoji || null
          : null,
        burnout_risk: canSeeIndividual.hasAccess
          ? aiInsight?.burnout_risk || null
          : null,
        ai_performance_score: canSeeIndividual.hasAccess
          ? aiInsight?.ai_performance_score || null
          : null,
        on_vacation: context?.on_vacation || false,
        on_sick_leave: context?.on_sick_leave || false,
        weekly_capacity_hours: context?.weekly_capacity_hours || null,
      };
    });

    // On FREE tier, return only aggregated statistics
    if (subscription === "free") {
      const aggregated = {
        total_members: teamHealth.length,
        on_vacation: teamHealth.filter((m) => m.on_vacation).length,
        on_sick_leave: teamHealth.filter((m) => m.on_sick_leave).length,
        avg_stress:
          teamHealth.reduce((acc, m) => acc + (m.stress_score || 0), 0) /
            teamHealth.length || null,
        avg_mood:
          teamHealth.reduce((acc, m) => acc + (m.mood_score || 0), 0) /
            teamHealth.length || null,
        high_stress_count: teamHealth.filter(
          (m) => m.stress_score && m.stress_score >= 7
        ).length,
        low_mood_count: teamHealth.filter(
          (m) => m.mood_score && m.mood_score <= 4
        ).length,
      };
      return NextResponse.json({
        subscription_tier: subscription,
        aggregated,
        upgrade_required: "team",
        upgrade_message: "Upgrade na Team tier pro individuální údaje",
      });
    }

    return NextResponse.json({
      subscription_tier: subscription,
      team_health: teamHealth,
    });
  } catch (error) {
    console.error("Team health error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
