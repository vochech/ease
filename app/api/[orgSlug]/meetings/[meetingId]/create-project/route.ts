import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

// TODO(agent): Reimplement AI project creation logic using supabaseServer and OpenAI client
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> }
) {
  // TODO(agent): Implement project creation from meeting notes using supabaseServer
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
