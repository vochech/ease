"use client";

import { useState } from "react";

interface TimeEntry {
  id: string;
  description: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  billable: boolean;
  project?: { id: string; name: string };
  task?: { id: string; title: string };
  user: { id: string; full_name: string | null; email: string };
}

interface ApprovalInterfaceProps {
  orgSlug: string;
  entries: TimeEntry[];
  onApproved: () => void;
}

export function ApprovalInterface({
  orgSlug,
  entries,
  onApproved,
}: ApprovalInterfaceProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [rejectEntryId, setRejectEntryId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async (entryId: string) => {
    setSubmitting(entryId);
    try {
      const res = await fetch(
        `/api/${orgSlug}/time/entries/${entryId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (res.ok) {
        onApproved();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve");
      }
    } catch (error) {
      console.error("[ApprovalInterface] Approve error:", error);
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async () => {
    if (!rejectEntryId || !rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setSubmitting(rejectEntryId);
    try {
      const res = await fetch(
        `/api/${orgSlug}/time/entries/${rejectEntryId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );
      if (res.ok) {
        setRejectEntryId(null);
        setRejectReason("");
        onApproved();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reject");
      }
    } catch (error) {
      console.error("[ApprovalInterface] Reject error:", error);
    } finally {
      setSubmitting(null);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">No entries pending approval</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              {/* User */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {(entry.user.full_name || entry.user.email)[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {entry.user.full_name || entry.user.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(entry.started_at)} •{" "}
                    {formatDuration(entry.duration_minutes)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="text-sm text-gray-700">{entry.description}</div>

              {/* Project/Task */}
              {(entry.project || entry.task) && (
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {entry.project && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      {entry.project.name}
                    </span>
                  )}
                  {entry.task && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      {entry.task.title}
                    </span>
                  )}
                  {entry.billable && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 font-medium text-green-700">
                      Billable
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(entry.id)}
                disabled={submitting === entry.id}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {submitting === entry.id ? "..." : "Approve"}
              </button>
              <button
                onClick={() => setRejectEntryId(entry.id)}
                disabled={submitting === entry.id}
                className="rounded-lg border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Reject Modal */}
      {rejectEntryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Reject Time Entry
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={4}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectEntryId(null);
                  setRejectReason("");
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submitting === rejectEntryId}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {submitting === rejectEntryId ? "..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
