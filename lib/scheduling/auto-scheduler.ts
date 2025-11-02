import type { Task } from "@/types/tasks";

type SchedulingResult = {
  scheduledTasks: Array<{
    taskId: string;
    suggestedStartDate: Date;
    suggestedDueDate: Date;
    assignedTo: string;
    reason: string;
  }>;
  conflicts: Array<{
    taskId: string;
    issue: string;
  }>;
  workloadSummary: Array<{
    userId: string;
    totalHours: number;
    tasksCount: number;
  }>;
};

type TeamMember = {
  user_id: string;
  users?: { email?: string };
};

const WORK_HOURS_PER_DAY = 6; // Conservative estimate for actual productive hours
const WORK_DAYS_PER_WEEK = 5;

/**
 * Auto-scheduling algorithm that distributes tasks among team members
 * based on workload, estimated hours, and project deadlines.
 *
 * Strategy:
 * 1. Sort tasks by priority (urgent first) and due date
 * 2. Calculate workload for each team member
 * 3. Assign tasks to least loaded member who is available
 * 4. Respect existing start_date/due_date if manually set
 * 5. Detect conflicts and overlaps
 */
export async function autoScheduleTasks(
  tasks: Task[],
  teamMembers: TeamMember[],
  projectDeadline?: Date,
): Promise<SchedulingResult> {
  const result: SchedulingResult = {
    scheduledTasks: [],
    conflicts: [],
    workloadSummary: [],
  };

  // Filter only manager tasks that need scheduling
  const tasksToSchedule = tasks.filter(
    (task) =>
      task.task_type === "manager" &&
      !task.completed &&
      task.estimated_hours &&
      task.estimated_hours > 0,
  );

  // Sort by priority (urgent > high > medium > low) and due date
  const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
  tasksToSchedule.sort((a, b) => {
    const priorityDiff =
      priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, sort by due date (earliest first)
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return a.due_date ? -1 : 1;
  });

  // Initialize workload tracker for each team member
  const workload = new Map<
    string,
    Array<{ taskId: string; start: Date; end: Date; hours: number }>
  >();
  teamMembers.forEach((member) => {
    workload.set(member.user_id, []);
  });

  // Load existing scheduled tasks into workload
  tasks
    .filter(
      (task) =>
        task.task_type === "manager" &&
        !task.completed &&
        task.start_date &&
        task.due_date &&
        task.assigned_to,
    )
    .forEach((task) => {
      const memberWorkload = workload.get(task.assigned_to!);
      if (memberWorkload) {
        memberWorkload.push({
          taskId: task.id,
          start: new Date(task.start_date!),
          end: new Date(task.due_date!),
          hours: task.estimated_hours || 0,
        });
      }
    });

  const now = new Date();

  // Schedule each task
  for (const task of tasksToSchedule) {
    // Skip if task already has dates and is manually scheduled
    const hasManualDates = task.start_date && task.due_date;
    const isAlreadyAssigned = task.assigned_to;

    if (hasManualDates && isAlreadyAssigned) {
      // Keep existing schedule
      continue;
    }

    const estimatedHours = task.estimated_hours!;
    const estimatedDays = Math.ceil(estimatedHours / WORK_HOURS_PER_DAY);

    // Determine deadline
    let deadline = projectDeadline;
    if (task.due_date) {
      deadline = new Date(task.due_date);
    }

    // Find best team member (least loaded, no conflicts)
    let bestMember: string | null = null;
    let bestStartDate: Date | null = null;
    let lowestWorkload = Infinity;

    for (const member of teamMembers) {
      const memberWorkload = workload.get(member.user_id) || [];
      const totalHours = memberWorkload.reduce(
        (sum, item) => sum + item.hours,
        0,
      );

      // Skip if member is already overloaded
      if (totalHours > estimatedHours && totalHours > lowestWorkload) {
        continue;
      }

      // Find earliest available slot for this member
      const startDate = findEarliestSlot(
        memberWorkload,
        estimatedDays,
        now,
        deadline,
      );

      if (startDate && totalHours < lowestWorkload) {
        bestMember = member.user_id;
        bestStartDate = startDate;
        lowestWorkload = totalHours;
      }
    }

    if (!bestMember || !bestStartDate) {
      // Could not schedule - add to conflicts
      result.conflicts.push({
        taskId: task.id,
        issue: deadline
          ? `No available team member before deadline ${deadline.toLocaleDateString()}`
          : "No available team member found",
      });
      continue;
    }

    // Calculate end date (skip weekends)
    const endDate = addWorkDays(bestStartDate, estimatedDays);

    // Check if exceeds deadline
    if (deadline && endDate > deadline) {
      result.conflicts.push({
        taskId: task.id,
        issue: `Estimated completion ${endDate.toLocaleDateString()} exceeds deadline ${deadline.toLocaleDateString()}`,
      });
    }

    // Add to schedule
    result.scheduledTasks.push({
      taskId: task.id,
      suggestedStartDate: bestStartDate,
      suggestedDueDate: endDate,
      assignedTo: bestMember,
      reason: `Assigned to least loaded team member (${lowestWorkload.toFixed(1)}h current workload)`,
    });

    // Update workload tracker
    const memberWorkload = workload.get(bestMember)!;
    memberWorkload.push({
      taskId: task.id,
      start: bestStartDate,
      end: endDate,
      hours: estimatedHours,
    });
  }

  // Build workload summary
  workload.forEach((items, userId) => {
    const totalHours = items.reduce((sum, item) => sum + item.hours, 0);
    result.workloadSummary.push({
      userId,
      totalHours,
      tasksCount: items.length,
    });
  });

  return result;
}

/**
 * Find earliest available time slot for a task without conflicts.
 */
function findEarliestSlot(
  existingWorkload: Array<{ start: Date; end: Date }>,
  durationDays: number,
  earliestStart: Date,
  deadline?: Date,
): Date | null {
  // Start from tomorrow or earliest start
  let candidateStart = new Date(earliestStart);
  candidateStart.setHours(0, 0, 0, 0);
  candidateStart.setDate(candidateStart.getDate() + 1);

  // Skip weekends
  while (candidateStart.getDay() === 0 || candidateStart.getDay() === 6) {
    candidateStart.setDate(candidateStart.getDate() + 1);
  }

  const maxIterations = 365; // Prevent infinite loop
  let iterations = 0;

  while (iterations < maxIterations) {
    const candidateEnd = addWorkDays(candidateStart, durationDays);

    // Check if within deadline
    if (deadline && candidateEnd > deadline) {
      return null;
    }

    // Check for conflicts
    const hasConflict = existingWorkload.some((item) => {
      return (
        (candidateStart >= item.start && candidateStart < item.end) ||
        (candidateEnd > item.start && candidateEnd <= item.end) ||
        (candidateStart <= item.start && candidateEnd >= item.end)
      );
    });

    if (!hasConflict) {
      return candidateStart;
    }

    // Move to next day and retry
    candidateStart.setDate(candidateStart.getDate() + 1);
    while (candidateStart.getDay() === 0 || candidateStart.getDay() === 6) {
      candidateStart.setDate(candidateStart.getDate() + 1);
    }

    iterations++;
  }

  return null;
}

/**
 * Add working days (skip weekends).
 */
function addWorkDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }

  return result;
}
