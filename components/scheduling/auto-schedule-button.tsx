"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AutoScheduleButtonProps = {
  projectId: string;
};

type SchedulingResult = {
  scheduledTasks: Array<{
    taskId: string;
    suggestedStartDate: string;
    suggestedDueDate: string;
    assignedTo: string;
    reason: string;
  }>;
  conflicts: Array<{
    taskId: string;
    issue: string;
  }>;
  workloadSummary: Array<{
    userId: string;
    totalHours: number;
    tasksCount: number;
  }>;
};

/**
 * Button to trigger auto-scheduling with preview/confirmation flow.
 * 1. Click → fetch preview
 * 2. Show modal with plan
 * 3. Accept → apply changes
 */
export function AutoScheduleButton({ projectId }: AutoScheduleButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewResult, setPreviewResult] = useState<SchedulingResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/auto-schedule?preview=true`,
        { method: "POST" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate schedule");
      }

      setPreviewResult(data.result);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const applySchedule = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/auto-schedule?apply=true`,
        { method: "POST" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply schedule");
      }

      setShowPreview(false);
      setPreviewResult(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={fetchPreview}
        disabled={isLoading}
        className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {isLoading ? "Loading..." : "🤖 Auto-Schedule"}
      </button>

      {error && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold">
              Auto-Schedule Preview
            </h2>

            {/* Scheduled Tasks */}
            {previewResult.scheduledTasks.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-gray-700">
                  Scheduled Tasks ({previewResult.scheduledTasks.length})
                </h3>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3">
                  {previewResult.scheduledTasks.map((task) => (
                    <div
                      key={task.taskId}
                      className="rounded-md bg-green-50 p-3 text-sm"
                    >
                      <div className="font-medium text-gray-900">
                        Task #{task.taskId.slice(0, 8)}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {new Date(task.suggestedStartDate).toLocaleDateString()}{" "}
                        → {new Date(task.suggestedDueDate).toLocaleDateString()}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {task.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conflicts */}
            {previewResult.conflicts.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-red-700">
                  Conflicts ({previewResult.conflicts.length})
                </h3>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3">
                  {previewResult.conflicts.map((conflict) => (
                    <div key={conflict.taskId} className="text-sm">
                      <span className="font-medium">
                        Task #{conflict.taskId.slice(0, 8)}:
                      </span>{" "}
                      {conflict.issue}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workload Summary */}
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                Workload Summary
              </h3>
              <div className="space-y-1 rounded-md border border-gray-200 p-3">
                {previewResult.workloadSummary.map((summary) => (
                  <div
                    key={summary.userId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700">
                      User {summary.userId.slice(0, 8)}
                    </span>
                    <span className="font-medium text-gray-900">
                      {summary.totalHours.toFixed(1)}h ({summary.tasksCount}{" "}
                      tasks)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewResult(null);
                }}
                disabled={isLoading}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={applySchedule}
                disabled={
                  isLoading || previewResult.scheduledTasks.length === 0
                }
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? "Applying..." : "Apply Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
