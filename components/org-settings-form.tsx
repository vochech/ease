"use client";

import { useState } from "react";
import type { OrgSettings, PartialOrgSettings } from "@/types/settings";

type Props = {
  orgSlug: string;
  initial: Partial<OrgSettings>;
  canEdit: boolean;
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function OrgSettingsForm({ orgSlug, initial, canEdit }: Props) {
  const [form, setForm] = useState<PartialOrgSettings>({
    timezone: initial.timezone ?? "Europe/Prague",
    work_days: initial.work_days ?? ["Mon","Tue","Wed","Thu","Fri"],
    default_work_hours_per_day: initial.default_work_hours_per_day ?? 8,
    ai_assistant_enabled: initial.ai_assistant_enabled ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<null | "ok" | "err">(null);

  const toggleDay = (day: string) => {
    setForm((f) => {
      const current = new Set(f.work_days ?? []);
      if (current.has(day)) current.delete(day);
      else current.add(day);
      return { ...f, work_days: Array.from(current) };
    });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setSaved(null);
    try {
      const res = await fetch(`/api/${orgSlug}/settings/org`, {
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
          <span className="text-sm font-medium text-gray-700">Timezone</span>
          <input
            type="text"
            value={form.timezone ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            disabled={!canEdit || saving}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Denní pracovní doba (h)</span>
          <input
            type="number"
            min={0}
            max={12}
            value={form.default_work_hours_per_day ?? 8}
            onChange={(e) => setForm((f) => ({ ...f, default_work_hours_per_day: Number(e.target.value) }))}
            disabled={!canEdit || saving}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </label>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">Pracovní dny</span>
        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((d) => {
            const active = (form.work_days ?? []).includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                disabled={!canEdit || saving}
                className={`rounded-full px-3 py-1 text-sm ${active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
                aria-pressed={active}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={!!form.ai_assistant_enabled}
          onChange={(e) => setForm((f) => ({ ...f, ai_assistant_enabled: e.target.checked }))}
          disabled={!canEdit || saving}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Povolit AI asistenta</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canEdit || saving}
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
