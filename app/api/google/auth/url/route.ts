import { NextResponse } from "next/server";
import { generateAuthUrl } from "../../../../../lib/googleCalendar";

export async function GET() {
  try {
    const url = generateAuthUrl();
    return NextResponse.json({ url });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
