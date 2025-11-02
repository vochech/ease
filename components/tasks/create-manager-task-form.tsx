"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskPriority } from "@/types/tasks";

type CreateManagerTaskFormProps = {
  projectId: string;
  orgMembers?: { user_id: string; users?: { email?: string } }[];
  onSuccessAction?: () => void;
  onCancelAction?: () => void;
};

export function CreateManagerTaskForm({
  projectId,
  orgMembers = [],
  onSuccessAction,
  onCancelAction,
}: CreateManagerTaskFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const assigned_to = formData.get("assigned_to") as string;
    const due_date = formData.get("due_date") as string;
    const start_date = formData.get("start_date") as string;
    const estimated_hours = formData.get("estimated_hours") as string;
    const priority = formData.get("priority") as TaskPriority;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_type: "manager",
          project_id: projectId,
          title,
          description: description || null,
          assigned_to: assigned_to || null,
          due_date: due_date || null,
          start_date: start_date || null,
          estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
          priority,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create task");
      }

      if (onSuccessAction) {
        onSuccessAction();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Task Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. Implement authentication"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Optional task description"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="assigned_to"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Assign To
          </label>
          <select
            id="assigned_to"
            name="assigned_to"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            {orgMembers.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.users?.email || member.user_id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="medium"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="start_date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date
          </label>
          <input
            type="datetime-local"
            id="start_date"
            name="start_date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="due_date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Due Date
          </label>
          <input
            type="datetime-local"
            id="due_date"
            name="due_date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="estimated_hours"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Estimated Hours
        </label>
        <input
          type="number"
          id="estimated_hours"
          name="estimated_hours"
          min="0"
          step="0.5"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. 8"
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancelAction && (
          <button
            type="button"
            onClick={onCancelAction}
            disabled={isSubmitting}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Task"}
        </button>
      </div>
    </form>
  );
}
