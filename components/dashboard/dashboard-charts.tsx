"use client";

import type {
  TasksByPriority,
  WorkloadByUser,
  CompletionTimeline,
} from "@/lib/dashboard/get-charts-data";

type DashboardChartsProps = {
  tasksByPriority: TasksByPriority;
  workloadByUser: WorkloadByUser[];
  completionTimeline: CompletionTimeline[];
  userRole: "owner" | "manager" | "member";
};

export function DashboardCharts({
  tasksByPriority,
  workloadByUser,
  completionTimeline,
  userRole,
}: DashboardChartsProps) {
  // Priority chart data
  const priorityData = [
    { label: "Urgent", value: tasksByPriority.urgent, color: "bg-red-500" },
    { label: "High", value: tasksByPriority.high, color: "bg-orange-500" },
    { label: "Medium", value: tasksByPriority.medium, color: "bg-blue-500" },
    { label: "Low", value: tasksByPriority.low, color: "bg-gray-400" },
  ];
  const priorityTotal = priorityData.reduce((sum, d) => sum + d.value, 0);

  // Workload chart - max value for scaling
  const maxWorkload = Math.max(
    ...workloadByUser.map((u) => u.activeTasks + u.completedTasks),
    1,
  );

  // Timeline chart - max value for scaling
  const maxTimelineValue = Math.max(
    ...completionTimeline.flatMap((d) => [d.created, d.completed]),
    1,
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Tasks by Priority (Pie Chart) */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          {userRole === "member"
            ? "My Tasks by Priority"
            : "Active Tasks by Priority"}
        </h3>
        {priorityTotal > 0 ? (
          <div className="space-y-3">
            {priorityData.map((item, idx) => {
              const percentage =
                priorityTotal > 0 ? (item.value / priorityTotal) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {item.label}
                    </span>
                    <span className="text-gray-600">
                      {item.value} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">
            No active tasks
          </p>
        )}
      </div>

      {/* Workload Distribution (Bar Chart) - Only for managers/owners */}
      {userRole !== "member" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-gray-900">
            Workload Distribution
          </h3>
          {workloadByUser.length > 0 ? (
            <div className="space-y-3">
              {workloadByUser.slice(0, 6).map((user, idx) => {
                const total = user.activeTasks + user.completedTasks;
                const activePercent = (user.activeTasks / maxWorkload) * 100;
                const completedPercent =
                  (user.completedTasks / maxWorkload) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium text-gray-700">
                        {user.userEmail.split("@")[0]}
                      </span>
                      <span className="text-gray-600">
                        {total} tasks ({user.activeTasks} active)
                      </span>
                    </div>
                    <div className="flex h-6 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="bg-blue-500 transition-all duration-500"
                        style={{ width: `${activePercent}%` }}
                        title={`${user.activeTasks} active`}
                      />
                      <div
                        className="bg-green-500 transition-all duration-500"
                        style={{ width: `${completedPercent}%` }}
                        title={`${user.completedTasks} completed`}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm bg-blue-500" />
                  Active
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm bg-green-500" />
                  Completed
                </div>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              No workload data
            </p>
          )}
        </div>
      )}

      {/* Completion Timeline (Line Chart) */}
      <div
        className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${userRole === "member" ? "lg:col-span-2" : "lg:col-span-2"}`}
      >
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          {userRole === "member"
            ? "My Activity (Last 30 Days)"
            : "Task Activity (Last 30 Days)"}
        </h3>
        {completionTimeline.length > 0 ? (
          <div className="space-y-3">
            <div className="relative h-48">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
                <span>{maxTimelineValue}</span>
                <span>{Math.floor(maxTimelineValue / 2)}</span>
                <span>0</span>
              </div>

              {/* Chart area */}
              <div className="ml-8 h-full border-b border-l border-gray-200">
                <div className="flex h-full items-end justify-around gap-1 px-2">
                  {completionTimeline.map((data, idx) => {
                    const createdHeight =
                      (data.created / maxTimelineValue) * 100;
                    const completedHeight =
                      (data.completed / maxTimelineValue) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex h-full flex-col justify-end gap-1"
                      >
                        <div
                          className="w-2 rounded-t bg-blue-400 transition-all duration-500"
                          style={{ height: `${createdHeight}%` }}
                          title={`${data.date}: ${data.created} created`}
                        />
                        <div
                          className="w-2 rounded-t bg-green-500 transition-all duration-500"
                          style={{ height: `${completedHeight}%` }}
                          title={`${data.date}: ${data.completed} completed`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-axis labels (show every 5th date) */}
            <div className="ml-8 flex justify-around text-xs text-gray-500">
              {completionTimeline.map((data, idx) =>
                idx % 5 === 0 ? (
                  <span key={idx}>
                    {new Date(data.date).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                ) : null,
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-blue-400" />
                Created
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-green-500" />
                Completed
              </div>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">
            No activity in the last 30 days
          </p>
        )}
      </div>
    </div>
  );
}
