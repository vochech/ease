"use client";

import { useEffect, useState } from "react";
import { CreateEntryModal } from "@/components/time/create-entry-modal";

interface TimeEntry {
  id: string;
  description: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  billable: boolean;
  status: "draft" | "submitted" | "approved" | "rejected" | "invoiced";
  project?: { id: string; name: string; slug: string };
  task?: { id: string; title: string };
  user: { id: string; full_name: string | null; email: string };
}

interface Summary {
  total_hours: number;
  billable_hours: number;
  entry_count: number;
}

export function TimesheetClient({
  orgSlug,
  userRole,
}: {
  orgSlug: string;
  userRole: string;
}) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_hours: 0, billable_hours: 0, entry_count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return {
      from: weekAgo.toISOString().split("T")[0],
      to: now.toISOString().split("T")[0],
    };
  });

  const canViewTeam = ["manager", "owner"].includes(userRole);

  useEffect(() => {
    loadData();
  }, [orgSlug, dateRange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load entries
      const entriesRes = await fetch(
        `/api/${orgSlug}/time/entries?from=${dateRange.from}&to=${dateRange.to}`
      );
      const entriesData = await entriesRes.json();
      setEntries(entriesData.entries || []);

      // Load summary
      const summaryRes = await fetch(
        `/api/${orgSlug}/time/reports/summary?from=${dateRange.from}&to=${dateRange.to}`
      );
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary || { total_hours: 0, billable_hours: 0, entry_count: 0 });
    } catch (error) {
      console.error("[TimesheetClient] Load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-gray-100 text-gray-700",
      submitted: "bg-blue-100 text-blue-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      invoiced: "bg-purple-100 text-purple-700",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.draft
        }`}
      >
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Total Hours</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {summary.total_hours.toFixed(1)}h
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Billable Hours</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {summary.billable_hours.toFixed(1)}h
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Entries</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {summary.entry_count}
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">From:</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">To:</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Add Entry
        </button>
      </div>

      {/* Entries Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Project
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Duration
              </th>
              {canViewTeam && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={canViewTeam ? 6 : 5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No time entries found for this period.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {formatDate(entry.started_at)}
                    <div className="text-xs text-gray-500">
                      {formatTime(entry.started_at)} -{" "}
                      {entry.ended_at ? formatTime(entry.ended_at) : "ongoing"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {entry.description}
                    {entry.billable && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        Billable
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {entry.project ? (
                      <div>
                        <div>{entry.project.name}</div>
                        {entry.task && (
                          <div className="text-xs text-gray-500">{entry.task.title}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {formatDuration(entry.duration_minutes)}
                  </td>
                  {canViewTeam && (
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {entry.user.full_name || entry.user.email}
                    </td>
                  )}
                  <td className="px-4 py-3">{getStatusBadge(entry.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateEntryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
