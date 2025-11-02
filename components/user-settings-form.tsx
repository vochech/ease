"use client";

import { useState } from "react";
import type { PartialUserSettings, UserSettings } from "@/types/settings";

type Props = {
  orgSlug: string;
  initial: Partial<UserSettings>;
};

export function UserSettingsForm({ orgSlug, initial }: Props) {
  const [form, setForm] = useState<PartialUserSettings>({
    theme: (initial.theme as any) ?? "system",
    language: initial.language ?? "cs",
    meeting_reminders: initial.meeting_reminders ?? true,
    focus_start: initial.focus_start ?? null,
    focus_end: initial.focus_end ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<null | "ok" | "err">(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(null);
    try {
      const res = await fetch(`/api/${orgSlug}/settings/user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setSaved("ok");
    } catch (e) {
      setSaved("err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Téma</span>
          <select
            value={form.theme ?? "system"}
            onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value as any }))}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          >
            <option value="system">Systémové</option>
            <option value="light">Světlé</option>
            <option value="dark">Tmavé</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Jazyk</span>
          <input
            type="text"
            value={form.language ?? "cs"}
            onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Začátek focus-time</span>
          <input
            type="time"
            value={(form.focus_start ?? "") as string}
            onChange={(e) => setForm((f) => ({ ...f, focus_start: e.target.value || null }))}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Konec focus-time</span>
          <input
            type="time"
            value={(form.focus_end ?? "") as string}
            onChange={(e) => setForm((f) => ({ ...f, focus_end: e.target.value || null }))}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </label>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={!!form.meeting_reminders}
          onChange={(e) => setForm((f) => ({ ...f, meeting_reminders: e.target.checked }))}
          disabled={saving}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Připomínky schůzek</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? "Ukládám…" : "Uložit nastavení"}
        </button>
        {saved === "ok" && <span className="text-sm text-green-600">Uloženo</span>}
        {saved === "err" && <span className="text-sm text-red-600">Chyba při ukládání</span>}
      </div>
    </form>
  );
}
