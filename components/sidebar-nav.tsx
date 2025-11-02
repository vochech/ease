"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useOrg } from "@/components/providers/org-provider";
import { useMeeting } from "@/components/providers/meeting-provider";

type Item = { name: string; href: string };

const baseItems: Item[] = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Analytics", href: "/analytics" },
  { name: "Projects", href: "/projects" },
  { name: "Tasks", href: "/tasks" },
  { name: "Time", href: "/time" },
  { name: "Talk", href: "/talk" },
  { name: "Calendar", href: "/calendar" },
  { name: "Meetings", href: "/meetings" },
  { name: "Settings", href: "/settings" },
];

export default function SidebarNav() {
  // Current org context
  const { orgSlug } = useOrg();
  const { activeMeeting } = useMeeting();
  const pathname = useMemo(() => {
    if (typeof window === "undefined") return "/";
    return window.location.pathname;
  }, []);

  // Build org-scoped hrefs and replace "Meetings" with active meeting if in call
  const items = useMemo<Item[]>(() => {
    const prefix = `/${orgSlug}`;
    return baseItems
      .map((it) => {
        // Replace "Meetings" with active meeting when in call
        if (it.name === "Meetings" && activeMeeting) {
          return {
            name: activeMeeting.title,
            href: `${prefix}/meetings/${activeMeeting.meetingId}/room`,
          };
        }
        return {
          ...it,
          href: `${prefix}${it.href}`,
        };
      })
      .filter((it) => {
        // Hide "Meetings" item when NOT in a call
        if (it.name === "Meetings" && !activeMeeting) {
          return false;
        }
        return true;
      });
  }, [orgSlug, activeMeeting]);

  return (
    <nav className="flex w-full flex-col p-4 text-sm">
      {/* Logo/Brand */}
      <div className="mb-8 px-2">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">Ease</h2>
        <p className="text-xs font-medium text-gray-500">Workspace</p>
      </div>

      {/* Navigation items */}
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const isActiveMeeting =
            activeMeeting &&
            item.href.includes(`/meetings/${activeMeeting.meetingId}/room`);

          // Meeting item gets special styling
          if (isActiveMeeting) {
            return (
              <li key={item.name} className="mb-3">
                <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-green-600">
                  🔴 Live Meeting
                </div>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "border-green-600 bg-green-600 text-white shadow-lg shadow-green-600/30"
                      : "border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                    </div>
                    <span className="truncate">{item.name}</span>
                  </div>
                </Link>
                <div className="mt-3 border-t border-gray-200"></div>
              </li>
            );
          }

          // Regular navigation items
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-gray-900 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
