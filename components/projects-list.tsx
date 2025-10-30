"use client";

import { useOrg } from "@/components/providers/org-provider";
import { useRoleHelpers } from "@/lib/useRoleHelpers";
import { DashboardCard } from "@/components/dashboard-card";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  org_id: string;
  created_at: string;
};

type ProjectsListProps = {
  projects: Project[];
};

export function ProjectsList({ projects }: ProjectsListProps) {
  const { userRole } = useOrg();
  const { canEdit, canManage } = useRoleHelpers(userRole);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.length === 0 ? (
        <div className="col-span-full text-center py-12 text-gray-500">
          <p className="text-lg">No projects yet</p>
          {canEdit && (
            <p className="text-sm mt-2">Create your first project to get started</p>
          )}
        </div>
      ) : (
        projects.map((project) => (
          <DashboardCard
            key={project.id}
            title={project.name}
            description={project.description || undefined}
            action={
              canManage ? (
                <button className="text-sm text-blue-600 hover:underline">
                  Manage
                </button>
              ) : null
            }
          >
            <div className="mt-3 flex items-center gap-2">
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
          </DashboardCard>
        ))
      )}
    </div>
  );
}
