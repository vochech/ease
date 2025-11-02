import { supabaseServer } from "@/lib/supabaseServer";
import { UserSettingsForm } from "@/components/user-settings-form";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function PersonalSettingsPage({ params }: Props) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">Pro zobrazení nastavění se prosím přihlas.</p>
      </main>
    );
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600">Organizace nebyla nalezena.</p>
      </main>
    );
  }

  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Osobní nastavení</h1>
        <p className="text-sm text-gray-600">Nastav si vzhled a notifikace podle sebe.</p>
      </div>

      <UserSettingsForm orgSlug={orgSlug} initial={settings ?? { user_id: user.id, org_id: org.id }} />
    </main>
  );
}
