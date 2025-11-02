import { supabaseServer } from "./supabaseServer";
import type { OrgSettings, UserSettings, PartialOrgSettings, PartialUserSettings } from "@/types/settings";

export async function getOrgSettingsBySlug(orgSlug: string): Promise<{ settings: Partial<OrgSettings>; exists: boolean }>
{
  const supabase = await supabaseServer();
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) return { settings: {}, exists: false };

  const { data: settings } = await supabase
    .from("org_settings")
    .select("*")
    .eq("org_id", org.id)
    .maybeSingle();

  if (!settings) {
    return {
      exists: false,
      settings: {
        org_id: org.id,
        timezone: "Europe/Prague",
        work_days: ["Mon","Tue","Wed","Thu","Fri"],
        default_work_hours_per_day: 8,
        notifications: {},
        meeting_policy: {},
        ai_assistant_enabled: true,
      } as Partial<OrgSettings>,
    };
  }

  return { exists: true, settings };
}

export async function updateOrgSettings(orgId: string, patch: PartialOrgSettings): Promise<OrgSettings | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("org_settings")
    .upsert({ org_id: orgId, ...patch }, { onConflict: "org_id" })
    .select()
    .single();
  if (error) {
    console.error("updateOrgSettings error:", error);
    return null;
  }
  return data as OrgSettings;
}

export async function getUserSettings(orgId: string, userId: string): Promise<{ settings: Partial<UserSettings>; exists: boolean }>
{
  const supabase = await supabaseServer();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!settings) {
    return {
      exists: false,
      settings: {
        user_id: userId,
        org_id: orgId,
        theme: "system",
        language: "cs",
        notifications: {},
        focus_start: null,
        focus_end: null,
        meeting_reminders: true,
      } as Partial<UserSettings>,
    };
  }

  return { exists: true, settings };
}

export async function updateUserSettings(orgId: string, userId: string, patch: PartialUserSettings): Promise<UserSettings | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ org_id: orgId, user_id: userId, ...patch }, { onConflict: "user_id,org_id" })
    .select()
    .single();
  if (error) {
    console.error("updateUserSettings error:", error);
    return null;
  }
  return data as UserSettings;
}
