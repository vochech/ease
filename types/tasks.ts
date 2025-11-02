export type TaskType = "manager" | "personal";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  task_type: TaskType;
  parent_task_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  due_date: string | null;
  priority: TaskPriority;
  start_date: string | null;
  estimated_hours: number | null;
  progress: number;
  created_at: string;
  updated_at: string;
};

export type ManagerTask = Task & {
  task_type: "manager";
  parent_task_id: null;
};

export type PersonalTask = Task & {
  task_type: "personal";
  parent_task_id: string;
};

export type TaskWithSubtasks = ManagerTask & {
  subtasks?: PersonalTask[];
};
