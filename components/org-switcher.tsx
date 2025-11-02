"use client";

import { useMemo, useState } from "react";

type OrgSwitcherProps = {
  orgs: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
  currentOrgSlug?: string;
};

/**
 * Organization switcher for top navigation.
 * Allows switching between organizations and shows current role.
 */
export function OrgSwitcher({ orgs, currentOrgSlug }: OrgSwitcherProps) {
  const pathname = useMemo(() => {
    if (typeof window === "undefined") return "/";
    return window.location.pathname;
  }, []);
  const [isOpen, setIsOpen] = useState(false);

  const currentOrg = orgs.find((org) => org.slug === currentOrgSlug);

  const handleSwitch = (slug: string) => {
    setIsOpen(false);

    // If we're on an org-specific page, redirect to the new org's equivalent
    if (pathname.includes("/dashboard")) {
      window.location.assign(`/${slug}/dashboard`);
    } else if (pathname.includes("/projects/")) {
      // On specific project detail page
      const match = pathname.match(/\/projects\/([^/]+)/);
      if (match) {
        // Go to projects list instead (project IDs won't match across orgs)
        window.location.assign(`/${slug}/projects`);
      } else {
        window.location.assign(`/${slug}/projects`);
      }
    } else if (pathname.includes("/projects")) {
      window.location.assign(`/${slug}/projects`);
    } else if (pathname.includes("/tasks")) {
      window.location.assign(`/${slug}/tasks`);
    } else if (pathname.includes("/timeline")) {
      window.location.assign(`/${slug}/timeline`);
    } else if (pathname.includes("/settings")) {
      window.location.assign(`/${slug}/settings`);
    } else {
      // Default to dashboard
      window.location.assign(`/${slug}/dashboard`);
    }
  };

  if (orgs.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
      >
        <span className="font-semibold text-gray-900">
          {currentOrg?.name || "Select Org"}
        </span>
        {currentOrg && (
          <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white">
            {currentOrg.role}
          </span>
        )}
        <svg
          className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Switch Organization
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {orgs.map((org) => {
                const isCurrent = org.slug === currentOrgSlug;
                return (
                  <button
                    key={org.id}
                    onClick={() => handleSwitch(org.slug)}
                    className={`flex w-full items-center justify-between px-5 py-3 text-sm transition-all duration-200 hover:bg-gray-50 ${
                      isCurrent ? "bg-gray-100" : ""
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span
                        className={`font-bold ${isCurrent ? "text-gray-900" : "text-gray-800"}`}
                      >
                        {org.name}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        /{org.slug}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        org.role === "owner"
                          ? "bg-gray-900 text-white"
                          : org.role === "manager"
                            ? "bg-gray-700 text-white"
                            : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {org.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
