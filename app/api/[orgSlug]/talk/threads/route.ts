import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkFeatureAccess } from "@/lib/visibility";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await context.params;
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
  const hasAccess = await checkFeatureAccess(user.id, org.id, "talk_threads");
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Talk threads not available in your plan" },
      { status: 403 }
    );
  }

  // Get query params
  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("space_id");
  const includeResolved = searchParams.get("include_resolved") === "true";

  let query = supabase
    .from("talk_threads")
    .select(`
      id,
      space_id,
      title,
      context_summary,
      created_by,
      created_at,
      last_message_at,
      is_resolved,
      participant_count,
      talk_spaces!inner(id, org_id, title, space_type)
    `)
    .eq("talk_spaces.org_id", org.id)
    .order("last_message_at", { ascending: false });

  if (spaceId) {
    query = query.eq("space_id", spaceId);
  }

  if (!includeResolved) {
    query = query.eq("is_resolved", false);
  }

  const { data: threads, error } = await query;

  if (error) {
    console.error("[Talk Threads API] Query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get unread counts for user
  const threadsWithUnread = await Promise.all(
    (threads || []).map(async (thread) => {
      const { data } = await supabase.rpc("get_unread_count", {
        p_user_id: user.id,
        p_thread_id: thread.id,
      });
      return {
        ...thread,
        unread_count: data || 0,
      };
    })
  );

  return NextResponse.json({ threads: threadsWithUnread });
}

export async function POST(
  req: NextRequest,
  routeContext: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await routeContext.params;
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
  const hasAccess = await checkFeatureAccess(user.id, org.id, "talk_threads");
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Talk threads not available in your plan" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { space_id, title, context_summary, context: threadContext } = body;

  if (!space_id || !title) {
    return NextResponse.json(
      { error: "space_id and title are required" },
      { status: 400 }
    );
  }

  // Verify space belongs to org
  const { data: space } = await supabase
    .from("talk_spaces")
    .select("id")
    .eq("id", space_id)
    .eq("org_id", org.id)
    .single();

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  // Create thread
  const { data: thread, error } = await supabase
    .from("talk_threads")
    .insert({
      space_id,
      title,
      context_summary: context_summary || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("[Talk Threads API] Create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add creator as participant
  await supabase.from("talk_participants").insert({
    thread_id: thread.id,
    user_id: user.id,
  });

  // Add context if provided
  if (threadContext && Array.isArray(threadContext)) {
    const contextInserts = threadContext.map((ctx: { type: string; id: string; metadata?: unknown }) => ({
      thread_id: thread.id,
      context_type: ctx.type,
      context_id: ctx.id,
      context_metadata: ctx.metadata || {},
    }));

    await supabase.from("talk_thread_context").insert(contextInserts);
  }

  return NextResponse.json({ thread }, { status: 201 });
}
