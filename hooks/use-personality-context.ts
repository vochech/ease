"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import type { PersonalityType, MoodLevel, WorkloadLevel, StressLevel, UserContext } from "@/lib/ai-mediator";

interface PersonalityContextData extends UserContext {
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetch user's personality, mood, workload, and stress context
 */
export function usePersonalityContext(): PersonalityContextData {
  const [context, setContext] = useState<UserContext>({ userId: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Get behavioral profile
      const { data: behavioralProfile } = await supabaseClient
        .from("behavioral_profiles")
        .select("personality_type, energy_baseline")
        .eq("user_id", user.id)
        .single();

      // Get latest context snapshot
      const { data: snapshot } = await supabaseClient
        .from("context_snapshots")
        .select("mood_level, workload_level, stress_level, energy_level")
        .eq("user_id", user.id)
        .order("captured_at", { ascending: false })
        .limit(1)
        .single();

      const userContext: UserContext = {
        userId: user.id,
        personality: behavioralProfile?.personality_type as PersonalityType | undefined,
        mood: snapshot?.mood_level as MoodLevel | undefined,
        workload: snapshot?.workload_level as WorkloadLevel | undefined,
        stress: snapshot?.stress_level as StressLevel | undefined,
        energyLevel: snapshot?.energy_level || behavioralProfile?.energy_baseline || 50,
      };

      setContext(userContext);
    } catch (err) {
      console.error("[usePersonalityContext] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load context");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  return {
    ...context,
    isLoading,
    error,
    refresh: fetchContext,
  };
}
