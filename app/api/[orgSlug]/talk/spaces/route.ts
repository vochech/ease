import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkFeatureAccess } from "@/lib/visibility-server";

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
  const hasAccess = await checkFeatureAccess(user.id, org.id, "talk_basic");
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Talk feature not available in your plan" },
      { status: 403 }
    );
  }

  // Get query params
  const { searchParams } = new URL(req.url);
  const spaceType = searchParams.get("space_type");
  const spaceRefId = searchParams.get("space_ref_id");

  let query = supabase
    .from("talk_spaces")
    .select(`
      id,
      space_type,
      space_ref_id,
      title,
      description,
      created_by,
      created_at,
      updated_at,
      is_archived
    `)
    .eq("org_id", org.id)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  if (spaceType) {
    query = query.eq("space_type", spaceType);
  }

  if (spaceRefId) {
    query = query.eq("space_ref_id", spaceRefId);
  }

  const { data: spaces, error } = await query;

  if (error) {
    console.error("[Talk Spaces API] Query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ spaces });
}

export async function POST(
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
  const hasAccess = await checkFeatureAccess(user.id, org.id, "talk_basic");
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Talk feature not available in your plan" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { space_type, space_ref_id, title, description } = body;

  if (!space_type || !title) {
    return NextResponse.json(
      { error: "space_type and title are required" },
      { status: 400 }
    );
  }

  // Create space
  const { data: space, error } = await supabase
    .from("talk_spaces")
    .insert({
      org_id: org.id,
      space_type,
      space_ref_id: space_ref_id || null,
      title,
      description: description || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("[Talk Spaces API] Create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ space }, { status: 201 });
}
