import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> },
) {
  const { meetingId } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    transcript: string;
    agendaItems?: Array<{
      id: string;
      title: string;
      description?: string;
      completed: boolean;
    }>;
  };

  if (!body.transcript) {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }

  try {
    // Extract notes and detect completed agenda items
    const { notes, completedItemIds, agendaNotes } = extractNotesFromTranscript(
      body.transcript,
      body.agendaItems || [],
    );

    // Auto-complete agenda items that were discussed
    if (completedItemIds.length > 0 && body.agendaItems) {
      for (const itemId of completedItemIds) {
        const item = body.agendaItems.find((i) => i.id === itemId);
        if (item && !item.completed) {
          // Mark as completed
          await supabase
            .from("meeting_agenda_items")
            .update({ completed: true })
            .eq("id", itemId);

          console.log(`✅ Auto-completed agenda item: "${item.title}"`);
        }
      }
    }

    // Save to database
    const { data, error } = await supabase
      .from("meeting_notes")
      .insert({
        meeting_id: meetingId,
        content: notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      notes: data,
      completedItems: completedItemIds,
      agendaNotes,
    });
  } catch (error) {
    console.error("Failed to generate notes:", error);
    return NextResponse.json(
      { error: "Failed to generate notes" },
      { status: 500 },
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; meetingId: string }> },
) {
  const { meetingId } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("meeting_notes")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ notes: data });
}

// AI-powered note extraction with agenda item detection
function extractNotesFromTranscript(
  transcript: string,
  agendaItems: Array<{
    id: string;
    title: string;
    description?: string;
    completed: boolean;
  }>,
): {
  notes: string;
  completedItemIds: string[];
  agendaNotes: Record<string, string>;
} {
  const sentences = transcript
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);
  const transcriptLower = transcript.toLowerCase();

  // Detect which agenda items were discussed
  const completedItemIds: string[] = [];
  const agendaNotes: Record<string, string> = {};

  for (const item of agendaItems) {
    const titleWords = item.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const descWords =
      item.description
        ?.toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3) || [];
    const allWords = [...titleWords, ...descWords];

    // Check if agenda item is mentioned in transcript
    const matchCount = allWords.filter((word) =>
      transcriptLower.includes(word),
    ).length;
    const matchRatio = matchCount / Math.max(allWords.length, 1);

    // If >40% of key words match, consider it discussed
    if (matchRatio > 0.4) {
      // Find sentences related to this agenda item
      const relatedSentences = sentences.filter((s) => {
        const sLower = s.toLowerCase();
        return allWords.some((word) => sLower.includes(word));
      });

      if (relatedSentences.length > 0) {
        completedItemIds.push(item.id);
        agendaNotes[item.id] = relatedSentences.join(". ").trim();
      }
    }
  }

  // Extract action items (sentences with "musí", "budeme", "potřebujeme", etc.)
  const actionItems = sentences.filter((s) =>
    /\b(musí|budeme|potřebujeme|zajistíme|udělá|vyřeší|připraví|má za úkol)\b/i.test(
      s,
    ),
  );

  // Extract decisions (sentences with "rozhodli", "dohodli", "schválili", etc.)
  const decisions = sentences.filter((s) =>
    /\b(rozhodli|dohodli|schválili|odsouhlasili|rozhodnutí|dohoda)\b/i.test(s),
  );

  // Build notes
  let notes = "# Meeting Notes\n\n";

  // Agenda items discussed
  if (Object.keys(agendaNotes).length > 0) {
    notes += "## Agenda Items Discussed\n\n";
    for (const itemId of completedItemIds) {
      const item = agendaItems.find((i) => i.id === itemId);
      if (item) {
        notes += `### ✅ ${item.title}\n`;
        if (agendaNotes[itemId]) {
          notes += `${agendaNotes[itemId]}\n\n`;
        }
      }
    }
  }

  if (decisions.length > 0) {
    notes += "## Decisions\n";
    decisions.forEach((d) => {
      notes += `- ${d.trim()}\n`;
    });
    notes += "\n";
  }

  if (actionItems.length > 0) {
    notes += "## Action Items\n";
    actionItems.forEach((a) => {
      notes += `- ${a.trim()}\n`;
    });
    notes += "\n";
  }

  notes += "## Full Transcript\n";
  notes += transcript;

  return { notes, completedItemIds, agendaNotes };
}
