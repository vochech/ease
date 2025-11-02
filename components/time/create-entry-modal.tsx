"use client";

import { useState, useEffect } from "react";
import { useOrg } from "@/components/providers/org-provider";

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface Task {
  id: string;
  title: string;
}

interface CreateEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultProjectId?: string;
  defaultTaskId?: string;
}

export function CreateEntryModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
  defaultTaskId,
}: CreateEntryModalProps) {
  const { orgSlug } = useOrg();
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [taskId, setTaskId] = useState(defaultTaskId || "");
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [billable, setBillable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load projects (simplified - you may want to fetch from API)
  const [projects] = useState<Project[]>([]);
  const [tasks] = useState<Task[]>([]);

  useEffect(() => {
    if (defaultProjectId) setProjectId(defaultProjectId);
  }, [defaultProjectId]);

  useEffect(() => {
    if (defaultTaskId) setTaskId(defaultTaskId);
  }, [defaultTaskId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const startedAt = new Date(`${date}T${startTime}:00Z`).toISOString();
      const endedAt = new Date(`${date}T${endTime}:00Z`).toISOString();

      const res = await fetch(`/api/${orgSlug}/time/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          project_id: projectId || null,
          task_id: taskId || null,
          started_at: startedAt,
          ended_at: endedAt,
          billable,
        }),
      });

      if (res.ok) {
        onSuccess?.();
        onClose();
        // Reset form
        setDescription("");
        setProjectId("");
        setTaskId("");
        setBillable(true);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create entry");
      }
    } catch (error) {
      console.error("[CreateEntryModal] Submit error:", error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = () => {
    if (!date || !startTime || !endTime) return 0;
    const start = new Date(`${date}T${startTime}:00`).getTime();
    const end = new Date(`${date}T${endTime}:00`).getTime();
    const minutes = Math.max(0, Math.round((end - start) / 1000 / 60));
    return minutes;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Time Entry</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What did you work on?"
              required
            />
          </div>

          {/* Project */}
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
              Project (optional)
            </label>
            <select
              id="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Task */}
          {projectId && (
            <div>
              <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">
                Task (optional)
              </label>
              <select
                id="task"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select task...</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Duration Display */}
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <span className="font-medium text-gray-700">Duration:</span>{" "}
            <span className="text-gray-900">{formatDuration(calculateDuration())}</span>
          </div>

          {/* Billable Toggle */}
          <div className="flex items-center gap-2">
            <input
              id="billable"
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="billable" className="text-sm font-medium text-gray-700">
              Billable
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
