import type { Metadata } from "next";
import SidebarNav from "@/components/sidebar-nav";
import Topbar from "@/components/topbar";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Ease | Dashboard",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar - fixed width, hidden on mobile */}
        <aside className="hidden md:flex w-64 flex-shrink-0 border-r bg-white">
          <SidebarNav />
        </aside>
        
        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar title="Dashboard" />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
