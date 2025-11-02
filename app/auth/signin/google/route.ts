import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const nextParam = requestUrl.searchParams.get("next");
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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`,
    },
  });

  if (error) {
    console.error("OAuth initiation error:", error);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, origin),
    );
  }

  if (data.url) {
    console.log("✅ OAuth URL generated, cookies set");
    return NextResponse.redirect(data.url);
  }

  return NextResponse.redirect(
    new URL("/auth/error?error=no_oauth_url", origin),
  );
}
