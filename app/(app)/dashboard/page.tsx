export const dynamic = "force-dynamic";

import DashboardCard from "@/components/dashboard-card";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default async function DashboardPage() {
  const data = { projects: 12, tasks: 37, meetings: 3, lastSync: new Date().toISOString() };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Active Projects" value={data.projects} />
        <DashboardCard title="Open Tasks" value={data.tasks} />
        <DashboardCard title="Upcoming Meetings" value={data.meetings} />
        <DashboardCard title="Last Sync" value={<span className="text-base font-normal text-gray-700">{formatDate(data.lastSync)}</span>} />
      </section>

      <section>
        <DashboardCard title="Recent Activity" description="Latest events across your workspace.">
          <ul className="text-sm text-gray-600">
            <li>• Placeholder activity feed</li>
            <li>• Add recent changes, comments, or task updates here</li>
          </ul>
        </DashboardCard>
      </section>
    </div>
  );
}
