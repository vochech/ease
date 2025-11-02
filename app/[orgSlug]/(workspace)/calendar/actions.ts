"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabaseServer";

export async function updateTaskDueDate(taskId: string, newDate: string) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Update task due date
  const { error } = await supabase
    .from("tasks")
    .update({ due_date: newDate })
    .eq("id", taskId);

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  // Revalidate calendar page
  revalidatePath("/[orgSlug]/calendar", "page");
}

export async function createMeeting(
  orgSlug: string,
  data: {
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    meeting_link: string;
    participant_ids: string[];
  },
) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get org
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    throw new Error("Organization not found");
  }

  // Create meeting
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .insert({
      org_id: org.id,
      title: data.title,
      description: data.description,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location,
      meeting_link: data.meeting_link,
      created_by: user.id,
    })
    .select()
    .single();

  if (meetingError) {
    throw new Error(`Failed to create meeting: ${meetingError.message}`);
  }

  // Add participants
  if (data.participant_ids.length > 0) {
    const participants = data.participant_ids.map((userId) => ({
      meeting_id: meeting.id,
      user_id: userId,
      status: "pending",
    }));

    const { error: participantsError } = await supabase
      .from("meeting_participants")
      .insert(participants);

    if (participantsError) {
      console.error("Failed to add participants:", participantsError);
    }
  }

  revalidatePath("/[orgSlug]/calendar", "page");
}

export async function updateMeetingStatus(meetingId: string, status: string) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("meeting_participants")
    .update({ status })
    .eq("meeting_id", meetingId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }

  revalidatePath("/[orgSlug]/calendar", "page");
}

export async function deleteMeeting(meetingId: string) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", meetingId);

  if (error) {
    throw new Error(`Failed to delete meeting: ${error.message}`);
  }

  revalidatePath("/[orgSlug]/calendar", "page");
}
