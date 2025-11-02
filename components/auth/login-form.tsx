"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function LoginForm() {
  const [mounted, setMounted] = useState(false);
  const [nextParam, setNextParam] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const sp = new URLSearchParams(window.location.search);
      setNextParam(sp.get("next") ?? sp.get("redirect"));
    } catch {
      setNextParam(null);
    }
  }, []);

  if (!mounted) return null;

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`,
        },
      });
      if (error) throw error;
      setMessage({ type: "success", text: "Check your email for the magic link!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send magic link",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <Link
        href={`/auth/signin/google${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </Link>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleMagicLink} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 ring-1 ring-green-200"
              : "bg-red-50 text-red-800 ring-1 ring-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-500">
        By continuing, you agree to our {" "}
        <Link href="/terms" className="font-medium text-gray-900 hover:underline">
          Terms of Service
        </Link>{" "}
        and {" "}
        <Link href="/privacy" className="font-medium text-gray-900 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
