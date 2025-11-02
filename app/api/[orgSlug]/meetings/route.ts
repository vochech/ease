import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params;
    const body = await req.json();
    const {
      title,
      project_id,
      start_time,
      end_time,
      description,
      location,
      meeting_link,
      participant_ids,
    } = body as {
      title: string;
      project_id?: string;
      start_time: string;
      end_time?: string;
      description?: string;
      location?: string;
      meeting_link?: string;
      participant_ids?: string[];
    };

    if (!title || !start_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve org
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Create meeting
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        org_id: org.id,
        project_id: project_id || null,
        title,
        start_time,
        end_time: end_time || null,
        description: description || null,
        location: location || null,
        meeting_link: meeting_link || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (meetingError) {
      return NextResponse.json(
        { error: meetingError.message },
        { status: 400 },
      );
    }

    // Add participants
    if (Array.isArray(participant_ids) && participant_ids.length > 0) {
      const rows = participant_ids.map((uid) => ({
        meeting_id: meeting.id,
        user_id: uid,
        status: "pending",
      }));
      const { error: participantsError } = await supabase
        .from("meeting_participants")
        .insert(rows);
      if (participantsError) {
        console.error("Failed to add participants", participantsError);
      }
    }

    revalidatePath(`/${orgSlug}/calendar`, "page");
    return NextResponse.json({ ok: true, meeting });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
