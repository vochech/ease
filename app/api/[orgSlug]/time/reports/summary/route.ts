import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { checkFeatureAccess } from "@/lib/visibility-server";

/**
 * Get time summary report
 * GET /api/[orgSlug]/time/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&user_id=X
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
    
    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to parameters are required" },
        { status: 400 }
      );
    }
    
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

    // Check team view access
    const teamAccess = await checkFeatureAccess(user.id, org.id, "time_entries_team_view");

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // If requesting specific user and not self, need team access
    if (userId && userId !== user.id && !teamAccess.hasAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get user summary
    if (userId || !teamAccess.hasAccess) {
      const targetUserId = userId || user.id;
      
      const { data: summary } = await supabase.rpc("get_user_hours", {
        p_user_id: targetUserId,
        p_from: fromDate.toISOString(),
        p_to: toDate.toISOString(),
      });

      return NextResponse.json({
        type: "individual",
        user_id: targetUserId,
        summary: summary?.[0] || {
          total_minutes: 0,
          total_hours: 0,
          billable_minutes: 0,
          billable_hours: 0,
          entry_count: 0,
        },
      });
    }

    // Get team summary (BUSINESS+)
    const { data: teamSummary } = await supabase.rpc("get_team_hours_summary", {
      p_org_id: org.id,
      p_from: fromDate.toISOString(),
      p_to: toDate.toISOString(),
    });

    // Calculate totals
    const totals = (teamSummary || []).reduce(
      (
        acc: { total_hours: number; billable_hours: number; entry_count: number },
        member: { total_hours: unknown; billable_hours: unknown; entry_count: unknown }
      ) => ({
        total_hours: acc.total_hours + (parseFloat(member.total_hours as string) || 0),
        billable_hours: acc.billable_hours + (parseFloat(member.billable_hours as string) || 0),
        entry_count: acc.entry_count + (parseInt(member.entry_count as string) || 0),
      }),
      { total_hours: 0, billable_hours: 0, entry_count: 0 }
    );

    return NextResponse.json({
      type: "team",
      totals,
      by_user: teamSummary || [],
    });
  } catch (error) {
    console.error("[time/reports/summary] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
