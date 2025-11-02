import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
  }

  // Fetch organization membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("role, department, manager_id, permissions")
    .eq("user_id", user.id)
    .eq("org_id", org.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Fetch extended user profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Calculate current workload
  const { data: workloadData } = await supabase.rpc("get_user_workload", {
    p_user_id: user.id,
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    full_name: profile?.full_name || user.email?.split("@")[0],
    display_name: profile?.display_name,
    avatar_url: profile?.profile_photo_url,
    bio: profile?.bio,
    phone_number: profile?.phone_number,

    // Organizational data
    role: membership.role,
    department: profile?.department || membership.department,
    team: profile?.team,
    manager_id: membership.manager_id,
    office_location: profile?.office_location,
    timezone: profile?.timezone,

    // Role and experience
    role_level: profile?.role_level,
    position_title: profile?.position_title,
    specialization: profile?.specialization,
    years_of_experience: profile?.years_of_experience,

    // Employment
    start_date: profile?.start_date,
    contract_type: profile?.contract_type,
    employment_status: profile?.employment_status,

    // Work preferences
    shift_pattern: profile?.shift_pattern,
    working_hours_per_week: profile?.working_hours_per_week,
    preferred_work_style: profile?.preferred_work_style,

    // Capacity
    current_capacity_percentage: profile?.current_capacity_percentage,
    is_available_for_tasks: profile?.is_available_for_tasks,

    // Skills
    skills: profile?.skills || [],
    certifications: profile?.certifications || [],
    languages: profile?.languages || [],

    // Workload
    workload: workloadData?.[0] || {
      total_tasks: 0,
      high_priority_tasks: 0,
      overdue_tasks: 0,
      workload_score: 0,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params;
    const body = await req.json();
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
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Check membership
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", org.id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const profileData = {
      user_id: user.id,
      full_name: body.full_name,
      display_name: body.display_name,
      profile_photo_url: body.profile_photo_url,
      bio: body.bio,
      phone_number: body.phone_number,
      department: body.department,
      team: body.team,
      office_location: body.office_location,
      timezone: body.timezone,
      role_level: body.role_level,
      position_title: body.position_title,
      specialization: body.specialization,
      years_of_experience: body.years_of_experience,
      start_date: body.start_date,
      contract_type: body.contract_type,
      shift_pattern: body.shift_pattern,
      working_hours_per_week: body.working_hours_per_week,
      preferred_work_style: body.preferred_work_style,
      current_capacity_percentage: body.current_capacity_percentage,
      is_available_for_tasks: body.is_available_for_tasks,
      skills: body.skills,
      certifications: body.certifications,
      languages: body.languages,
      updated_by: user.id,
    };

    if (existingProfile) {
      const { data, error } = await supabase
        .from("user_profiles")
        .update(profileData)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Update department in org_members
      if (body.department) {
        await supabase
          .from("org_members")
          .update({ department: body.department })
          .eq("org_id", org.id)
          .eq("user_id", user.id);
      }

      return NextResponse.json({ profile: data });
    } else {
      const { data, error } = await supabase
        .from("user_profiles")
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;

      // Update department in org_members
      if (body.department) {
        await supabase
          .from("org_members")
          .update({ department: body.department })
          .eq("org_id", org.id)
          .eq("user_id", user.id);
      }

      return NextResponse.json({ profile: data });
    }
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
