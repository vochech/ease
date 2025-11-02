import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkFeatureAccess } from "@/lib/visibility-server";

export async function GET(
  req: NextRequest,
  routeContext: { params: Promise<{ orgSlug: string; threadId: string }> }
) {
  const { orgSlug, threadId } = await routeContext.params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get org
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Check feature access
  const hasAccess = await checkFeatureAccess(user.id, org.id, "talk_ai_insights");
  if (!hasAccess) {
    return NextResponse.json(
      { error: "AI insights not available in your plan" },
      { status: 403 }
    );
  }

  // Get thread summary using RPC
  const { data: summary, error } = await supabase.rpc("get_thread_summary", {
    p_thread_id: threadId,
    p_user_id: user.id,
  });

  if (error) {
    console.error("[Thread Summary API] Query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ summary });
}
