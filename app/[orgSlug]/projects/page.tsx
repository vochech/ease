import { supabaseServer } from "@/lib/supabaseServer";
import { ProjectsList } from "@/components/projects-list";

export const dynamic = "force-dynamic";

type ProjectsPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { orgSlug } = await params;
  const supabase = await supabaseServer();

  // Get organization by slug
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return <div>Organization not found</div>;
  }

  // Fetch projects for this organization
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your organization&apos;s projects
          </p>
        </div>
      </header>

      <ProjectsList projects={projects || []} />
    </div>
  );
}
