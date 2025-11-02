import { supabaseServer } from "@/lib/supabaseServer";

export type DashboardMetrics = {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksDueToday: number;
  tasksDueThisWeek: number;
  averageCompletionTime: number | null;
  unassignedTasks?: number; // For managers/owners
  totalProjects?: number; // For managers/owners
  myTasksDueToday?: number; // For members
};

export async function getDashboardMetrics(
  orgId: string,
  userRole: "owner" | "manager" | "member",
  userId: string,
): Promise<DashboardMetrics> {
  const supabase = await supabaseServer();

  // Fetch tasks based on role and project_members
  let tasksQuery = supabase
    .from("tasks")
    .select("*, projects!inner(org_id, id)")
    .eq("projects.org_id", orgId);

  if (userRole === "owner") {
    // Owners see all tasks in the organization
    // no additional filter
  } else if (userRole === "manager") {
    // Managers see:
    // 1) Manager tasks from projects where they are assigned as manager in project_members
    // 2) All manager tasks if no project_members exist (backward compatibility)

    // Get projects where user is a project manager
    const { data: projectMemberships } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId)
      .eq("role", "manager");

    if (projectMemberships && projectMemberships.length > 0) {
      const projectIds = projectMemberships.map((pm) => pm.project_id);
      tasksQuery = tasksQuery.in("projects.id", projectIds);
    } else {
      // No project memberships - see all tasks in org (backward compatibility)
      // no additional filter
    }
  } else {
    // Members see only tasks from projects they're assigned to
    const { data: projectMemberships } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId);

    if (projectMemberships && projectMemberships.length > 0) {
      const projectIds = projectMemberships.map((pm) => pm.project_id);
      tasksQuery = tasksQuery
        .eq("assigned_to", userId)
        .in("projects.id", projectIds);
    } else {
      // No project memberships - see only assigned tasks from any project
      tasksQuery = tasksQuery.eq("assigned_to", userId);
    }
  }

  const { data: tasks } = await tasksQuery;

  if (!tasks || tasks.length === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      activeTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      tasksDueToday: 0,
      tasksDueThisWeek: 0,
      averageCompletionTime: null,
    };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.completed).length;
  const activeTasks = totalTasks - completedTasks;

  const overdueTasks = tasks.filter(
    (t: any) => !t.completed && t.due_date && new Date(t.due_date) < now,
  ).length;

  const tasksDueToday = tasks.filter(
    (t: any) =>
      !t.completed &&
      t.due_date &&
      new Date(t.due_date) >= todayStart &&
      new Date(t.due_date) < todayEnd,
  ).length;

  const tasksDueThisWeek = tasks.filter(
    (t: any) =>
      !t.completed &&
      t.due_date &&
      new Date(t.due_date) >= todayStart &&
      new Date(t.due_date) < weekEnd,
  ).length;

  // Calculate average completion time (completed tasks with created_at and completed_at)
  const completedTasksWithDates = tasks.filter(
    (t: any) => t.completed && t.created_at && t.updated_at,
  );

  let averageCompletionTime: number | null = null;
  if (completedTasksWithDates.length > 0) {
    const totalDays = completedTasksWithDates.reduce((sum: number, t: any) => {
      const created = new Date(t.created_at).getTime();
      const completed = new Date(t.updated_at).getTime();
      const days = (completed - created) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    averageCompletionTime = Math.round(
      totalDays / completedTasksWithDates.length,
    );
  }

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const baseMetrics: DashboardMetrics = {
    totalTasks,
    completedTasks,
    activeTasks,
    overdueTasks,
    completionRate,
    tasksDueToday,
    tasksDueThisWeek,
    averageCompletionTime,
  };

  // Add role-specific metrics
  if (userRole === "owner" || userRole === "manager") {
    // Unassigned tasks (needs attention)
    const unassignedTasks =
      tasks?.filter((t: any) => !t.completed && !t.assigned_to).length || 0;

    // Total projects count (filtered by role)
    let projectsCountQuery = supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    if (userRole === "manager") {
      // Managers see only projects they're assigned to
      const { data: projectMemberships } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", userId)
        .eq("role", "manager");

      if (projectMemberships && projectMemberships.length > 0) {
        const projectIds = projectMemberships.map((pm) => pm.project_id);
        projectsCountQuery = projectsCountQuery.in("id", projectIds);
      }
    }

    const { count: projectsCount } = await projectsCountQuery;

    return {
      ...baseMetrics,
      unassignedTasks,
      totalProjects: projectsCount || 0,
    };
  }

  // Member-specific: tasks due today (personal focus)
  return {
    ...baseMetrics,
    myTasksDueToday: tasksDueToday,
  };
}
