"use client";

import { useState, useMemo } from "react";
import { Search, X, Filter } from "lucide-react";
import type { Task } from "@/types/tasks";

type TasksSearchFilterProps = {
  tasks: Task[];
  orgMembers: { user_id: string; users?: { email?: string } }[];
  onFilteredTasksChangeAction: (filtered: Task[]) => void;
};

export function TasksSearchFilter({
  tasks,
  orgMembers,
  onFilteredTasksChangeAction,
}: TasksSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Search query (title, description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query),
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    // Assignee filter
    if (assigneeFilter !== "all") {
      filtered = filtered.filter((task) => task.assigned_to === assigneeFilter);
    }

    // Status filter
    if (statusFilter === "completed") {
      filtered = filtered.filter((task) => task.completed);
    } else if (statusFilter === "active") {
      filtered = filtered.filter((task) => !task.completed);
    } else if (statusFilter === "overdue") {
      const now = new Date();
      filtered = filtered.filter(
        (task) =>
          !task.completed && task.due_date && new Date(task.due_date) < now,
      );
    }

    // Date range filter
    if (dateRangeStart) {
      const startDate = new Date(dateRangeStart);
      filtered = filtered.filter(
        (task) => task.due_date && new Date(task.due_date) >= startDate,
      );
    }
    if (dateRangeEnd) {
      const endDate = new Date(dateRangeEnd);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (task) => task.due_date && new Date(task.due_date) <= endDate,
      );
    }

    return filtered;
  }, [
    tasks,
    searchQuery,
    priorityFilter,
    assigneeFilter,
    statusFilter,
    dateRangeStart,
    dateRangeEnd,
  ]);

  // Update parent whenever filtered tasks change
  useMemo(() => {
    onFilteredTasksChangeAction(filteredTasks);
  }, [filteredTasks, onFilteredTasksChangeAction]);

  const activeFiltersCount = [
    priorityFilter !== "all",
    assigneeFilter !== "all",
    statusFilter !== "all",
    dateRangeStart !== "",
    dateRangeEnd !== "",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
    setAssigneeFilter("all");
    setStatusFilter("all");
    setDateRangeStart("");
    setDateRangeEnd("");
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title or description..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition ${
            showAdvanced || activeFiltersCount > 0
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Priority filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Assignee filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Assigned to
              </label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="unassigned">Unassigned</option>
                {orgMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.users?.email?.split("@")[0] || "Unknown"}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Quick date filters */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Quick filters
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    setDateRangeStart(today);
                    setDateRangeEnd(today);
                  }}
                  className="flex-1 rounded border border-gray-300 bg-white px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const weekEnd = new Date(today);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    setDateRangeStart(today.toISOString().split("T")[0]);
                    setDateRangeEnd(weekEnd.toISOString().split("T")[0]);
                  }}
                  className="flex-1 rounded border border-gray-300 bg-white px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  This Week
                </button>
              </div>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Due date from
              </label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Due date to
              </label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Clear filters */}
          {(activeFiltersCount > 0 || searchQuery) && (
            <div className="flex items-center justify-between border-t border-blue-200 pt-3">
              <p className="text-xs text-gray-600">
                Showing{" "}
                <span className="font-semibold">{filteredTasks.length}</span> of{" "}
                <span className="font-semibold">{tasks.length}</span> tasks
              </p>
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results count (when not showing advanced) */}
      {!showAdvanced && (activeFiltersCount > 0 || searchQuery) && (
        <p className="text-xs text-gray-600">
          Showing <span className="font-semibold">{filteredTasks.length}</span>{" "}
          of <span className="font-semibold">{tasks.length}</span> tasks
        </p>
      )}
    </div>
  );
}
