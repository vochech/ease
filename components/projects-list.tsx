"use client";

import { useOrg } from "@/components/providers/org-provider";
import { useRoleHelpers } from "@/lib/useRoleHelpers";
import { DashboardCard } from "@/components/dashboard-card";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const { userRole, orgSlug, orgId } = useOrg();
  const { canEdit, canManage } = useRoleHelpers(userRole);
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;

    try {
      const response = await fetch(`/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          name,
          description: description || null,
          status: status || "active",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create project");
      }

      setShowCreateForm(false);
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Project Button */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {showCreateForm ? "Cancel" : "+ New Project"}
          </button>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Create New Project</h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Website Redesign"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Optional project description"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue="active"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {createError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {createError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                }}
                disabled={isCreating}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 && !showCreateForm ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p className="text-lg">No projects yet</p>
            {canEdit && (
              <p className="text-sm mt-2">
                Create your first project to get started
              </p>
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
                  <Link
                    href={`/${orgSlug}/projects/${project.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Manage
                  </Link>
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
    </div>
  );
}
