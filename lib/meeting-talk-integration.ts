/**
 * Meeting Integration for Ease Talk
 * 
 * Automatically creates Talk threads after meetings end
 * and inserts AI-generated summary as first message.
 */

import { supabaseClient } from "./supabaseClient";
import { summarizeThread } from "./ai-mediator";

interface MeetingEndData {
  meetingId: string;
  orgId: string;
  title: string;
  transcript?: string;
  recordingUrl?: string;
  participants: Array<{ id: string; name: string }>;
}

/**
 * Called when a meeting ends
 */
export async function onMeetingEnd(data: MeetingEndData): Promise<void> {
  try {
    console.log("[Talk Integration] Meeting ended:", data.meetingId);

    // Check if Talk space already exists for this meeting
    const { data: existingSpace } = await supabaseClient
      .from("talk_spaces")
      .select("id")
      .eq("space_type", "meeting")
      .eq("space_ref_id", data.meetingId)
      .single();

    let spaceId: string;

    if (existingSpace) {
      spaceId = existingSpace.id;
    } else {
      // Create new Talk space for meeting
      const { data: newSpace, error: spaceError } = await supabaseClient
        .from("talk_spaces")
        .insert({
          org_id: data.orgId,
          space_type: "meeting",
          space_ref_id: data.meetingId,
          title: data.title,
          description: "Meeting discussion and follow-ups",
        })
        .select()
        .single();

      if (spaceError || !newSpace) {
        console.error("[Talk Integration] Failed to create space:", spaceError);
        return;
      }

      spaceId = newSpace.id;
    }

    // Generate AI summary from transcript
    let aiSummary = "Meeting completed. Add your notes and follow-ups here.";
    
    if (data.transcript) {
      try {
        // Parse transcript into messages format
        const messages = data.transcript.split("\n").map((line) => {
          const match = line.match(/^(.*?):\s*(.*)$/);
          if (match) {
            return {
              sender: match[1],
              content: match[2],
              timestamp: new Date().toISOString(),
            };
          }
          return null;
        }).filter(Boolean) as Array<{ sender: string; content: string; timestamp: string }>;

        if (messages.length > 0) {
          aiSummary = await summarizeThread(messages, {
            userId: "system",
            personality: "diplomat", // Warm, encouraging tone for summaries
          });
        }
      } catch (error) {
        console.error("[Talk Integration] AI summary failed:", error);
      }
    }

    // Create thread with summary
    const { data: thread, error: threadError } = await supabaseClient
      .from("talk_threads")
      .insert({
        space_id: spaceId,
        title: `Meeting Summary: ${data.title}`,
        context_summary: `Automatic summary from meeting on ${new Date().toLocaleDateString()}`,
      })
      .select()
      .single();

    if (threadError || !thread) {
      console.error("[Talk Integration] Failed to create thread:", threadError);
      return;
    }

    // Post AI summary as first message
    const { error: messageError } = await supabaseClient
      .from("talk_messages")
      .insert({
        thread_id: thread.id,
        sender_id: "00000000-0000-0000-0000-000000000000", // System user
        message: `**Meeting Summary**\n\n${aiSummary}\n\n${
          data.recordingUrl
            ? `📹 [View Recording](${data.recordingUrl})\n\n`
            : ""
        }**Participants:** ${data.participants.map((p) => p.name).join(", ")}\n\nFeel free to add follow-ups and action items below.`,
        sentiment: "neutral",
        context_tags: ["meeting-summary", "auto-generated"],
      });

    if (messageError) {
      console.error("[Talk Integration] Failed to post summary:", messageError);
      return;
    }

    // Add thread context linking to meeting
    await supabaseClient.from("talk_thread_context").insert({
      thread_id: thread.id,
      context_type: "meeting",
      context_id: data.meetingId,
      context_metadata: {
        recording_url: data.recordingUrl,
        participant_count: data.participants.length,
      },
    });

    // Add participants to thread
    const participantInserts = data.participants.map((p) => ({
      thread_id: thread.id,
      user_id: p.id,
    }));

    await supabaseClient.from("talk_participants").insert(participantInserts);

    console.log("[Talk Integration] Successfully created thread:", thread.id);
  } catch (error) {
    console.error("[Talk Integration] Unexpected error:", error);
  }
}

/**
 * Hook to call from meeting room component
 */
export function useMeetingTalkIntegration() {
  const handleMeetingEnd = async (meetingData: MeetingEndData) => {
    await onMeetingEnd(meetingData);
  };

  return { handleMeetingEnd };
}
