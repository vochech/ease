"use client";

import { useEffect, useState } from "react";
import { SpacesList } from "@/components/talk/spaces-list";
import { ThreadView } from "@/components/talk/thread-view";
import { MessageInput } from "@/components/talk/message-input";
import { AIInsightPanel } from "@/components/talk/ai-insight-panel";

interface Thread {
  id: string;
  title: string;
  last_message_at: string;
  unread_count: number;
  is_resolved: boolean;
}

interface SpaceDetailClientProps {
  orgSlug: string;
  spaceId: string;
  spaceName: string;
  userId: string;
}

export function SpaceDetailClient({
  orgSlug,
  spaceId,
  spaceName,
  userId,
}: SpaceDetailClientProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateThreadOpen, setIsCreateThreadOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");

  useEffect(() => {
    loadThreads();
  }, [spaceId]);

  const loadThreads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/${orgSlug}/talk/threads?space_id=${spaceId}`
      );
      const data = await res.json();
      const loadedThreads = data.threads || [];
      setThreads(loadedThreads);

      // Auto-select first thread if none selected
      if (!selectedThreadId && loadedThreads.length > 0) {
        setSelectedThreadId(loadedThreads[0].id);
      }
    } catch (error) {
      console.error("[SpaceDetailClient] Load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim()) return;

    try {
      const res = await fetch(`/api/${orgSlug}/talk/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id: spaceId,
          title: newThreadTitle.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewThreadTitle("");
        setIsCreateThreadOpen(false);
        setSelectedThreadId(data.thread.id);
        loadThreads();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create thread");
      }
    } catch (error) {
      console.error("[SpaceDetailClient] Create error:", error);
    }
  };

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  return (
    <div className="flex h-screen">
      {/* Left Sidebar - Spaces */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200">
        <SpacesList orgSlug={orgSlug} />
      </div>

      {/* Middle - Threads List */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              {spaceName}
            </h2>
            <button
              onClick={() => setIsCreateThreadOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
              New Thread
            </button>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-6">
                <div className="text-sm text-gray-400">Loading threads...</div>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500">
                  No threads yet.
                  <br />
                  Start a new conversation!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      selectedThreadId === thread.id
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <span className="flex-1 truncate text-sm font-medium text-gray-900">
                        {thread.title}
                      </span>
                      {thread.unread_count > 0 && (
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(thread.last_message_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Thread View */}
      <div className="flex flex-1 flex-col bg-gray-50">
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div className="border-b border-gray-200 bg-white px-8 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedThread.title}
              </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ThreadView
                threadId={selectedThread.id}
                orgSlug={orgSlug}
                currentUserId={userId}
              />
            </div>

            {/* Message Input */}
            <MessageInput
              threadId={selectedThread.id}
              threadTitle={selectedThread.title}
              orgSlug={orgSlug}
              onMessageSent={loadThreads}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-4xl">💬</div>
              <p className="text-sm text-gray-500">
                Select a thread or create a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - AI Insights */}
      {selectedThreadId && (
        <div className="w-80 flex-shrink-0 border-l border-gray-200">
          <AIInsightPanel threadId={selectedThreadId} orgSlug={orgSlug} />
        </div>
      )}

      {/* Create Thread Modal */}
      {isCreateThreadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Create Thread
            </h3>

            <form onSubmit={handleCreateThread}>
              <input
                type="text"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder="Thread title..."
                className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                autoFocus
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateThreadOpen(false);
                    setNewThreadTitle("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newThreadTitle.trim()}
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
