import { NextResponse } from "next/server";
import { getGoogleAuthClient, exchangeCodeForToken } from "../../../../../lib/googleCalendar";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const auth = getGoogleAuthClient();
    const tokens = await exchangeCodeForToken(auth, code);

    // Store tokens in a secure, httpOnly cookie for demo purposes.
    const res = NextResponse.redirect(new URL("/google-events", req.url));
    res.cookies.set("google_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // Google tokens often include expiry; set a reasonable maxAge (7 days) for demo
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
