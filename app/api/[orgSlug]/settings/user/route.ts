import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import type { PartialUserSettings } from "@/types/settings";

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

    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("org_id", org.id)
      .maybeSingle();

    const defaults = {
      user_id: user.id,
      org_id: org.id,
      theme: "system",
      language: "cs",
      notifications: {},
      focus_start: null,
      focus_end: null,
      meeting_reminders: true,
    } as const;

    return NextResponse.json({ exists: !!settings, settings: settings ?? defaults });
  } catch (error) {
    console.error("User settings GET error:", error);
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
    const payload = (await req.json()) as PartialUserSettings;

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

    // Whitelist fields
    const update: Record<string, unknown> = {};
    if (payload.theme) update.theme = payload.theme;
    if (payload.language) update.language = payload.language;
    if (payload.notifications) update.notifications = payload.notifications;
    if (typeof payload.focus_start !== "undefined") update.focus_start = payload.focus_start;
    if (typeof payload.focus_end !== "undefined") update.focus_end = payload.focus_end;
    if (typeof payload.meeting_reminders === "boolean") update.meeting_reminders = payload.meeting_reminders;

    const { data: upserted, error: upsertError } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, org_id: org.id, ...update }, { onConflict: "user_id,org_id" })
      .select()
      .single();

    if (upsertError) {
      console.error("User settings update error:", upsertError);
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: upserted });
  } catch (error) {
    console.error("User settings PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
