"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function signInWithGoogle() {
  const origin = (await headers()).get("origin") || "http://localhost:3000";
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (e) {
            console.error("Failed to set cookies:", e);
          }
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    console.error("OAuth initiation error:", error);
    return { error: error.message };
  }

  if (data.url) {
    console.log("OAuth URL generated, redirecting to:", data.url);
    redirect(data.url);
  }

  return { error: "No OAuth URL generated" };
}
