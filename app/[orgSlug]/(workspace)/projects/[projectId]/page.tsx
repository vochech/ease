import Link from "next/link";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabaseServer";
import { EditProjectForm } from "@/components/projects/edit-project-form";
import { TasksList } from "@/components/tasks/tasks-list";
import { GanttChartWrapper as GanttChart } from "@/components/timeline/gantt-chart-wrapper";
import { AutoScheduleButton } from "@/components/scheduling/auto-schedule-button";
import { ProjectMembersManager } from "@/components/projects/project-members-manager";
import { getOrgMembership } from "@/lib/roles";
import type { ProjectMemberRole } from "@/types/project-members";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{ orgSlug: string; projectId: string }>;
};

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { orgSlug, projectId } = await params;
  const supabase = await supabaseServer();

  // Fetch project details with org_id for safety
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, description, status, org_id, created_at")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return (
      <main className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Failed to load project.
        </div>
        <div className="mt-4">
          <Link
            href={`/${orgSlug}/projects`}
            className="text-blue-600 hover:underline"
          >
            ← Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  // Fetch manager tasks with their subtasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", project.id)
    .eq("task_type", "manager")
    .order("created_at", { ascending: false });

  // Fetch personal subtasks for current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: personalTasks } = user
    ? await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", project.id)
        .eq("task_type", "personal")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
    : { data: null };

  // Get org members for task assignment
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  const { data: orgMembersRaw } = org
    ? await supabase
        .from("org_members")
        .select("user_id, role, users(email)")
        .eq("org_id", org.id)
    : { data: null };

  // Map to expected type
  const orgMembers = (orgMembersRaw || []).map((m: any) => ({
    user_id: m.user_id,
    role: m.role,
    users:
      m.users && Array.isArray(m.users) && m.users[0] ? m.users[0] : undefined,
  }));

  // Get user's role for permissions
  const membership = org && user ? await getOrgMembership(org.id) : null;
  const canManage =
    membership?.role === "owner" || membership?.role === "manager";

  // Fetch meetings
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, starts_at, created_at")
    .eq("project_id", project.id)
    .order("starts_at", { ascending: true });

  // Fetch project members
  const { data: projectMembersRaw } = await supabase
    .from("project_members")
    .select(
      "id, project_id, user_id, role, added_by, created_at, updated_at, users:user_id(email)",
    )
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  // Normalize joined users result (Supabase may return arrays)
  const projectMembers = (projectMembersRaw || []).map((pm: any) => ({
    ...pm,
    users: Array.isArray(pm.users) ? pm.users[0] : pm.users,
  }));

  // Server actions for managing project members
  async function addProjectMemberAction(
    userId: string,
    role: ProjectMemberRole,
  ) {
    "use server";
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: userId,
      role,
      added_by: user.id,
    });

    revalidatePath(`/${orgSlug}/projects/${projectId}`);
  }

  async function removeProjectMemberAction(memberId: string) {
    "use server";
    const supabase = await supabaseServer();
    await supabase.from("project_members").delete().eq("id", memberId);
    revalidatePath(`/${orgSlug}/projects/${projectId}`);
  }

  async function updateProjectMemberRoleAction(
    memberId: string,
    role: ProjectMemberRole,
  ) {
    "use server";
    const supabase = await supabaseServer();
    await supabase.from("project_members").update({ role }).eq("id", memberId);
    revalidatePath(`/${orgSlug}/projects/${projectId}`);
  }

  return (
    <main className="p-6 space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1 text-sm text-gray-600">{project.description}</p>
          )}
          <div className="mt-3">
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                project.status === "active"
                  ? "bg-green-50 text-green-700"
                  : project.status === "completed"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-gray-50 text-gray-700"
              }`}
            >
              {project.status}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Link
            href={`/${orgSlug}/projects`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Projects
          </Link>
          <EditProjectForm project={project} orgSlug={orgSlug} />
        </div>
      </header>

      <TasksList
        projectId={project.id}
        managerTasks={tasks || []}
        personalTasks={personalTasks || []}
        orgMembers={orgMembers || []}
        canManage={canManage}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Timeline</h2>
              {canManage && <AutoScheduleButton projectId={project.id} />}
            </div>
            <GanttChart tasks={tasks || []} orgMembers={orgMembers || []} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Meetings</h2>
            {meetings && meetings.length > 0 ? (
              <ul className="divide-y divide-gray-200 rounded-md border">
                {meetings.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between p-3 text-sm"
                  >
                    <span>{m.title}</span>
                    <time className="text-gray-500">
                      {m.starts_at
                        ? new Date(m.starts_at).toLocaleString()
                        : "TBD"}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No meetings scheduled.</p>
            )}
          </section>
        </div>

        <aside>
          <section>
            <h2 className="mb-3 text-lg font-medium">Team</h2>
            <ProjectMembersManager
              projectId={project.id}
              projectMembers={projectMembers || []}
              orgMembers={orgMembers || []}
              canManage={canManage}
              onAddMemberAction={addProjectMemberAction}
              onRemoveMemberAction={removeProjectMemberAction}
              onUpdateRoleAction={updateProjectMemberRoleAction}
            />
          </section>
        </aside>
      </div>
    </main>
  );
}
