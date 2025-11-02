"use client";

// Lightweight alternative that doesn't use state inside effects.
export function useMounted(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
