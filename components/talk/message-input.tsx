"use client";

import { useState, useRef, useEffect } from "react";
import { usePersonalityContext } from "@/hooks/use-personality-context";
import { suggestMessageImprovements } from "@/lib/ai-mediator-pure";
import type { ToneAnalysis } from "@/lib/ai-mediator-pure";

interface MessageInputProps {
  threadId: string;
  threadTitle: string;
  orgSlug: string;
  onMessageSent?: () => void;
}

export function MessageInput({
  threadId,
  threadTitle,
  orgSlug,
  onMessageSent,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showContext, setShowContext] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const context = usePersonalityContext();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Analyze tone as user types (debounced)
  useEffect(() => {
    if (!message.trim() || message.length < 20) {
      setToneAnalysis(null);
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/analyze-tone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const data = await res.json();
        if (data.tone) {
          setToneAnalysis(data.tone);
          const improvements = suggestMessageImprovements(
            message,
            data.tone,
            context
          );
          setSuggestions(improvements);
        }
      } catch (error) {
        console.error("[MessageInput] Tone analysis error:", error);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [message, context]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/${orgSlug}/talk/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          message: message.trim(),
        }),
      });

      if (res.ok) {
        setMessage("");
        setToneAnalysis(null);
        setSuggestions([]);
        onMessageSent?.();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("[MessageInput] Submit error:", error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Context Hint */}
      {showContext && (
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            <span>Replying to: <strong>{threadTitle}</strong></span>
          </div>
          <button
            onClick={() => setShowContext(false)}
            className="text-gray-400 hover:text-gray-600"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-b border-orange-100 bg-orange-50 px-6 py-3">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <div className="text-xs font-medium text-orange-900">
                Communication suggestions:
              </div>
              <ul className="mt-1 space-y-1 text-xs text-orange-700">
                {suggestions.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="px-6 py-4">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (⌘↩ to send)"
          rows={1}
          className="w-full resize-none border-none bg-transparent text-base text-gray-900 placeholder-gray-400 focus:outline-none"
          style={{
            minHeight: "44px",
            maxHeight: "200px",
            fontFamily: "Inter, -apple-system, sans-serif",
            lineHeight: "1.5",
          }}
        />

        <div className="mt-3 flex items-center justify-between">
          {/* Tone Indicators */}
          {toneAnalysis && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {toneAnalysis.clarity > 0.7 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-green-700">
                  ✓ Clear
                </span>
              )}
              {toneAnalysis.empathy > 0.7 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                  ♥ Empathetic
                </span>
              )}
              {toneAnalysis.urgency > 0.7 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-orange-700">
                  ⚡ Urgent
                </span>
              )}
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            {/* Character count */}
            {message.length > 500 && (
              <span className="text-xs text-gray-400">{message.length}</span>
            )}

            {/* Send button */}
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
