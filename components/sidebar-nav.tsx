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
    <nav className="w-56 p-4 text-sm">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 transition hover:bg-gray-100 ${
                  active ? "bg-gray-200 font-medium" : "text-gray-700"
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
