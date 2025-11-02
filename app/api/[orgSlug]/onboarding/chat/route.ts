import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Message = {
  role: "assistant" | "user";
  content: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
    const { messages, userEmail } = await req.json();

    const supabase = await supabaseServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("slug", orgSlug)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Build conversation context for AI
    const conversationHistory = messages.map((m: Message) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    // Check if profile was pre-filled by manager
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("org_id", org.id)
      .single();

    const isPrefilled = !!existingProfile?.onboarding_prefilled_at;

    // AI system prompt (different based on prefill status)
    const systemPrompt = isPrefilled
      ? `Jsi AI onboarding asistent pro ${
          org.name
        }. Tvůj manažer už předvyplnil tvůj profil, takže jen potvrdíš údaje a doplníš aktuální náladu.

PŘEDVYPLNĚNÉ ÚDAJE:
- Jméno: ${existingProfile.full_name || "neznámé"}
- Pozice: ${existingProfile.position_title || "neznámá"} (${
          existingProfile.role_level || "mid"
        })
- Dovednosti: ${existingProfile.skills?.join(", ") || "neuvedeno"}
- Roky praxe: ${existingProfile.years_of_experience || 0}
- Hodin týdně: ${existingProfile.working_hours_per_week || 40}

TVŮJ ÚKOL:
1. **Pozdrav** a řekni, že manažer už profil připravil
2. **Zeptej se na náladu a stres** (1-10)
3. **Krátce potvrď údaje** - jsou správné? Chtěl by něco změnit?
4. **Dokončit** - Hotovo! Jdeme na to.

PRAVIDLA:
- Buď přátelský a neformální (tykání)
- Tohle je RYCHLÉ potvrzení, ne výslech
- Max 2-3 výměny zpráv
- Emoji pro lepší náladu 😊
- Nezmiňuj databáze ani technické věci

KONVERZACE:
${conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join("\n")}

Odpověz ve formátu JSON:`
      : `Jsi AI onboarding asistent pro ${
          org.name
        }. Tvůj profil zatím nebyl předvyplněný, tak si projdeme základní informace.

INFORMACE K ZÍSKÁNÍ:
1. **Nálada a stres**: Jak se dnes cítíš? (1-10)
2. **Jméno**: Celé jméno a přezdívka
3. **Role**: Junior/Mid/Senior? Jaká pozice?
4. **Dovednosti**: Jaké technologie ovládáš?
5. **Praxe**: Kolik let zkušeností?
6. **Pracovní styl**: Samostatný/týmový? Kolik hodin týdně?

PRAVIDLA:
- Přátelský a neformální (tykání)
- Ptej se na 1-2 věci najednou
- Používej emoji 😊
- Potvrzuj získané info
- Když máš všechno, řekni "Jsme hotovi!"

KONVERZACE:
${conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join("\n")}

Odpověz ve formátu JSON:`;
    /*
    Příklad očekávaného JSON výstupu:
    {
      "message": "Tvoje další zpráva uživateli",
      "completed": true,
      "extracted_data": {
        "full_name": "Jan Novák",
        "display_name": "Honza",
        "role_level": "mid",
        "position_title": "Frontend Developer",
        "skills": ["React", "TypeScript"],
        "years_of_experience": 4,
        "working_hours_per_week": 40,
        "preferred_work_style": "collaborative",
        "current_capacity_percentage": 80,
        "is_available_for_tasks": true,
        "mood_score": 7,
        "stress_score": 4,
        "mood_emoji": ":)"
      }
    }
    */

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const aiResponse = JSON.parse(
      completion.choices[0].message.content || "{}"
    );

    // If completed, save to database
    if (aiResponse.completed && aiResponse.extracted_data) {
      const data = aiResponse.extracted_data;

      // Save user profile
      const profileData: any = {
        user_id: user.id,
        org_id: org.id,
        onboarding_completed_at: new Date().toISOString(),
      };

      if (data.full_name) profileData.full_name = data.full_name;
      if (data.display_name) profileData.display_name = data.display_name;
      if (data.role_level) profileData.role_level = data.role_level;
      if (data.position_title) profileData.position_title = data.position_title;
      if (data.skills) profileData.skills = data.skills;
      if (data.years_of_experience !== null)
        profileData.years_of_experience = data.years_of_experience;
      if (data.working_hours_per_week !== null)
        profileData.working_hours_per_week = data.working_hours_per_week;
      if (data.preferred_work_style)
        profileData.preferred_work_style = data.preferred_work_style;
      if (data.current_capacity_percentage !== null)
        profileData.current_capacity_percentage =
          data.current_capacity_percentage;
      if (data.is_available_for_tasks !== null)
        profileData.is_available_for_tasks = data.is_available_for_tasks;
      if (data.employment_status)
        profileData.employment_status = data.employment_status;

      await supabase.from("user_profiles").upsert(profileData, {
        onConflict: "user_id,org_id",
      });

      // Save mood check-in
      if (data.mood_score) {
        await supabase.from("subjective_checkins").insert({
          user_id: user.id,
          org_id: org.id,
          metric: "mood",
          score: data.mood_score,
          mood_emoji: data.mood_emoji || null,
          comment: "Onboarding check-in",
        });
      }

      // Save stress check-in
      if (data.stress_score) {
        await supabase.from("subjective_checkins").insert({
          user_id: user.id,
          org_id: org.id,
          metric: "stress",
          score: data.stress_score,
          comment: "Onboarding check-in",
        });
      }
    }

    return NextResponse.json({
      message: aiResponse.message,
      completed: aiResponse.completed || false,
    });
  } catch (error) {
    console.error("Onboarding chat error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
