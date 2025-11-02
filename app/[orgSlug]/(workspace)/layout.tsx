import { ReactNode } from "react";
import SidebarNav from "@/components/sidebar-nav";
import { TimerWidget } from "@/components/timer-widget";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[16rem_1fr] bg-gray-50">
      <SidebarNav />
      <div className="overflow-y-auto">{children}</div>
      <TimerWidget />
    </div>
  );
}
