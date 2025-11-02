import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/roles";
import type { PartialOrgSettings } from "@/types/settings";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Any member can read org settings (enforced by RLS as well)
    const { data: settings } = await supabase
      .from("org_settings")
      .select("*")
      .eq("org_id", org.id)
      .maybeSingle();

    const defaults = {
      org_id: org.id,
      timezone: "Europe/Prague",
      work_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      default_work_hours_per_day: 8,
      notifications: {},
      meeting_policy: {},
      ai_assistant_enabled: true,
    } as const;

    return NextResponse.json({ exists: !!settings, settings: settings ?? defaults });
  } catch (error) {
    console.error("Org settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
    const supabase = await supabaseServer();
    const payload = (await req.json()) as PartialOrgSettings;

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Authorization: only managers/owners can update
    await requireRole(org.id, ["owner", "manager"]);

    // Whitelist fields
    const update: Record<string, unknown> = {};
    if (payload.timezone) update.timezone = payload.timezone;
    if (payload.work_days) update.work_days = payload.work_days;
    if (typeof payload.default_work_hours_per_day === "number")
      update.default_work_hours_per_day = payload.default_work_hours_per_day;
    if (payload.notifications) update.notifications = payload.notifications;
    if (payload.meeting_policy) update.meeting_policy = payload.meeting_policy;
    if (typeof payload.ai_assistant_enabled === "boolean")
      update.ai_assistant_enabled = payload.ai_assistant_enabled;

    const { data: upserted, error: upsertError } = await supabase
      .from("org_settings")
      .upsert({ org_id: org.id, ...update }, { onConflict: "org_id" })
      .select()
      .single();

    if (upsertError) {
      console.error("Org settings update error:", upsertError);
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: upserted });
  } catch (error) {
    console.error("Org settings PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
