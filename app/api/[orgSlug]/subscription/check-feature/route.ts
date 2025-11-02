import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { checkFeatureAccess } from "@/lib/visibility";

// GET: Check if user has access to a specific feature
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
    const { searchParams } = new URL(req.url);
    const featureKey = searchParams.get("feature");

    if (!featureKey) {
      return NextResponse.json(
        { error: "Missing feature parameter" },
        { status: 400 }
      );
    }

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

    const access = await checkFeatureAccess(user.id, org.id, featureKey);

    return NextResponse.json(access);
  } catch (error) {
    console.error("Feature check error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
