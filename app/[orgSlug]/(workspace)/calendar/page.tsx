import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { CalendarView } from "@/components/calendar/calendar-view";
import { updateTaskDueDate } from "./actions";

type CalendarPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    redirect("/");
  }

  // Get user's role in this org
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/");
  }

  const userRole = membership.role as "owner" | "manager" | "member";

  // Get tasks with due dates for calendar view
  let tasksQuery = supabase
    .from("tasks")
    .select("*")
    .eq("org_id", org.id)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });

  // Role-based filtering
  if (userRole === "member") {
    tasksQuery = tasksQuery.eq("assigned_to", user.id);
  } else if (userRole === "manager") {
    // Get manager's assigned projects
    const { data: managerProjects } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", user.id)
      .eq("role", "manager");

    if (managerProjects && managerProjects.length > 0) {
      const projectIds = managerProjects.map((p) => p.project_id);
      tasksQuery = tasksQuery.in("project_id", projectIds);
    }
  }

  const { data: tasks } = await tasksQuery;

  // Get org projects for meeting creation
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", org.id)
    .order("name", { ascending: true });

  // Get org members for meeting creation and user lookup
  const { data: orgMembersRaw } = await supabase
    .from("org_members")
    .select("user_id, role, users(email)")
    .eq("org_id", org.id);

  const orgMembers = (orgMembersRaw || []).map((m: any) => ({
    user_id: m.user_id,
    role: m.role,
    users:
      m.users && Array.isArray(m.users) && m.users[0] ? m.users[0] : undefined,
  }));

  // Get meetings for this org
  const { data: allMeetings, error: meetingsError } = await supabase
    .from("meetings")
    .select(
      `
      id,
      title,
      start_time,
      end_time,
      description,
      location,
      meeting_link,
      project_id,
      created_by,
      meeting_participants (
        user_id,
        status
      )
    `,
    )
    .eq("org_id", org.id)
    .order("start_time", { ascending: true });

  if (meetingsError) {
    console.error("Failed to load meetings:", meetingsError);
  }

  // Enrich meetings with user data from orgMembers
  const enrichedMeetings = (allMeetings || []).map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    start_time: meeting.start_time,
    end_time: meeting.end_time || meeting.start_time,
    description: meeting.description,
    location: meeting.location,
    meeting_link: meeting.meeting_link,
    created_by: meeting.created_by || "",
    creator: orgMembers.find((m) => m.user_id === meeting.created_by),
    meeting_participants: (meeting.meeting_participants || []).map(
      (p: any) => ({
        user_id: p.user_id,
        status: p.status,
        participant: orgMembers.find((m) => m.user_id === p.user_id),
      }),
    ),
  }));

  // Debug: Log meetings

  console.log(
    "📅 Raw meetings from DB:",
    allMeetings?.length || 0,
    allMeetings,
  );

  console.log(
    "📅 Enriched meetings:",
    enrichedMeetings.length,
    enrichedMeetings,
  );

  // For now, show all meetings (TODO: implement participant filtering)
  const meetings = enrichedMeetings;

  const canCreateMeetings = userRole === "owner" || userRole === "manager";

  return (
    <main className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Calendar
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {userRole === "member"
            ? "Your tasks and meetings"
            : userRole === "manager"
              ? "Tasks from your projects and team meetings"
              : "All organization tasks and meetings"}
        </p>
      </header>

      <CalendarView
        tasks={tasks || []}
        meetings={meetings}
        orgSlug={orgSlug}
        userId={user.id}
        userRole={userRole}
        canCreateMeetings={canCreateMeetings}
        orgMembers={orgMembers || []}
        projects={projects || []}
        onUpdateDueDateAction={updateTaskDueDate}
      />
    </main>
  );
}
