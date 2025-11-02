"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreatePersonalTaskForm } from "./create-personal-task-form";
import type { Task } from "@/types/tasks";

type TaskItemProps = {
  task: Task;
  personalSubtasks?: Task[];
  canManage: boolean;
};

export function TaskItem({
  task,
  personalSubtasks = [],
  canManage,
}: TaskItemProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleComplete = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const priorityColors = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };

  return (
    <div className="border-b border-gray-200 p-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={toggleComplete}
          disabled={isUpdating}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}
              >
                {task.title}
              </h4>
              {task.description && (
                <p className="mt-1 text-sm text-gray-600">{task.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}
              >
                {task.priority}
              </span>
              {task.completed && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Done
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {task.start_date && (
              <span>
                Start: {new Date(task.start_date).toLocaleDateString()}
              </span>
            )}
            {task.due_date && (
              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
            )}
            {task.estimated_hours && (
              <span>{task.estimated_hours}h estimated</span>
            )}
          </div>

          {!task.completed && task.progress !== undefined && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-700">
                  {task.progress}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {task.task_type === "manager" && (
            <div className="mt-3">
              {personalSubtasks.length > 0 && (
                <div className="mb-2 space-y-1">
                  <p className="text-xs font-medium text-gray-700">
                    Your Subtasks:
                  </p>
                  {personalSubtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 rounded bg-gray-50 px-2 py-1 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={async () => {
                          const response = await fetch(
                            `/api/tasks/${subtask.id}`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                completed: !subtask.completed,
                              }),
                            },
                          );
                          if (response.ok) router.refresh();
                        }}
                        className="h-3 w-3 rounded border-gray-300 text-blue-600"
                      />
                      <span
                        className={
                          subtask.completed ? "line-through text-gray-500" : ""
                        }
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <CreatePersonalTaskForm
                parentTaskId={task.id}
                parentTaskTitle={task.title}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
