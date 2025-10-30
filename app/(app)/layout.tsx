import type { Metadata } from "next";
import SidebarNav from "@/components/sidebar-nav";
import Topbar from "@/components/topbar";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Ease | Dashboard",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="flex">
        <aside className="hidden md:block">
          <SidebarNav />
        </aside>
        <div className="flex-1">
          <Topbar title="Dashboard" />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
