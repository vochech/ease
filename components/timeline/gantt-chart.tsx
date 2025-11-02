"use client";

import { useMemo, useState } from "react";
import { ZoomIn, ZoomOut, Filter, X } from "lucide-react";
import type { Task } from "@/types/tasks";

type OrgMember = {
  user_id: string;
  users?: { email?: string };
};

type GanttChartProps = {
  tasks: Task[];
  orgMembers: OrgMember[];
};

type ZoomLevel = "day" | "week" | "month";
type PriorityFilter = "all" | "urgent" | "high" | "medium" | "low";

/**
 * Timeline/Gantt chart visualization showing tasks distributed across team members.
 * Displays horizontal timeline with swimlanes per user and colored task blocks.
 * Supports zoom levels (day/week/month) and filters (priority, user, completed).
 */
export function GanttChart({ tasks, orgMembers }: GanttChartProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("day");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter only manager tasks with dates
  const timelineTasks = useMemo(() => {
    let filtered = tasks.filter(
      (task) =>
        task.task_type === "manager" &&
        task.start_date &&
        task.due_date &&
        task.assigned_to
    );

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    // Apply user filter
    if (userFilter !== "all") {
      filtered = filtered.filter((task) => task.assigned_to === userFilter);
    }

    // Hide completed
    if (hideCompleted) {
      filtered = filtered.filter((task) => !task.completed);
    }

    return filtered;
  }, [tasks, priorityFilter, userFilter, hideCompleted]);

  // Calculate date range (today to 30 days out, or span all tasks)
  const dateRange = useMemo(() => {
    if (timelineTasks.length === 0) {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + 30);
      return { start: now, end };
    }

    const dates = timelineTasks.flatMap((task) => [
      new Date(task.start_date!),
      new Date(task.due_date!),
    ]);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add padding
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 7);

    return { start: minDate, end: maxDate };
  }, [timelineTasks]);

  // Generate columns based on zoom level
  const columns = useMemo(() => {
    const cols: { date: Date; label: string; sublabel: string }[] = [];
    const current = new Date(dateRange.start);

    if (zoomLevel === "day") {
      while (current <= dateRange.end) {
        cols.push({
          date: new Date(current),
          label: current.toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "short",
          }),
          sublabel: current.toLocaleDateString("cs-CZ", { weekday: "short" }),
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (zoomLevel === "week") {
      while (current <= dateRange.end) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        cols.push({
          date: new Date(current),
          label: `${weekStart.toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "short",
          })}`,
          sublabel: `Week ${Math.ceil(weekStart.getDate() / 7)}`,
        });
        current.setDate(current.getDate() + 7);
      }
    } else {
      // month
      while (current <= dateRange.end) {
        cols.push({
          date: new Date(current),
          label: current.toLocaleDateString("cs-CZ", {
            month: "long",
            year: "numeric",
          }),
          sublabel: "",
        });
        current.setMonth(current.getMonth() + 1);
      }
    }

    return cols;
  }, [dateRange, zoomLevel]);

  // Group tasks by assigned user
  const tasksByUser = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    timelineTasks.forEach((task) => {
      const userId = task.assigned_to!;
      if (!grouped.has(userId)) {
        grouped.set(userId, []);
      }
      grouped.get(userId)!.push(task);
    });
    return grouped;
  }, [timelineTasks]);

  // Calculate task position and width
  const getTaskStyle = (task: Task) => {
    const startDate = new Date(task.start_date!);
    const dueDate = new Date(task.due_date!);
    const rangeStart = dateRange.start.getTime();
    const rangeEnd = dateRange.end.getTime();
    const rangeDuration = rangeEnd - rangeStart;

    const left = ((startDate.getTime() - rangeStart) / rangeDuration) * 100;
    const width =
      ((dueDate.getTime() - startDate.getTime()) / rangeDuration) * 100;

    return { left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` };
  };

  // Priority colors
  const priorityColors = {
    low: "bg-gray-400 hover:bg-gray-500",
    medium: "bg-blue-500 hover:bg-blue-600",
    high: "bg-orange-500 hover:bg-orange-600",
    urgent: "bg-red-600 hover:bg-red-700",
  };

  const today = useMemo(() => new Date(), []);
  const todayPosition = useMemo(() => {
    const rangeStart = dateRange.start.getTime();
    const rangeEnd = dateRange.end.getTime();
    const rangeDuration = rangeEnd - rangeStart;
    const todayTime = today.getTime();

    if (todayTime < rangeStart || todayTime > rangeEnd) return null;

    return ((todayTime - rangeStart) / rangeDuration) * 100;
  }, [dateRange, today]);

  const activeFiltersCount = [
    priorityFilter !== "all",
    userFilter !== "all",
    hideCompleted,
  ].filter(Boolean).length;

  if (timelineTasks.length === 0) {
    return (
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1">
              <button
                onClick={() => setZoomLevel("day")}
                className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                  zoomLevel === "day"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setZoomLevel("week")}
                className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                  zoomLevel === "week"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setZoomLevel("month")}
                className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                  zoomLevel === "month"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Month
              </button>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                showFilters || activeFiltersCount > 0
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 text-[10px] text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
            <div className="grid grid-cols-3 gap-4">
              {/* Priority filter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value as PriorityFilter)
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                >
                  <option value="all">All priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* User filter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Team Member
                </label>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                >
                  <option value="all">All members</option>
                  {orgMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.users?.email?.split("@")[0] || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hide completed */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Display
                </label>
                <label className="flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={hideCompleted}
                    onChange={(e) => setHideCompleted(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Hide completed
                </label>
              </div>
            </div>

            {/* Clear filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setPriorityFilter("all");
                  setUserFilter("all");
                  setHideCompleted(false);
                }}
                className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                <X className="h-3.5 w-3.5" />
                Clear all filters
              </button>
            )}
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600">
            {activeFiltersCount > 0
              ? "No tasks match the current filters."
              : "No tasks with timeline data yet. Create a manager task with start date and due date to see it on the timeline."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1">
            <button
              onClick={() => setZoomLevel("day")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                zoomLevel === "day"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setZoomLevel("week")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                zoomLevel === "week"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setZoomLevel("month")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                zoomLevel === "month"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Month
            </button>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              showFilters || activeFiltersCount > 0
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-blue-600 px-1.5 text-[10px] text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          {timelineTasks.length} task{timelineTasks.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-4">
            {/* Priority filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value as PriorityFilter)
                }
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
              >
                <option value="all">All priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* User filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Team Member
              </label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
              >
                <option value="all">All members</option>
                {orgMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.users?.email?.split("@")[0] || "Unknown"}
                  </option>
                ))}
              </select>
            </div>

            {/* Hide completed */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Display
              </label>
              <label className="flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={hideCompleted}
                  onChange={(e) => setHideCompleted(e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Hide completed
              </label>
            </div>
          </div>

          {/* Clear filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setPriorityFilter("all");
                setUserFilter("all");
                setHideCompleted(false);
              }}
              className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
            >
              <X className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {/* Timeline header with date columns */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
          <div className="flex">
            {/* User column header */}
            <div className="w-48 shrink-0 border-r border-gray-200 px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">
                Team Member
              </span>
            </div>

            {/* Date columns header */}
            <div className="relative flex flex-1">
              {columns.map((col, idx) => {
                const isToday =
                  col.date.toDateString() === today.toDateString();
                return (
                  <div
                    key={idx}
                    className={`flex-1 border-l border-gray-200 px-2 py-3 text-center first:border-l-0 ${
                      isToday ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-700">
                      {col.label}
                    </div>
                    {col.sublabel && (
                      <div className="text-xs text-gray-500">
                        {col.sublabel}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Swimlanes per user */}
        <div className="divide-y divide-gray-200">
          {orgMembers
            .filter((member) => tasksByUser.has(member.user_id))
            .map((member) => {
              const userTasks = tasksByUser.get(member.user_id) || [];
              return (
                <div key={member.user_id} className="flex">
                  {/* User name column */}
                  <div className="w-48 shrink-0 border-r border-gray-200 px-4 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {member.users?.email?.split("@")[0] || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userTasks.length} tasks
                    </p>
                  </div>

                  {/* Timeline row with tasks */}
                  <div className="relative flex-1">
                    {/* Columns background */}
                    <div className="absolute inset-0 flex">
                      {columns.map((col, idx) => {
                        const isToday =
                          col.date.toDateString() === today.toDateString();
                        return (
                          <div
                            key={idx}
                            className={`flex-1 border-l border-gray-100 first:border-l-0 ${
                              isToday ? "bg-blue-50/30" : ""
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Today marker line */}
                    {todayPosition !== null && (
                      <div
                        className="absolute top-0 bottom-0 z-10 w-0.5 bg-blue-500"
                        style={{ left: `${todayPosition}%` }}
                      />
                    )}

                    {/* Task blocks */}
                    <div className="relative min-h-[80px] py-2">
                      {userTasks.map((task, idx) => {
                        const style = getTaskStyle(task);
                        const isOverdue =
                          !task.completed && new Date(task.due_date!) < today;
                        return (
                          <div
                            key={task.id}
                            className="absolute h-8"
                            style={{
                              ...style,
                              top: `${idx * 36 + 8}px`,
                            }}
                          >
                            <div
                              className={`group relative h-full rounded px-2 py-1 text-xs font-medium text-white shadow transition-all ${
                                priorityColors[task.priority]
                              } ${
                                isOverdue
                                  ? "ring-2 ring-red-500 ring-offset-1"
                                  : ""
                              } ${
                                task.completed ? "opacity-50 line-through" : ""
                              }`}
                              title={`${task.title}\n${task.start_date} → ${task.due_date}\n${task.progress}% done`}
                            >
                              <div className="truncate">{task.title}</div>
                              {/* Progress indicator */}
                              {!task.completed && task.progress > 0 && (
                                <div
                                  className="absolute bottom-0 left-0 h-1 rounded-b bg-white/40"
                                  style={{ width: `${task.progress}%` }}
                                />
                              )}
                              {/* Overdue badge */}
                              {isOverdue && (
                                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold">
                                  !
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
