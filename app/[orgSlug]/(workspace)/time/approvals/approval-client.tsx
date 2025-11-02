"use client";

import { useEffect, useState } from "react";
import { ApprovalInterface } from "@/components/time/approval-interface";

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

export function ApprovalClient({ orgSlug }: { orgSlug: string }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [orgSlug]);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/${orgSlug}/time/entries?status=submitted`
      );
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error("[ApprovalClient] Load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <ApprovalInterface
      orgSlug={orgSlug}
      entries={entries}
      onApproved={loadEntries}
    />
  );
}
