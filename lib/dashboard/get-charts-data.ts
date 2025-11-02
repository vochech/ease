import { supabaseServer } from "@/lib/supabaseServer";

export type TasksByPriority = {
  urgent: number;
  high: number;
  medium: number;
  low: number;
};

export type WorkloadByUser = {
  userId: string;
  userEmail: string;
  activeTasks: number;
  completedTasks: number;
};

export type CompletionTimeline = {
  date: string;
  completed: number;
  created: number;
};

export async function getTasksByPriority(
  orgId: string,
  userRole: "owner" | "manager" | "member",
  userId: string,
): Promise<TasksByPriority> {
  const supabase = await supabaseServer();

  let tasksQuery = supabase
    .from("tasks")
    .select("priority, projects!inner(org_id, id)")
    .eq("projects.org_id", orgId)
    .eq("completed", false);

  if (userRole === "owner") {
    // Owners: no additional filter
  } else if (userRole === "manager") {
    // Filter by project_members
    const { data: projectMemberships } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId)
      .eq("role", "manager");

    if (projectMemberships && projectMemberships.length > 0) {
      const projectIds = projectMemberships.map((pm) => pm.project_id);
      tasksQuery = tasksQuery.in("projects.id", projectIds);
    }
  } else {
    // Members: filter by project_members
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
      tasksQuery = tasksQuery.eq("assigned_to", userId);
    }
  }

  const { data: tasks } = await tasksQuery;

  const counts: TasksByPriority = { urgent: 0, high: 0, medium: 0, low: 0 };

  tasks?.forEach((task: any) => {
    counts[task.priority as keyof TasksByPriority]++;
  });

  return counts;
}

export async function getWorkloadByUser(
  orgId: string,
  userRole: "owner" | "manager" | "member",
  userId: string,
): Promise<WorkloadByUser[]> {
  const supabase = await supabaseServer();

  // Members don't see workload distribution (only their own tasks)
  if (userRole === "member") {
    return [];
  }

  let tasksQuery = supabase
    .from("tasks")
    .select("assigned_to, completed, projects!inner(org_id, id)")
    .eq("projects.org_id", orgId)
    .not("assigned_to", "is", null);

  // Managers see only tasks from their projects
  if (userRole === "manager") {
    const { data: projectMemberships } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId)
      .eq("role", "manager");

    if (projectMemberships && projectMemberships.length > 0) {
      const projectIds = projectMemberships.map((pm) => pm.project_id);
      tasksQuery = tasksQuery.in("projects.id", projectIds);
    }
  }

  const { data: tasks } = await tasksQuery;

  const { data: orgMembers } = await supabase
    .from("org_members")
    .select("user_id, users(email)")
    .eq("org_id", orgId);

  const userMap = new Map<
    string,
    { email: string; active: number; completed: number }
  >();

  orgMembers?.forEach((m: any) => {
    userMap.set(m.user_id, {
      email: m.users?.email || "Unknown",
      active: 0,
      completed: 0,
    });
  });

  tasks?.forEach((task: any) => {
    const user = userMap.get(task.assigned_to);
    if (user) {
      if (task.completed) {
        user.completed++;
      } else {
        user.active++;
      }
    }
  });

  return Array.from(userMap.entries())
    .map(([userId, data]) => ({
      userId,
      userEmail: data.email,
      activeTasks: data.active,
      completedTasks: data.completed,
    }))
    .filter((u) => u.activeTasks + u.completedTasks > 0)
    .sort(
      (a, b) =>
        b.activeTasks + b.completedTasks - (a.activeTasks + a.completedTasks),
    );
}

export async function getCompletionTimeline(
  orgId: string,
  userRole: "owner" | "manager" | "member",
  userId: string,
): Promise<CompletionTimeline[]> {
  const supabase = await supabaseServer();

  // Get tasks from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let tasksQuery = supabase
    .from("tasks")
    .select("created_at, updated_at, completed, projects!inner(org_id, id)")
    .eq("projects.org_id", orgId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (userRole === "owner") {
    // Owners: no additional filter
  } else if (userRole === "manager") {
    const { data: projectMemberships } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId)
      .eq("role", "manager");

    if (projectMemberships && projectMemberships.length > 0) {
      const projectIds = projectMemberships.map((pm) => pm.project_id);
      tasksQuery = tasksQuery.in("projects.id", projectIds);
    }
  } else {
    // Members: filter by project_members
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
      tasksQuery = tasksQuery.eq("assigned_to", userId);
    }
  }

  const { data: tasks } = await tasksQuery;

  const dateMap = new Map<string, { created: number; completed: number }>();

  tasks?.forEach((task: any) => {
    const createdDate = new Date(task.created_at).toISOString().split("T")[0];
    if (!dateMap.has(createdDate)) {
      dateMap.set(createdDate, { created: 0, completed: 0 });
    }
    dateMap.get(createdDate)!.created++;

    if (task.completed) {
      const completedDate = new Date(task.updated_at)
        .toISOString()
        .split("T")[0];
      if (!dateMap.has(completedDate)) {
        dateMap.set(completedDate, { created: 0, completed: 0 });
      }
      dateMap.get(completedDate)!.completed++;
    }
  });

  return Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
