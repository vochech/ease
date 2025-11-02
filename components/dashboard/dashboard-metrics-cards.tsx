import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Users,
  FolderKanban,
  UserX,
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/dashboard/get-metrics";

type DashboardMetricsCardsProps = {
  metrics: DashboardMetrics;
  userRole: "owner" | "manager" | "member";
  variant?: "full" | "compact"; // compact: show only top essentials
};

export function DashboardMetricsCards({
  metrics,
  userRole,
  variant = "full",
}: DashboardMetricsCardsProps) {
  // Manager/Owner cards - focus on team management
  const managerCards = [
    {
      label: "Active Projects",
      value: metrics.totalProjects || 0,
      icon: FolderKanban,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Unassigned Tasks",
      value: metrics.unassignedTasks || 0,
      icon: UserX,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      subtitle:
        metrics.unassignedTasks! > 0 ? "Need assignment" : "All assigned",
    },
    {
      label: "Completion Rate",
      value: `${metrics.completionRate}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      subtitle: `${metrics.completedTasks} / ${metrics.totalTasks} completed`,
    },
    {
      label: "Overdue Tasks",
      value: metrics.overdueTasks,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      subtitle: metrics.overdueTasks > 0 ? "Needs attention" : "All on track",
    },
    {
      label: "Due This Week",
      value: metrics.tasksDueThisWeek,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Avg. Completion Time",
      value:
        metrics.averageCompletionTime !== null
          ? `${metrics.averageCompletionTime}d`
          : "N/A",
      icon: Users,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      subtitle: "days per task",
    },
  ];

  // Member cards - focus on personal productivity
  const memberCards = [
    {
      label: "My Active Tasks",
      value: metrics.activeTasks,
      icon: CheckCircle2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "My Completion Rate",
      value: `${metrics.completionRate}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      subtitle: `${metrics.completedTasks} / ${metrics.totalTasks} completed`,
    },
    {
      label: "My Overdue",
      value: metrics.overdueTasks,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      subtitle: metrics.overdueTasks > 0 ? "Needs attention" : "All caught up!",
    },
    {
      label: "Due Today",
      value: metrics.myTasksDueToday || 0,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      subtitle: "Focus on these",
    },
    {
      label: "Due This Week",
      value: metrics.tasksDueThisWeek,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "My Avg. Time",
      value:
        metrics.averageCompletionTime !== null
          ? `${metrics.averageCompletionTime}d`
          : "N/A",
      icon: Users,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      subtitle: "days per task",
    },
  ];

  let cards = userRole === "member" ? memberCards : managerCards;

  if (variant === "compact") {
    // Show only the most essential cards for daily overview
    cards =
      userRole === "member"
        ? [memberCards[3], memberCards[2], memberCards[4]] // Due Today (focus), My Overdue, Due This Week
        : [managerCards[1], managerCards[3], managerCards[4]]; // Unassigned Tasks, Overdue Tasks, Due This Week
  }

  return (
    <div
      className={`grid grid-cols-1 gap-6 ${variant === "compact" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"}`}
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="mt-2 text-xs font-medium text-gray-600">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <div
                className={`rounded-lg ${card.bgColor} p-3 transition-transform duration-300 group-hover:scale-110`}
              >
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
