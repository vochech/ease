import { supabaseServer } from "@/lib/supabaseServer";
import type { Task } from "@/types/tasks";

export type UrgentItem = {
  id: string;
  type: "overdue" | "today" | "this_week" | "deadline_warning";
  task: Task;
  project?: {
    id: string;
    name: string;
  };
  message: string;
  priority: "critical" | "high" | "medium";
};

/**
 * Fetch urgent items for current user in their organizations.
 * Returns tasks that need immediate attention:
 * - Overdue tasks (not completed, due_date < today)
 * - Tasks due today
 * - Tasks due this week
 * - Deadline warnings (less than 20% time remaining)
 */
export async function getUrgentItems(orgId?: string): Promise<UrgentItem[]> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  // Build query
  let query = supabase
    .from("tasks")
    .select("*, projects(id, name, org_id)")
    .eq("completed", false)
    .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });

  // Filter by org if specified
  if (orgId) {
    query = query.eq("projects.org_id", orgId);
  }

  const { data: tasks } = await query;

  if (!tasks) {
    return [];
  }

  const urgentItems: UrgentItem[] = [];

  for (const task of tasks) {
    const dueDate = new Date(task.due_date!);
    const startDate = task.start_date ? new Date(task.start_date) : null;

    // Extract project info
    const project =
      Array.isArray(task.projects) && task.projects[0]
        ? { id: task.projects[0].id, name: task.projects[0].name }
        : undefined;

    // 1. Overdue tasks (critical)
    if (dueDate < today) {
      const daysOverdue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      urgentItems.push({
        id: task.id,
        type: "overdue",
        task,
        project,
        message: `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}`,
        priority: "critical",
      });
      continue;
    }

    // 2. Due today (critical)
    if (dueDate >= today && dueDate < endOfToday) {
      urgentItems.push({
        id: task.id,
        type: "today",
        task,
        project,
        message: "Due today",
        priority: "critical",
      });
      continue;
    }

    // 3. Due this week (high)
    if (dueDate >= endOfToday && dueDate < endOfWeek) {
      const daysUntil = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      urgentItems.push({
        id: task.id,
        type: "this_week",
        task,
        project,
        message: `Due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
        priority: "high",
      });
      continue;
    }

    // 4. Deadline warning - less than 20% time remaining (medium)
    if (startDate && dueDate > endOfWeek) {
      const totalDuration = dueDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const percentRemaining =
        ((totalDuration - elapsed) / totalDuration) * 100;

      if (percentRemaining > 0 && percentRemaining < 20 && task.progress < 80) {
        urgentItems.push({
          id: task.id,
          type: "deadline_warning",
          task,
          project,
          message: `Only ${Math.round(percentRemaining)}% time remaining, ${task.progress}% complete`,
          priority: "medium",
        });
      }
    }
  }

  // Sort by priority and due date
  urgentItems.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Same priority, sort by due date
    const aDue = new Date(a.task.due_date!).getTime();
    const bDue = new Date(b.task.due_date!).getTime();
    return aDue - bDue;
  });

  return urgentItems;
}
