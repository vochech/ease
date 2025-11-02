"use client";

import { useEffect, useState } from "react";
import { usePersonalityContext } from "@/hooks/use-personality-context";
import { useAdaptiveReply } from "@/hooks/use-adaptive-reply";

interface AIInsightPanelProps {
  threadId: string;
  orgSlug: string;
}

interface ThreadSummary {
  message_count: number;
  participant_count: number;
  last_activity: string;
  avg_sentiment: number;
  tone_indicators: string[];
}

export function AIInsightPanel({ threadId, orgSlug }: AIInsightPanelProps) {
  const context = usePersonalityContext();
  const { getGreeting } = useAdaptiveReply();
  const [summary, setSummary] = useState<ThreadSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [threadId]);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/${orgSlug}/talk/threads/${threadId}/summary`
      );
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("[AIInsightPanel] Load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (avg: number) => {
    if (avg >= 0.7) return "text-green-600";
    if (avg >= 0.4) return "text-gray-600";
    return "text-orange-600";
  };

  const getSentimentLabel = (avg: number) => {
    if (avg >= 0.7) return "Positive";
    if (avg >= 0.4) return "Neutral";
    return "Needs attention";
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-sm text-gray-400">Loading insights...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50 p-6">
      {/* Greeting */}
      {!context.isLoading && (
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            AI Assistant
          </div>
          <p className="text-sm text-gray-700">{getGreeting(context)}</p>
        </div>
      )}

      {/* Thread Summary */}
      {summary && (
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Thread Overview
          </div>

          <div className="space-y-3">
            {/* Message count */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Messages</span>
              <span className="text-sm font-medium text-gray-900">
                {summary.message_count}
              </span>
            </div>

            {/* Participants */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Participants</span>
              <span className="text-sm font-medium text-gray-900">
                {summary.participant_count}
              </span>
            </div>

            {/* Sentiment */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overall Tone</span>
              <span
                className={`text-sm font-medium ${getSentimentColor(
                  summary.avg_sentiment
                )}`}
              >
                {getSentimentLabel(summary.avg_sentiment)}
              </span>
            </div>

            {/* Tone indicators */}
            {summary.tone_indicators && summary.tone_indicators.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {summary.tone_indicators.map((tone) => (
                  <span
                    key={tone}
                    className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                  >
                    {tone}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Context */}
      {!context.isLoading && (
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Your State
          </div>

          <div className="space-y-2">
            {context.personality && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Personality</span>
                <span className="text-sm font-medium capitalize text-gray-900">
                  {context.personality}
                </span>
              </div>
            )}

            {context.mood && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mood</span>
                <span
                  className={`text-sm font-medium capitalize ${
                    context.mood === "high"
                      ? "text-green-600"
                      : context.mood === "low"
                      ? "text-orange-600"
                      : "text-gray-900"
                  }`}
                >
                  {context.mood}
                </span>
              </div>
            )}

            {context.workload && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Workload</span>
                <span
                  className={`text-sm font-medium capitalize ${
                    context.workload === "overwhelmed" ||
                    context.workload === "high"
                      ? "text-orange-600"
                      : "text-gray-900"
                  }`}
                >
                  {context.workload}
                </span>
              </div>
            )}

            {context.energyLevel !== undefined && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                  <span>Energy</span>
                  <span>{context.energyLevel}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${context.energyLevel}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reflective Prompts */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Consider
        </div>

        <div className="space-y-3">
          <button className="w-full rounded-lg border border-gray-200 p-3 text-left text-sm text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50">
            What&apos;s the smallest next step we could take?
          </button>
          <button className="w-full rounded-lg border border-gray-200 p-3 text-left text-sm text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50">
            Are we aligned on the goal here?
          </button>
          <button className="w-full rounded-lg border border-gray-200 p-3 text-left text-sm text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50">
            Should we document this decision?
          </button>
        </div>
      </div>
    </div>
  );
}
