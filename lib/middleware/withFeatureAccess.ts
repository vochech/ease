import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireFeatureAccess } from "@/lib/visibility-server";

/**
 * Higher-order route handler to enforce feature access before executing the handler.
 * Usage:
 *   export const GET = withFeatureAccess("team_daily_status_individual")(async (req, ctx) => { ... })
 */
export const withFeatureAccess =
  (featureKey: string) =>
  <P extends { params: Promise<Record<string, string>> }>(
    handler: (req: NextRequest, ctx: P) => Promise<Response> | Response,
  ) =>
  async (req: NextRequest, ctx: P) => {
    // Resolve params (Next 16 passes params as a Promise)
    const params = await ctx.params;
    const orgSlug = params.orgSlug;

    if (!orgSlug) {
      return new Response(JSON.stringify({ error: "Missing orgSlug param" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .single();

    if (!org) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await requireFeatureAccess(user.id, org.id, featureKey);

    return handler(req, ctx);
  };
