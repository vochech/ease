"use client";

import { useEffect, useState } from "react";

type AgendaItem = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  duration_minutes: number | null;
  item_order: number;
  completed: boolean;
};

type Props = {
  orgSlug: string;
  meetingId: string;
  userId: string;
  userRole: "owner" | "manager" | "member";
};

export function MeetingAgendaPanel({
  orgSlug,
  meetingId,
  userId,
  userRole,
}: Props) {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const canEdit = userRole === "owner" || userRole === "manager";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/${orgSlug}/meetings/${meetingId}/agenda`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) setItems(data.items || []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [orgSlug, meetingId]);

  const toggleCompleted = async (item: AgendaItem) => {
    const canToggle = canEdit || item.assigned_to === userId;
    if (!canToggle) return;

    const res = await fetch(
      `/api/${orgSlug}/meetings/${meetingId}/agenda/${item.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !item.completed }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => prev.map((i) => (i.id === item.id ? data.item : i)));
    }
  };

  return (
    <div className="flex h-full flex-col p-3">
      <h3 className="mb-2 text-sm font-medium">Agenda</h3>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {loading ? (
          <div className="text-xs text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-xs text-gray-500">No agenda</div>
        ) : (
          items.map((item, idx) => {
            const canToggle = canEdit || item.assigned_to === userId;
            return (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded border border-gray-200 bg-white p-2 text-xs"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleCompleted(item)}
                  disabled={!canToggle}
                  className="mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 disabled:opacity-50"
                />
                <div className="flex-1">
                  <div
                    className={`font-medium ${item.completed ? "text-gray-500 line-through" : "text-gray-900"}`}
                  >
                    {idx + 1}. {item.title}
                  </div>
                  {item.duration_minutes && (
                    <div className="text-gray-500">
                      ⏱ {item.duration_minutes}m
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
