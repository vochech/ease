import Link from "next/link";
import type { UrgentItem } from "@/lib/notifications/get-urgent-items";

type NotificationsWidgetProps = {
  urgentItems: UrgentItem[];
  orgSlug: string;
};

/**
 * Dashboard widget showing urgent notifications:
 * - Overdue tasks
 * - Tasks due today
 * - Tasks due this week
 * - Deadline warnings
 *
 * Grouped by priority with color coding and quick actions.
 */
export function NotificationsWidget({
  urgentItems,
  orgSlug,
}: NotificationsWidgetProps) {
  const criticalItems = urgentItems.filter(
    (item) => item.priority === "critical",
  );
  const highItems = urgentItems.filter((item) => item.priority === "high");
  const mediumItems = urgentItems.filter((item) => item.priority === "medium");

  const getTypeIcon = (type: UrgentItem["type"]) => {
    switch (type) {
      case "overdue":
        return (
          <svg
            className="h-4 w-4 text-red-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "today":
        return (
          <svg
            className="h-4 w-4 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "this_week":
        return (
          <svg
            className="h-4 w-4 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case "deadline_warning":
        return (
          <svg
            className="h-4 w-4 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
    }
  };

  const getPriorityBadge = (task: UrgentItem["task"]) => {
    const colors = {
      urgent: "bg-red-100 text-red-700",
      high: "bg-orange-100 text-orange-700",
      medium: "bg-blue-100 text-blue-700",
      low: "bg-gray-100 text-gray-700",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[task.priority]}`}
      >
        {task.priority}
      </span>
    );
  };

  if (urgentItems.length === 0) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-gray-50">
            <svg
              className="h-5 w-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
        </div>
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-12 text-sm">
          <div className="text-center">
            <div className="mb-3 flex justify-center">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-900">All caught up!</p>
            <p className="mt-2 text-sm font-medium text-gray-600">
              No urgent items at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-gray-50">
            <svg
              className="h-5 w-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
        </div>
        <span className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
          {urgentItems.length} urgent
        </span>
      </div>

      <div className="space-y-4">
        {/* Critical items */}
        {criticalItems.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-red-600">
              Critical ({criticalItems.length})
            </h3>
            <div className="space-y-3">
              {criticalItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.task.title}
                        </h4>
                        {getPriorityBadge(item.task)}
                      </div>
                      {item.project && (
                        <p className="mt-1 text-xs text-gray-600">
                          Project: {item.project.name}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-medium text-red-700">
                        {item.message}
                      </p>
                    </div>
                    {item.project && (
                      <Link
                        href={`/${orgSlug}/projects/${item.project.id}`}
                        className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High priority items */}
        {highItems.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-orange-600">
              High Priority ({highItems.length})
            </h3>
            <div className="space-y-3">
              {highItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.task.title}
                        </h4>
                        {getPriorityBadge(item.task)}
                      </div>
                      {item.project && (
                        <p className="mt-1 text-xs text-gray-600">
                          Project: {item.project.name}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-medium text-orange-700">
                        {item.message}
                      </p>
                    </div>
                    {item.project && (
                      <Link
                        href={`/${orgSlug}/projects/${item.project.id}`}
                        className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medium priority items */}
        {mediumItems.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-600">
              Attention Needed ({mediumItems.length})
            </h3>
            <div className="space-y-3">
              {mediumItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.task.title}
                        </h4>
                        {getPriorityBadge(item.task)}
                      </div>
                      {item.project && (
                        <p className="mt-1 text-xs text-gray-600">
                          Project: {item.project.name}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-medium text-blue-700">
                        {item.message}
                      </p>
                    </div>
                    {item.project && (
                      <Link
                        href={`/${orgSlug}/projects/${item.project.id}`}
                        className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
