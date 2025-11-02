import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch user's behavioral profile
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

    const { data: profile, error: profileError } = await supabase
      .from("behavioral_profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("org_id", org.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Behavioral profile fetch error:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch behavioral profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    console.error("Behavioral profile error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST/PUT: Upsert user's behavioral profile
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

    const { data: profile, error: profileError } = await supabase
      .from("behavioral_profiles")
      .upsert(
        {
          user_id: user.id,
          org_id: org.id,
          personality_type: body.personality_type || null,
          big_five: body.big_five || null,
          dominance: body.dominance || null,
          motivators: body.motivators || null,
          work_tempo: body.work_tempo || null,
          emotional_stability: body.emotional_stability || null,
          communication_style: body.communication_style || null,
          feedback_openness: body.feedback_openness || null,
          collaboration_score: body.collaboration_score || null,
          autonomy_level: body.autonomy_level || null,
        },
        { onConflict: "user_id,org_id" }
      )
      .select()
      .single();

    if (profileError) {
      console.error("Behavioral profile upsert error:", profileError);
      return NextResponse.json(
        { error: "Failed to save behavioral profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Behavioral profile save error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
