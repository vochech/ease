"use client";

import { useState } from "react";
import { CreateManagerTaskForm } from "./create-manager-task-form";
import { TaskItem } from "./task-item";
import { TasksSearchFilter } from "./tasks-search-filter";
import type { Task } from "@/types/tasks";

type TasksListProps = {
  projectId: string;
  managerTasks: Task[];
  personalTasks: Task[];
  orgMembers: { user_id: string; users?: { email?: string } }[];
  canManage: boolean;
};

export function TasksList({
  projectId,
  managerTasks,
  personalTasks,
  orgMembers,
  canManage,
}: TasksListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(managerTasks);

  // Group personal tasks by parent
  const personalByParent = personalTasks.reduce(
    (acc, task) => {
      if (task.parent_task_id) {
        if (!acc[task.parent_task_id]) {
          acc[task.parent_task_id] = [];
        }
        acc[task.parent_task_id].push(task);
      }
      return acc;
    },
    {} as Record<string, Task[]>,
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Tasks</h2>
        {canManage && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {showCreateForm ? "Cancel" : "+ New Task"}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold">Create Manager Task</h3>
          <CreateManagerTaskForm
            projectId={projectId}
            orgMembers={orgMembers}
            onCancelAction={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Search and filter */}
      {managerTasks.length > 0 && (
        <TasksSearchFilter
          tasks={managerTasks}
          orgMembers={orgMembers}
          onFilteredTasksChangeAction={setFilteredTasks}
        />
      )}

      {managerTasks.length > 0 ? (
        filteredTasks.length > 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white">
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                personalSubtasks={personalByParent[task.id] || []}
                canManage={canManage}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-600">
              No tasks match your filters.
            </p>
          </div>
        )
      ) : (
        <p className="text-sm text-gray-500">
          No tasks yet. {canManage && "Create one to get started!"}
        </p>
      )}
    </section>
  );
}
