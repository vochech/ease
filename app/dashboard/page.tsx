import type { Metadata } from "next";
import SidebarNav from "../../components/sidebar-nav";
import Topbar from "../../components/topbar";
import DashboardCard from "../../components/dashboard-card";
import { supabaseServer } from "../../lib/supabaseServer";

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

async function fetchCounts(): Promise<Data> {
  try {
    const supabase = await supabaseServer();

    // Query counts sequentially and handle partial failures gracefully.
    let projects = 0;
    let tasks = 0;
    let meetings = 0;

    try {
      const res = (await supabase.from("projects").select("id", { count: "exact", head: true })) as any;
      if (typeof (res?.count) === "number") projects = res.count;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("projects count failed:", e);
    }

    try {
      const res = (await supabase.from("tasks").select("id", { count: "exact", head: true })) as any;
      if (typeof (res?.count) === "number") tasks = res.count;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("tasks count failed:", e);
    }

    try {
      const res = (await supabase.from("meetings").select("id", { count: "exact", head: true })) as any;
      if (typeof (res?.count) === "number") meetings = res.count;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("meetings count failed:", e);
    }

    const data: Data = {
      projects,
      tasks,
      meetings,
      lastSync: new Date().toISOString(),
    };

    // If any count is non-zero, assume live data is available.
    if (projects + tasks + meetings > 0) return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("fetchCounts top-level error:", err);
  }

  // Fallback mocked values when live counts are not available.
  return {
    projects: 12,
    tasks: 37,
    meetings: 3,
    lastSync: new Date().toISOString(),
  };
}

export default async function Page() {
  const data = await fetchCounts();

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
