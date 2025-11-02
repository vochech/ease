"use client";

import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await supabaseClient.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
    >
      {loading ? "..." : "Sign out"}
    </button>
  );
}
