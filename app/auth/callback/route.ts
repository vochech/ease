import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const nextParam = requestUrl.searchParams.get("next");

  console.log("🔐 Auth callback received:", {
    hasCode: !!code,
    hasError: !!oauthError,
    error: oauthError,
    error_description: errorDescription,
    allParams: Object.fromEntries(requestUrl.searchParams.entries()),
    url: requestUrl.toString(),
  });

  if (oauthError) {
    console.error("❌ OAuth error in callback:", oauthError, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=${encodeURIComponent(oauthError)}&error_description=${encodeURIComponent(errorDescription || "")}`,
        requestUrl.origin,
      ),
    );
  }

  if (!code) {
    console.error(
      "❌ No code in callback URL - params:",
      Object.fromEntries(requestUrl.searchParams.entries()),
    );
    return NextResponse.redirect(
      new URL("/auth/error?error=no_code", requestUrl.origin),
    );
  }

  // Create a temporary response to attach cookies during session exchange
  const tempResponse = NextResponse.next();

  // Debug: Check what cookies we have
  const allCookies = request.cookies.getAll();
  console.log(
    "📦 Cookies received:",
    allCookies.map((c) => c.name),
  );
  const pkceVerifier = allCookies.find((c) => c.name.includes("code-verifier"));
  console.log("🔑 PKCE verifier cookie:", pkceVerifier ? "found" : "MISSING");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            tempResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    console.error("❌ Auth callback error:", sessionError);
    return NextResponse.redirect(
      new URL(
        "/auth/error?error=" + encodeURIComponent(sessionError.message),
        requestUrl.origin,
      ),
    );
  }

  if (data.session) {
    console.log("✅ Session created for user:", data.user?.email);
  } else {
    console.warn("⚠️  No session created");
  }

  // Determine redirect target
  let targetPath: string | null = null;
  if (nextParam && nextParam.startsWith("/")) {
    targetPath = nextParam;
  } else {
    try {
      // Find user's first organization slug
      const { data: memberships } = await supabase
        .from("org_members")
        .select("organizations(slug)")
        .eq("user_id", data.user!.id)
        .limit(1);

      const slug =
        memberships &&
        memberships[0] &&
        (memberships[0] as any).organizations?.slug as string | undefined;

      if (slug) {
        // Check if user has already completed today's daily check-in
        const today = new Date().toISOString().split("T")[0];
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("slug", slug)
          .single();

        if (org?.id) {
          const { data: checkin } = await supabase
            .from("daily_check_ins")
            .select("id")
            .eq("user_id", data.user!.id)
            .eq("org_id", org.id)
            .eq("check_in_date", today)
            .maybeSingle();

          targetPath = checkin ? `/${slug}/dashboard` : `/${slug}/daily`;
        } else {
          targetPath = `/${slug}/dashboard`;
        }
      }
    } catch (e) {
      console.warn("Could not resolve organization slug for redirect", e);
    }
  }

  // Fallbacks
  if (!targetPath) {
    targetPath = "/"; // let layout handle routing
  }

  const redirectResponse = NextResponse.redirect(
    new URL(targetPath, requestUrl.origin),
  );
  // Copy cookies from temp response to the final redirect response
  tempResponse.cookies.getAll().forEach((c) => {
    redirectResponse.cookies.set(c);
  });

  console.log("➡️  Redirecting to:", targetPath);
  return redirectResponse;
}
