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

type OrgMember = {
  user_id: string;
  role: string;
  users?: { email?: string };
};

type Props = {
  orgSlug: string;
  meetingId: string;
  userId: string;
  userRole: "owner" | "manager" | "member";
  orgMembers: OrgMember[];
};

export function MeetingAgenda({
  orgSlug,
  meetingId,
  userId,
  userRole,
  orgMembers,
}: Props) {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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

  const deleteItem = async (id: string) => {
    if (!canEdit) return;
    const res = await fetch(
      `/api/${orgSlug}/meetings/${meetingId}/agenda/${id}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Agenda</h3>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
          >
            + Add item
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">No agenda items</div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const assignedMember = orgMembers.find(
              (m) => m.user_id === item.assigned_to,
            );
            const canToggle = canEdit || item.assigned_to === userId;
            return (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleCompleted(item)}
                  disabled={!canToggle}
                  className="mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 disabled:opacity-50"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div
                        className={`font-medium ${item.completed ? "text-gray-500 line-through" : "text-gray-900"}`}
                      >
                        {idx + 1}. {item.title}
                      </div>
                      {item.description && (
                        <div className="mt-1 text-xs text-gray-600">
                          {item.description}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        {assignedMember && (
                          <span>
                            👤 {assignedMember.users?.email || "Unknown"}
                          </span>
                        )}
                        {item.duration_minutes && (
                          <span>⏱ {item.duration_minutes}m</span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && canEdit && (
        <AddAgendaForm
          orgSlug={orgSlug}
          meetingId={meetingId}
          orgMembers={orgMembers}
          nextOrder={items.length}
          onAdd={(item) => {
            setItems((prev) => [...prev, item]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function AddAgendaForm({
  orgSlug,
  meetingId,
  orgMembers,
  nextOrder,
  onAdd,
  onCancel,
}: {
  orgSlug: string;
  meetingId: string;
  orgMembers: OrgMember[];
  nextOrder: number;
  onAdd: (item: AgendaItem) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/${orgSlug}/meetings/${meetingId}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          assigned_to: assignedTo || undefined,
          duration_minutes: duration ? parseInt(duration) : undefined,
          item_order: nextOrder,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onAdd(data.item);
      } else {
        alert("Failed to add item");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-gray-300 bg-gray-50 p-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Agenda item title"
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />
      <div className="flex gap-2">
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        >
          <option value="">Assign to (optional)</option>
          {orgMembers.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.users?.email || "Unknown"}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Minutes"
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting || !title.trim()}
          className="rounded border border-gray-900 bg-gray-900 px-3 py-1 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
