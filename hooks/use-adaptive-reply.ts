"use client";

import { useState, useCallback } from "react";
import { getAdaptiveGreeting } from "@/lib/ai-mediator-pure";
import type { UserContext } from "@/lib/ai-mediator-pure";

interface UseAdaptiveReplyResult {
  reply: string | null;
  isGenerating: boolean;
  error: string | null;
  generateReply: (message: string, context: UserContext) => Promise<void>;
  getGreeting: (context: UserContext) => string;
}

/**
 * Hook for generating personality-aware AI replies
 */
export function useAdaptiveReply(): UseAdaptiveReplyResult {
  const [reply, setReply] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReply = useCallback(async (message: string, context: UserContext) => {
    setIsGenerating(true);
    setError(null);
    setReply(null);

    try {
      const res = await fetch("/api/adaptive-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setReply(data.reply || null);
    } catch (err) {
      console.error("[useAdaptiveReply] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate reply");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const getGreeting = useCallback((context: UserContext) => {
    return getAdaptiveGreeting(context);
  }, []);

  return {
    reply,
    isGenerating,
    error,
    generateReply,
    getGreeting,
  };
}
