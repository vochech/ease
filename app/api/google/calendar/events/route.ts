import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getGoogleAuthClient,
  listEvents,
} from "../../../../../lib/googleCalendar";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("google_tokens")?.value;
    if (!tokenCookie)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const tokens = JSON.parse(tokenCookie);
    const auth = getGoogleAuthClient();
    auth.setCredentials(tokens);

    const events = await listEvents(auth, 20);
    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || String(error) },
      { status: 500 },
    );
  }
}
