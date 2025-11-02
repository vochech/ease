"use client";

import { useState } from "react";
import type { Task, Meeting, OrgMember } from "./types";
import { CreateMeetingModal } from "./create-meeting-modal";
import { MeetingDetailModal } from "./meeting-detail-modal";

type CalendarViewProps = {
  tasks: Task[];
  meetings: Meeting[];
  orgSlug: string;
  userId: string;
  userRole: "owner" | "manager" | "member";
  canCreateMeetings: boolean;
  orgMembers: OrgMember[];
  projects: { id: string; name: string }[];
  onUpdateDueDateAction: (taskId: string, newDate: string) => Promise<void>;
};

type ViewMode = "month" | "week" | "list";

export function CalendarView({
  tasks,
  meetings,
  orgSlug,
  userId,
  userRole,
  canCreateMeetings,
  orgMembers,
  projects,
  onUpdateDueDateAction,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Modals */}
      {showCreateMeeting && (
        <CreateMeetingModal
          orgSlug={orgSlug}
          orgMembers={orgMembers}
          projects={projects}
          onCloseAction={() => setShowCreateMeeting(false)}
        />
      )}
      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          userId={userId}
          userRole={userRole}
          orgSlug={orgSlug}
          onCloseAction={() => setSelectedMeeting(null)}
        />
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevious}
            className="rounded border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="rounded border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
          >
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
          <h2 className="text-lg font-medium text-gray-900">
            {viewMode === "month"
              ? currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              : viewMode === "week"
                ? `Week of ${getWeekStart(currentDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    },
                  )}`
                : "All Tasks"}
          </h2>
        </div>

        <div className="flex gap-2">
          {canCreateMeetings && (
            <button
              onClick={() => setShowCreateMeeting(true)}
              className="rounded border border-gray-900 bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
            >
              + New Meeting
            </button>
          )}
          <button
            onClick={() => setViewMode("list")}
            className={`rounded border px-3 py-1.5 text-sm ${
              viewMode === "list"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`rounded border px-3 py-1.5 text-sm ${
              viewMode === "week"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`rounded border px-3 py-1.5 text-sm ${
              viewMode === "month"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar views */}
      {viewMode === "month" && (
        <MonthView
          currentDate={currentDate}
          tasks={tasks}
          meetings={meetings}
          orgSlug={orgSlug}
          draggedTask={draggedTask}
          onDragStart={setDraggedTask}
          onDrop={onUpdateDueDateAction}
          onMeetingClick={setSelectedMeeting}
        />
      )}
      {viewMode === "week" && (
        <WeekView
          currentDate={currentDate}
          tasks={tasks}
          meetings={meetings}
          orgSlug={orgSlug}
          draggedTask={draggedTask}
          onDragStart={setDraggedTask}
          onDrop={onUpdateDueDateAction}
          onMeetingClick={setSelectedMeeting}
        />
      )}
      {viewMode === "list" && (
        <ListView
          tasks={tasks}
          meetings={meetings}
          orgSlug={orgSlug}
          onMeetingClick={setSelectedMeeting}
        />
      )}
    </div>
  );
}

// Month grid view
function MonthView({
  currentDate,
  tasks,
  meetings,
  orgSlug,
  draggedTask,
  onDragStart,
  onDrop,
  onMeetingClick,
}: {
  currentDate: Date;
  tasks: Task[];
  meetings: Meeting[];
  orgSlug: string;
  draggedTask: string | null;
  onDragStart: (taskId: string | null) => void;
  onDrop: (taskId: string, newDate: string) => Promise<void>;
  onMeetingClick: (meeting: Meeting) => void;
}) {
  const daysInMonth = getDaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDrop = async (dateStr: string) => {
    if (draggedTask) {
      await onDrop(draggedTask, dateStr);
      onDragStart(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="border-r border-gray-200 p-2 text-center text-xs font-medium text-gray-600 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {daysInMonth.map((date, idx) => {
          const dateStr = date ? formatDateStr(date) : "";
          const dayTasks = date
            ? tasks.filter((t) => t.due_date?.startsWith(dateStr))
            : [];
          const dayMeetings = date
            ? meetings.filter((m) => {
                // Extract date from ISO string directly to avoid timezone conversion
                const meetingDateStr = m.start_time.split("T")[0];
                return meetingDateStr === dateStr;
              })
            : [];
          const isToday = date && date.getTime() === today.getTime();
          const isCurrentMonth =
            date && date.getMonth() === currentDate.getMonth();

          return (
            <div
              key={idx}
              className={`min-h-24 border-b border-r border-gray-200 p-2 last:border-r-0 ${
                !isCurrentMonth ? "bg-gray-50" : ""
              } ${draggedTask ? "cursor-move" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("bg-blue-50");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("bg-blue-50");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("bg-blue-50");
                if (date) handleDrop(dateStr);
              }}
            >
              {date && (
                <>
                  <div
                    className={`mb-1 text-sm ${
                      isToday
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 font-bold text-white"
                        : isCurrentMonth
                          ? "font-medium text-gray-900"
                          : "text-gray-400"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {/* Meetings first */}
                    {dayMeetings.slice(0, 2).map((meeting) => (
                      <button
                        key={meeting.id}
                        onClick={() => onMeetingClick(meeting)}
                        className="w-full truncate rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-left text-xs text-blue-700 hover:border-blue-300 hover:shadow-sm"
                        title={meeting.title}
                      >
                        <span className="mr-1">📅</span>
                        {new Date(meeting.start_time).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "numeric",
                            minute: "2-digit",
                          },
                        )}{" "}
                        {meeting.title}
                      </button>
                    ))}
                    {/* Then tasks */}
                    {dayTasks
                      .slice(0, 3 - Math.min(dayMeetings.length, 2))
                      .map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => onDragStart(task.id)}
                          onDragEnd={() => onDragStart(null)}
                          className="cursor-move truncate rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs hover:border-gray-300 hover:shadow-sm"
                          title={task.title}
                        >
                          <span
                            className={`mr-1 ${getPriorityColor(task.priority)}`}
                          >
                            ●
                          </span>
                          {task.title}
                        </div>
                      ))}
                    {dayTasks.length + dayMeetings.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayTasks.length + dayMeetings.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Week timeline view
function WeekView({
  currentDate,
  tasks,
  meetings,
  orgSlug,
  draggedTask,
  onDragStart,
  onDrop,
  onMeetingClick,
}: {
  currentDate: Date;
  tasks: Task[];
  meetings: Meeting[];
  orgSlug: string;
  draggedTask: string | null;
  onDragStart: (taskId: string | null) => void;
  onDrop: (taskId: string, newDate: string) => Promise<void>;
  onMeetingClick: (meeting: Meeting) => void;
}) {
  const weekDays = getWeekDays(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDrop = async (dateStr: string) => {
    if (draggedTask) {
      await onDrop(draggedTask, dateStr);
      onDragStart(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-7">
        {weekDays.map((date) => {
          const dateStr = formatDateStr(date);
          const dayTasks = tasks.filter((t) => t.due_date?.startsWith(dateStr));
          const dayMeetings = meetings.filter((m) => {
            const meetingDate = new Date(m.start_time);
            return formatDateStr(meetingDate) === dateStr;
          });
          const isToday = date.getTime() === today.getTime();

          return (
            <div
              key={dateStr}
              className="min-h-96 border-r border-gray-200 last:border-r-0"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("bg-blue-50");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("bg-blue-50");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("bg-blue-50");
                handleDrop(dateStr);
              }}
            >
              <div
                className={`border-b border-gray-200 p-3 ${isToday ? "bg-gray-900" : "bg-gray-50"}`}
              >
                <div
                  className={`text-xs font-medium ${isToday ? "text-white" : "text-gray-600"}`}
                >
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div
                  className={`text-lg font-semibold ${isToday ? "text-white" : "text-gray-900"}`}
                >
                  {date.getDate()}
                </div>
              </div>
              <div className="space-y-2 p-2">
                {/* Meetings */}
                {dayMeetings.map((meeting) => (
                  <button
                    key={meeting.id}
                    onClick={() => onMeetingClick(meeting)}
                    className="group block w-full rounded-lg border border-blue-200 bg-blue-50 p-2 text-left hover:border-blue-300 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-blue-600">📅</span>
                      <div className="flex-1 text-xs">
                        <div className="font-medium text-blue-900">
                          {meeting.title}
                        </div>
                        <div className="mt-1 text-blue-700">
                          {new Date(meeting.start_time).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}{" "}
                          -{" "}
                          {new Date(meeting.end_time).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {/* Tasks */}
                {dayTasks.map((task) => (
                  <a
                    key={task.id}
                    href={`/${orgSlug}/projects/${task.projects?.slug}/tasks/${task.id}`}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      onDragStart(task.id);
                    }}
                    onDragEnd={() => onDragStart(null)}
                    className="group block cursor-move rounded-lg border border-gray-200 bg-white p-2 hover:border-gray-300 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 ${getPriorityColor(task.priority)}`}
                      >
                        ●
                      </span>
                      <div className="flex-1 text-xs">
                        <div className="font-medium text-gray-900 group-hover:text-gray-600">
                          {task.title}
                        </div>
                        {task.assigned_user && (
                          <div className="mt-1 text-gray-500">
                            {task.assigned_user.full_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// List view (existing grouped list)
function ListView({
  tasks,
  meetings,
  orgSlug,
  onMeetingClick,
}: {
  tasks: Task[];
  meetings: Meeting[];
  orgSlug: string;
  onMeetingClick: (meeting: Meeting) => void;
}) {
  const grouped = groupTasksByDate(tasks);
  const groupedMeetings = groupMeetingsByDate(meetings);

  if (tasks.length === 0 && meetings.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-12 text-center shadow-sm">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          No tasks or meetings scheduled
        </p>
      </div>
    );
  }

  // Combine and sort all dates
  const allDates = Array.from(
    new Set([
      ...grouped.map((g) => g.date),
      ...groupedMeetings.map((g) => g.date),
    ]),
  ).sort();

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {allDates.map((date) => {
        const dateTasks = grouped.find((g) => g.date === date)?.tasks || [];
        const dateMeetings =
          groupedMeetings.find((g) => g.date === date)?.meetings || [];

        return (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">
              {formatDateHeader(date)}
            </h3>
            <div className="space-y-2">
              {/* Meetings */}
              {dateMeetings.map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => onMeetingClick(meeting)}
                  className="group block w-full rounded-lg border border-blue-200 bg-blue-50 p-3 text-left transition-all hover:border-blue-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <h4 className="font-medium text-blue-900">
                          {meeting.title}
                        </h4>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-blue-700">
                        <span>
                          {new Date(meeting.start_time).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}{" "}
                          -{" "}
                          {new Date(meeting.end_time).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                        {meeting.location && (
                          <>
                            <span>•</span>
                            <span>{meeting.location}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {meeting.meeting_participants?.length || 0}{" "}
                          participants
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {/* Tasks */}
              {dateTasks.map((task) => (
                <a
                  key={task.id}
                  href={`/${orgSlug}/projects/${task.projects?.slug}/tasks/${task.id}`}
                  className="group block rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 group-hover:text-gray-600">
                        {task.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span>{task.projects?.name}</span>
                        {task.assigned_user && (
                          <>
                            <span>•</span>
                            <span>{task.assigned_user.full_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(task.priority)}
                      {getStatusBadge(task.status)}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper functions
function getDaysInMonth(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days: (Date | null)[] = [];

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, prevMonthLastDay - i));
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Next month days to fill the grid (42 cells = 6 weeks)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

function getWeekStart(date: Date): Date {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatDateStr(date: Date): string {
  // Use local date components to avoid timezone shifts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) {
    return "Today";
  } else if (date.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
}

function groupTasksByDate(tasks: Task[]) {
  const grouped = new Map<string, Task[]>();

  tasks.forEach((task) => {
    if (task.due_date) {
      const date = task.due_date.split("T")[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(task);
    }
  });

  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, tasks]) => ({ date, tasks }));
}

function groupMeetingsByDate(meetings: Meeting[]) {
  const grouped = new Map<string, Meeting[]>();

  meetings.forEach((meeting) => {
    // Extract date directly from ISO string to avoid timezone issues
    const date = meeting.start_time.split("T")[0];
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(meeting);
  });

  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, meetings]) => ({
      date,
      meetings: meetings.sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      ),
    }));
}

function getPriorityColor(priority: string): string {
  const colors = {
    critical: "text-red-600",
    high: "text-orange-600",
    medium: "text-blue-600",
    low: "text-gray-400",
  };
  return colors[priority as keyof typeof colors] || colors.low;
}

function getPriorityBadge(priority: string) {
  const styles = {
    critical: "border-red-200 bg-red-50 text-red-700",
    high: "border-orange-200 bg-orange-50 text-orange-700",
    medium: "border-blue-200 bg-blue-50 text-blue-700",
    low: "border-gray-200 bg-gray-50 text-gray-700",
  };

  return (
    <span
      className={`rounded border px-2 py-0.5 text-xs font-medium ${styles[priority as keyof typeof styles] || styles.low}`}
    >
      {priority}
    </span>
  );
}

function getStatusBadge(status: string) {
  const styles = {
    todo: "border-gray-200 bg-gray-50 text-gray-700",
    in_progress: "border-blue-200 bg-blue-50 text-blue-700",
    review: "border-purple-200 bg-purple-50 text-purple-700",
    done: "border-green-200 bg-green-50 text-green-700",
  };

  const labels = {
    todo: "To Do",
    in_progress: "In Progress",
    review: "Review",
    done: "Done",
  };

  return (
    <span
      className={`rounded border px-2 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles] || styles.todo}`}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}
