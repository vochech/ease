import type { Metadata } from "next";
import SidebarNav from "../../components/sidebar-nav";
import Topbar from "../../components/topbar";
import DashboardCard from "../../components/dashboard-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard - Ease",
};

type Data = {
  projects: number;
  tasks: number;
  meetings: number;
  lastSync: string;
};

export default function Page() {
  // Mocked data for now
  const data: Data = {
    projects: 12,
    tasks: 37,
    meetings: 3,
    lastSync: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12">
          <aside className="col-span-12 md:col-span-3 lg:col-span-2 border-r bg-white">
            <SidebarNav />
          </aside>

          <main className="col-span-12 md:col-span-9 lg:col-span-10 p-6">
            <Topbar />

            <section className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <DashboardCard title="Active Projects" value={data.projects} />
                <DashboardCard title="Open Tasks" value={data.tasks} />
                <DashboardCard title="Upcoming Meetings" value={data.meetings} />
                <DashboardCard title="Last Sync" value={new Date(data.lastSync).toLocaleString()} />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
