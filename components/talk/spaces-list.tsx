"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Space {
  id: string;
  space_type: "project" | "meeting" | "topic" | "dm";
  title: string;
  updated_at: string;
}

interface SpacesListProps {
  orgSlug: string;
}

export function SpacesList({ orgSlug }: SpacesListProps) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSpaceTitle, setNewSpaceTitle] = useState("");
  const [newSpaceType, setNewSpaceType] = useState<Space["space_type"]>("topic");
  const pathname = usePathname();

  useEffect(() => {
    loadSpaces();
  }, [orgSlug]);

  const loadSpaces = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/${orgSlug}/talk/spaces`);
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch (error) {
      console.error("[SpacesList] Load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceTitle.trim()) return;

    try {
      const res = await fetch(`/api/${orgSlug}/talk/spaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_type: newSpaceType,
          title: newSpaceTitle.trim(),
        }),
      });

      if (res.ok) {
        setNewSpaceTitle("");
        setIsCreateModalOpen(false);
        loadSpaces();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create space");
      }
    } catch (error) {
      console.error("[SpacesList] Create error:", error);
    }
  };

  const groupedSpaces = spaces.reduce(
    (acc, space) => {
      if (!acc[space.space_type]) {
        acc[space.space_type] = [];
      }
      acc[space.space_type].push(space);
      return acc;
    },
    {} as Record<Space["space_type"], Space[]>
  );

  const getSpaceIcon = (type: Space["space_type"]) => {
    switch (type) {
      case "project":
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        );
      case "meeting":
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
      case "topic":
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        );
      case "dm":
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Talk</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-gray-900 p-2 text-white transition-colors hover:bg-gray-800"
            title="New space"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Home link */}
        <Link
          href={`/${orgSlug}/talk`}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === `/${orgSlug}/talk`
              ? "bg-gray-100 font-medium text-gray-900"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Home
        </Link>
      </div>

      {/* Spaces List */}
      <div className="flex-1 overflow-y-auto p-6">
        {Object.entries(groupedSpaces).map(([type, typeSpaces]) => (
          <div key={type} className="mb-6">
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {type}s
            </div>
            <div className="space-y-1">
              {typeSpaces.map((space) => (
                <Link
                  key={space.id}
                  href={`/${orgSlug}/talk/spaces/${space.id}`}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    pathname.includes(space.id)
                      ? "bg-gray-900 font-medium text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {getSpaceIcon(space.space_type as Space["space_type"])}
                  <span className="flex-1 truncate">{space.title}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {spaces.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-gray-500">
              No spaces yet.
              <br />
              Create one to get started!
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Create Space
            </h3>

            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Space Type
                </label>
                <select
                  value={newSpaceType}
                  onChange={(e) =>
                    setNewSpaceType(e.target.value as Space["space_type"])
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="topic">Topic</option>
                  <option value="project">Project</option>
                  <option value="meeting">Meeting</option>
                  <option value="dm">Direct Message</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={newSpaceTitle}
                  onChange={(e) => setNewSpaceTitle(e.target.value)}
                  placeholder="e.g., Design Feedback, Q1 Planning"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewSpaceTitle("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSpaceTitle.trim()}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
