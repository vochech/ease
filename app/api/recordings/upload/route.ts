import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const meetingId = formData.get("meetingId") as string | null;
    const orgSlug = formData.get("orgSlug") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!meetingId || !orgSlug) {
      return NextResponse.json(
        { error: "meetingId and orgSlug required" },
        { status: 400 },
      );
    }

    // For health test, use service role client (bypasses RLS)
    const isHealthTest = meetingId === "health-test";

    let supabase;
    if (isHealthTest) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      console.log("Health test upload - Using service role");
      console.log("Supabase URL:", supabaseUrl);
      console.log("Service key exists:", !!supabaseKey);

      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
    } else {
      supabase = await supabaseServer();
    }

    if (!isHealthTest) {
      // Check authentication for real meetings
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verify user has access to this meeting/org
      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .select("id, org_id")
        .eq("id", meetingId)
        .single();

      if (meetingError || !meeting) {
        return NextResponse.json(
          { error: "Meeting not found" },
          { status: 404 },
        );
      }

      // Check org membership
      const { data: membership } = await supabase
        .from("org_members")
        .select("role")
        .eq("org_id", meeting.org_id)
        .eq("user_id", session.user.id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Generate filename: org/meeting-id/recording-timestamp.webm
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "webm";
    const filepath = `${orgSlug}/${meetingId}/recording-${timestamp}.${extension}`;

    // Upload to Supabase Storage
    console.log("Attempting upload to bucket: recordings");
    console.log("File path:", filepath);
    console.log("File size:", file.size);

    const { data, error: uploadError } = await supabase.storage
      .from("recordings")
      .upload(filepath, file, {
        contentType: file.type || "audio/webm",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      console.error("Full error object:", JSON.stringify(uploadError, null, 2));
      return NextResponse.json(
        { error: "Upload failed", details: uploadError.message },
        { status: 500 },
      );
    }

    console.log("Upload successful:", data);

    // Get public URL (or signed URL for private bucket)
    const { data: urlData } = supabase.storage
      .from("recordings")
      .getPublicUrl(filepath);

    // Save recording metadata to database (skip for health test)
    if (!isHealthTest) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error: dbError } = await supabase
        .from("meeting_recordings")
        .insert({
          meeting_id: meetingId,
          storage_path: filepath,
          file_size: file.size,
          duration_seconds: null,
          created_by: session?.user.id || null,
        });

      if (dbError) {
        console.error("Database error:", dbError);
        // File uploaded but metadata save failed - non-fatal
      }
    }

    return NextResponse.json({
      ok: true,
      path: filepath,
      url: urlData.publicUrl,
      size: file.size,
    });
  } catch (err) {
    console.error("Recording upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
