"use client";

import { useState } from "react";
import { SpacesList } from "@/components/talk/spaces-list";
import { AIInsightPanel } from "@/components/talk/ai-insight-panel";

interface TalkClientProps {
  orgSlug: string;
  userId: string;
}

export function TalkClient({ orgSlug, userId }: TalkClientProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      {/* Left Sidebar - Spaces */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200">
        <SpacesList orgSlug={orgSlug} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-6xl">💬</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Welcome to Talk
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Select a space to start a conversation,
            <br />
            or create a new one to get started.
          </p>
          <div className="flex justify-center gap-2 text-xs text-gray-400">
            <span>🧠 Context-aware</span>
            <span>•</span>
            <span>🪶 Calm communication</span>
            <span>•</span>
            <span>💬 Personality-driven</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar - AI Insights (hidden until thread selected) */}
      {selectedThreadId && (
        <div className="w-80 flex-shrink-0 border-l border-gray-200">
          <AIInsightPanel threadId={selectedThreadId} orgSlug={orgSlug} />
        </div>
      )}
    </div>
  );
}
