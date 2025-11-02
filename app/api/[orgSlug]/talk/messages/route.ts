import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkFeatureAccess } from "@/lib/visibility-server";
import { analyzeMessageTone, detectSentiment } from "@/lib/ai-mediator";

export async function GET(
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
      { error: "Talk not available in your plan" },
      { status: 403 }
    );
  }

  // Get query params
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("thread_id");
  const limit = parseInt(searchParams.get("limit") || "50");
  const before = searchParams.get("before"); // ISO timestamp for pagination

  if (!threadId) {
    return NextResponse.json(
      { error: "thread_id is required" },
      { status: 400 }
    );
  }

  // Verify thread access
  const { data: thread } = await supabase
    .from("talk_threads")
    .select(`
      id,
      space_id,
      talk_spaces!inner(
        org_id
      )
    `)
    .eq("id", threadId)
    .single();

  if (!thread || (thread.talk_spaces as unknown as { org_id: string }).org_id !== org.id) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Get messages
  let query = supabase
    .from("talk_messages")
    .select(`
      id,
      thread_id,
      sender_id,
      message,
      attachments,
      sentiment,
      tone_analysis,
      context_tags,
      ai_summary,
      suggested_actions,
      created_at,
      edited_at,
      is_deleted,
      profiles!sender_id(id, full_name, email, avatar_url)
    `)
    .eq("thread_id", threadId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error("[Talk Messages API] Query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get reactions for messages
  const messageIds = messages?.map((m) => m.id) || [];
  const { data: reactions } = await supabase
    .from("talk_reactions")
    .select("*")
    .in("message_id", messageIds);

  // Group reactions by message
  const reactionsMap = new Map<string, Array<{ user_id: string; reaction: string }>>();
  reactions?.forEach((r) => {
    if (!reactionsMap.has(r.message_id)) {
      reactionsMap.set(r.message_id, []);
    }
    reactionsMap.get(r.message_id)!.push({
      user_id: r.user_id,
      reaction: r.reaction,
    });
  });

  // Enrich messages with reactions
  const enrichedMessages = messages?.map((m) => ({
    ...m,
    reactions: reactionsMap.get(m.id) || [],
  }));

  // Mark as read
  await supabase
    .from("talk_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .eq("user_id", user.id);

  return NextResponse.json({ messages: enrichedMessages });
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
      { error: "Talk not available in your plan" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { thread_id, message, attachments, context_tags } = body;

  if (!thread_id || !message) {
    return NextResponse.json(
      { error: "thread_id and message are required" },
      { status: 400 }
    );
  }

  // Verify thread access
  const { data: thread } = await supabase
    .from("talk_threads")
    .select(`
      id,
      space_id,
      talk_spaces!inner(
        org_id
      )
    `)
    .eq("id", thread_id)
    .single();

  if (!thread || (thread.talk_spaces as unknown as { org_id: string }).org_id !== org.id) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // AI analysis (optional - can be async)
  let sentiment = null;
  let toneAnalysis = null;

  const hasAIInsights = await checkFeatureAccess(user.id, org.id, "talk_ai_insights");
  if (hasAIInsights) {
    try {
      // Run in parallel
      const [sentimentResult, toneResult] = await Promise.all([
        detectSentiment(message),
        analyzeMessageTone(message),
      ]);
      sentiment = sentimentResult.label;
      toneAnalysis = toneResult;
    } catch (error) {
      console.error("[Talk Messages API] AI analysis error:", error);
      // Continue without AI analysis
    }
  }

  // Create message
  const { data: newMessage, error } = await supabase
    .from("talk_messages")
    .insert({
      thread_id,
      sender_id: user.id,
      message,
      attachments: attachments || [],
      sentiment,
      tone_analysis: toneAnalysis,
      context_tags: context_tags || [],
    })
    .select(`
      id,
      thread_id,
      sender_id,
      message,
      attachments,
      sentiment,
      tone_analysis,
      context_tags,
      created_at,
      profiles!sender_id(id, full_name, email, avatar_url)
    `)
    .single();

  if (error) {
    console.error("[Talk Messages API] Create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add user as participant if not already
  await supabase
    .from("talk_participants")
    .upsert(
      {
        thread_id,
        user_id: user.id,
        last_read_at: new Date().toISOString(),
      },
      {
        onConflict: "thread_id,user_id",
      }
    );

  return NextResponse.json({ message: newMessage }, { status: 201 });
}
