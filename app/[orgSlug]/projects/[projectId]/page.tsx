import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{ orgSlug: string; projectId: string }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
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
          <Link href={`/${orgSlug}/projects`} className="text-blue-600 hover:underline">
            ← Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  // Fetch tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, completed, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  // Fetch meetings
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, starts_at, created_at")
    .eq("project_id", project.id)
    .order("starts_at", { ascending: true });

  return (
    <main className="p-6 space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-gray-600">{project.description}</p>
          )}
          <div className="mt-3">
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              project.status === "active"
                ? "bg-green-50 text-green-700"
                : project.status === "completed"
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-50 text-gray-700"
            }`}>{project.status}</span>
          </div>
        </div>
        <Link href={`/${orgSlug}/projects`} className="text-sm text-blue-600 hover:underline">
          ← Back to Projects
        </Link>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-medium">Tasks</h2>
        {tasks && tasks.length > 0 ? (
          <ul className="divide-y divide-gray-200 rounded-md border">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between p-3 text-sm">
                <span className={t.completed ? "line-through text-gray-500" : ""}>{t.title}</span>
                <span className={`ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                  t.completed ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                }`}>{t.completed ? "done" : "open"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No tasks yet.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Meetings</h2>
        {meetings && meetings.length > 0 ? (
          <ul className="divide-y divide-gray-200 rounded-md border">
            {meetings.map((m) => (
              <li key={m.id} className="flex items-center justify-between p-3 text-sm">
                <span>{m.title}</span>
                <time className="text-gray-500">
                  {m.starts_at ? new Date(m.starts_at).toLocaleString() : "TBD"}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No meetings scheduled.</p>
        )}
      </section>
    </main>
  );
}
