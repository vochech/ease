import { supabaseServer } from "@/lib/supabaseServer";
import { OrgSettingsForm } from "@/components/org-settings-form";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function OrgSettingsPage({ params }: Props) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">Pro zobrazení organizace se prosím přihlas.</p>
      </main>
    );
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">Organizace nebyla nalezena.</p>
      </main>
    );
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  const canEdit = membership?.role === "owner" || membership?.role === "manager";

  const { data: settings } = await supabase
    .from("org_settings")
    .select("*")
    .eq("org_id", org.id)
    .maybeSingle();

  const initial = settings ?? {
    org_id: org.id,
    timezone: "Europe/Prague",
    work_days: ["Mon","Tue","Wed","Thu","Fri"],
    default_work_hours_per_day: 8,
    notifications: {},
    meeting_policy: {},
    ai_assistant_enabled: true,
  };

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nastavení organizace</h1>
        <p className="text-sm text-gray-600">Správa pracovních dnů, časové zóny a AI asistenta.</p>
      </div>

      <OrgSettingsForm orgSlug={orgSlug} initial={initial as any} canEdit={canEdit} />
    </main>
  );
}
