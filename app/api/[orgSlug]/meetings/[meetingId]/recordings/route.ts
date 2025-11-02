import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> },
) {
  try {
    const { orgSlug, meetingId } = await params;
    const supabase = await supabaseServer();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recordings for this meeting
    const { data: recordings, error } = await supabase
      .from("meeting_recordings")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch recordings:", error);
      return NextResponse.json(
        { error: "Failed to fetch recordings" },
        { status: 500 },
      );
    }

    // Generate signed URLs for private bucket
    const recordingsWithUrls = await Promise.all(
      (recordings || []).map(async (recording) => {
        const { data: urlData } = await supabase.storage
          .from("recordings")
          .createSignedUrl(recording.storage_path, 3600); // 1 hour

        return {
          ...recording,
          url: urlData?.signedUrl || null,
        };
      }),
    );

    return NextResponse.json(recordingsWithUrls);
  } catch (err) {
    console.error("Recordings API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
