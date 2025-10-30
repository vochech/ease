import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Server-side Supabase client
// In development, when BYPASS_AUTH=true, use the service role key to bypass RLS
// for server queries. This enables local testing without configuring Auth.
export async function supabaseServer() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isDev = process.env.NODE_ENV === "development";
  const bypassAuth = isDev && process.env.BYPASS_AUTH === "true";

  const keyToUse = bypassAuth && serviceRoleKey ? serviceRoleKey : anonKey;

  if (bypassAuth && !serviceRoleKey) {
    // eslint-disable-next-line no-console
    console.warn(
      "BYPASS_AUTH is enabled but SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to anon key; RLS may block queries."
    );
  }

  return createServerClient(supabaseUrl, keyToUse, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
}