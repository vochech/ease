"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/components/providers/org-provider";

interface TimeEntry {
  id: string;
  started_at: string;
  description: string;
  project?: { id: string; name: string; slug: string };
  task?: { id: string; title: string };
}

export function TimerWidget() {
  const { orgSlug } = useOrg();
  const [timer, setTimer] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchActiveTimer = async () => {
    try {
      const res = await fetch(`/api/${orgSlug}/time/active`);
      const data = await res.json();
      setTimer(data.active_timer);
    } catch (error) {
      console.error("[TimerWidget] Fetch error:", error);
    }
  };

  // Fetch active timer on mount
  useEffect(() => {
    fetchActiveTimer();
  }, [orgSlug]);

  // Update elapsed time every second
  useEffect(() => {
    if (!timer) return;

    const interval = setInterval(() => {
      const start = new Date(timer.started_at).getTime();
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleStart = async () => {
    try {
      const res = await fetch(`/api/${orgSlug}/time/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Working...",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTimer(data.timer);
      } else {
        alert(data.error || "Failed to start timer");
      }
    } catch (error) {
      console.error("[TimerWidget] Start error:", error);
    }
  };

  const handleStop = async () => {
    if (!timer) return;

    try {
      const res = await fetch(`/api/${orgSlug}/time/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: timer.id }),
      });
      if (res.ok) {
        setTimer(null);
        setElapsed(0);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to stop timer");
      }
    } catch (error) {
      console.error("[TimerWidget] Stop error:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!timer && !isExpanded) {
    // Minimized: just a button to start
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleStart}
          className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
          title="Start timer"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Start Timer
        </button>
      </div>
    );
  }

  // Timer running: show widget
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="min-w-[280px] rounded-lg border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </div>
            <span className="text-xs font-semibold text-gray-700">Timer Running</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Elapsed time */}
          <div className="mb-3 text-center">
            <div className="text-3xl font-mono font-bold text-gray-900">
              {formatTime(elapsed)}
            </div>
          </div>

          {/* Description/Context */}
          {isExpanded && (
            <div className="mb-3 space-y-2 text-sm">
              {timer?.description && (
                <div className="text-gray-700">{timer.description}</div>
              )}
              {timer?.project && (
                <div className="flex items-center gap-1 text-gray-500">
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
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <span>{timer.project.name}</span>
                </div>
              )}
              {timer?.task && (
                <div className="flex items-center gap-1 text-gray-500">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span>{timer.task.title}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleStop}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Stop
            </button>
            {isExpanded && (
              <button
                onClick={() => {
                  // TODO: Open edit modal
                  alert("Edit timer coming soon");
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
