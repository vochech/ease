import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

export async function GET() {
  try {
    const supabase = await supabaseServer();

    // Test 1: Check if we can query organizations table
    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id, slug, name, created_at");

    // Test 2: Check specifically for 'acme'
    const { data: acme, error: acmeError } = await supabase
      .from("organizations")
      .select("id, slug, name")
      .eq("slug", "acme")
      .single();

    // Test 3: Check auth status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        bypassAuth: process.env.BYPASS_AUTH,
        supabaseUrl:
          process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
      },
      user: user ? { id: user.id, email: user.email } : null,
      allOrganizations: {
        data: orgs,
        error: orgsError?.message,
        count: orgs?.length ?? 0,
      },
      acmeOrganization: {
        data: acme,
        error: acmeError?.message,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
