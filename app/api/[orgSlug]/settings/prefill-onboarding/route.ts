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

    // Check if user is manager/owner
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", org.id)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "manager"].includes(membership.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const {
      target_user_id,
      full_name,
      role_level,
      position_title,
      skills,
      years_of_experience,
      working_hours_per_week,
      current_capacity_percentage,
      is_available_for_tasks,
      employment_status,
    } = body;

    // Upsert user profile with prefill data
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: target_user_id,
          org_id: org.id,
          full_name,
          role_level,
          position_title,
          skills,
          years_of_experience,
          working_hours_per_week,
          current_capacity_percentage,
          is_available_for_tasks,
          employment_status,
          onboarding_prefilled_by: user.id,
          onboarding_prefilled_at: new Date().toISOString(),
        },
        { onConflict: "user_id,org_id" }
      )
      .select()
      .single();

    if (profileError) {
      console.error("Profile prefill error:", profileError);
      return NextResponse.json(
        { error: "Failed to prefill profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Prefill onboarding error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
