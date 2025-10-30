"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { name: string; href: string };

const items: Item[] = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Projects", href: "/projects" },
  { name: "Tasks", href: "/tasks" },
  { name: "Calendar", href: "/calendar" },
  { name: "Meetings", href: "/meetings" },
  { name: "Settings", href: "/settings" },
];

export default function SidebarNav() {
  const pathname = usePathname() || "/";
  return (
    <nav className="flex w-full flex-col p-4 text-sm">
      {/* Logo/Brand */}
      <div className="mb-8 px-3">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">Ease</h2>
        <p className="text-xs text-gray-500">Workspace</p>
      </div>
      
      {/* Navigation items */}
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 transition-colors ${
                  active 
                    ? "bg-gray-200 font-medium text-gray-900" 
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
