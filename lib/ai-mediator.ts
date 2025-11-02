/**
 * AI Mediator: Personality-aware communication intelligence
 * 
 * Adapts message tone, generates summaries, and provides empathetic
 * responses based on user personality, mood, and workload context.
 */

import { getOpenAI } from "./openaiClient";

// =============================================================================
// TYPES
// =============================================================================

export type PersonalityType = 
  | "analyst"    // INTJ, INTP - structured, logical
  | "diplomat"   // INFJ, ENFP - empathetic, warm
  | "sentinel"   // ESTJ, ISFJ - practical, procedural
  | "explorer";  // ESFP, ENTP - spontaneous, creative

export type MoodLevel = "high" | "neutral" | "low";
export type WorkloadLevel = "light" | "moderate" | "high" | "overwhelmed";
export type StressLevel = "calm" | "focused" | "stressed" | "critical";

export interface UserContext {
  userId: string;
  personality?: PersonalityType;
  mood?: MoodLevel;
  workload?: WorkloadLevel;
  stress?: StressLevel;
  energyLevel?: number; // 0-100
}

export interface ToneAnalysis {
  clarity: number;      // 0-1: How clear/understandable
  empathy: number;      // 0-1: Emotional awareness
  urgency: number;      // 0-1: Time sensitivity
  supportiveness: number; // 0-1: Encouraging vs. directive
  formality: number;    // 0-1: Casual vs. formal
}

export interface MessageSentiment {
  label: "positive" | "neutral" | "negative" | "supportive" | "concerned" | "excited" | "stressed";
  confidence: number; // 0-1
}

// =============================================================================
// PERSONALITY STYLE GUIDES
// =============================================================================

const PERSONALITY_STYLES: Record<PersonalityType, {
  description: string;
  writingStyle: string;
  preferredTone: string;
  examplePhrases: string[];
}> = {
  analyst: {
    description: "Structured, logical, data-driven thinkers",
    writingStyle: "Concise, precise, with supporting data",
    preferredTone: "Direct, minimal, objective",
    examplePhrases: [
      "Based on the data...",
      "The logical next step is...",
      "Here's what the numbers show...",
      "Let's break this down systematically",
    ],
  },
  diplomat: {
    description: "Empathetic, metaphorical, people-focused",
    writingStyle: "Warm, encouraging, with emotional awareness",
    preferredTone: "Supportive, collaborative, nuanced",
    examplePhrases: [
      "I hear what you're saying...",
      "Let's explore this together...",
      "How does this feel to the team?",
      "What if we reframe this as...",
    ],
  },
  sentinel: {
    description: "Practical, procedural, reliable",
    writingStyle: "Clear, actionable, step-by-step",
    preferredTone: "Firm, organized, dependable",
    examplePhrases: [
      "Here's the plan...",
      "First, we need to...",
      "The standard approach is...",
      "Let's stay on track with...",
    ],
  },
  explorer: {
    description: "Spontaneous, creative, energetic",
    writingStyle: "Lively, experimental, conversational",
    preferredTone: "Playful, innovative, dynamic",
    examplePhrases: [
      "What if we try...",
      "Here's a wild idea...",
      "Let's experiment with...",
      "This could be really exciting if...",
    ],
  },
};

// =============================================================================
// TONE ANALYSIS
// =============================================================================

/**
 * Analyze message tone using OpenAI
 */
export async function analyzeMessageTone(message: string): Promise<ToneAnalysis> {
  try {
  const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a tone analysis expert. Analyze the following message and rate it on these dimensions (0-1 scale):
- clarity: How clear and understandable is the message?
- empathy: Does it show emotional awareness and consideration?
- urgency: How time-sensitive or pressing is the message?
- supportiveness: Is it encouraging vs. directive?
- formality: Is it casual or formal in tone?

Respond ONLY with JSON: { "clarity": 0.8, "empathy": 0.6, "urgency": 0.3, "supportiveness": 0.7, "formality": 0.4 }`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content) as ToneAnalysis;
  } catch (error) {
    console.error("[AI Mediator] Tone analysis error:", error);
    // Return neutral defaults
    return {
      clarity: 0.5,
      empathy: 0.5,
      urgency: 0.5,
      supportiveness: 0.5,
      formality: 0.5,
    };
  }
}

/**
 * Detect message sentiment
 */
export async function detectSentiment(message: string): Promise<MessageSentiment> {
  try {
  const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Classify the sentiment of the following message. Choose ONE label:
- positive: upbeat, optimistic
- neutral: factual, balanced
- negative: critical, pessimistic
- supportive: encouraging, helpful
- concerned: worried, cautious
- excited: enthusiastic, energetic
- stressed: anxious, overwhelmed

Respond ONLY with JSON: { "label": "supportive", "confidence": 0.85 }`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.2,
      max_tokens: 50,
    });

    const content = response.choices[0]?.message?.content || '{"label":"neutral","confidence":0.5}';
    return JSON.parse(content) as MessageSentiment;
  } catch (error) {
    console.error("[AI Mediator] Sentiment detection error:", error);
    return { label: "neutral", confidence: 0.5 };
  }
}

// =============================================================================
// PERSONALITY-AWARE ADAPTATION
// =============================================================================

/**
 * Generate adaptive reply based on user context
 */
export async function generateAdaptiveReply(
  message: string,
  context: UserContext
): Promise<string> {
  const personality = context.personality || "diplomat";
  const style = PERSONALITY_STYLES[personality];

  let systemPrompt = `You are an AI communication assistant for Ease Talk.
Generate a helpful, context-aware reply to the following message.

User personality: ${personality.toUpperCase()} (${style.description})
Writing style: ${style.writingStyle}
Preferred tone: ${style.preferredTone}

`;

  // Adapt based on mood
  if (context.mood === "low") {
    systemPrompt += `⚠️ User mood is LOW. Be extra empathetic, gentle, and offer simplification.\n`;
  } else if (context.mood === "high") {
    systemPrompt += `✅ User mood is HIGH. Match their energy and momentum.\n`;
  }

  // Adapt based on workload
  if (context.workload === "overwhelmed" || context.workload === "high") {
    systemPrompt += `⚠️ User workload is ${context.workload?.toUpperCase()}. Keep replies SHORT and actionable.\n`;
  }

  // Adapt based on stress
  if (context.stress === "stressed" || context.stress === "critical") {
    systemPrompt += `⚠️ User stress is ${context.stress?.toUpperCase()}. Focus on calm, one-step-at-a-time guidance.\n`;
  }

  systemPrompt += `\nExample phrases you might use:\n${style.examplePhrases.map((p) => `- "${p}"`).join("\n")}

Rules:
- Match the personality style naturally
- Keep responses under 150 words unless complexity requires more
- End with a reflective question when appropriate
- Avoid corporate jargon or empty positivity`;

  try {
  const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content || "I'm here to help. What would you like to discuss?";
  } catch (error) {
    console.error("[AI Mediator] Adaptive reply error:", error);
    return "I'm here to help. What would you like to discuss?";
  }
}

/**
 * Summarize long thread with personality awareness
 */
export async function summarizeThread(
  messages: Array<{ sender: string; content: string; timestamp: string }>,
  context: UserContext
): Promise<string> {
  const personality = context.personality || "diplomat";
  const style = PERSONALITY_STYLES[personality];

  const threadText = messages
    .map((m) => `[${m.timestamp}] ${m.sender}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are summarizing a conversation thread for a user with ${personality.toUpperCase()} personality.
${style.description}

Summarize the key points, decisions, and action items in a way that matches their communication style:
- ${style.writingStyle}
- ${style.preferredTone}

${context.workload === "high" || context.workload === "overwhelmed" 
  ? "⚠️ Keep it VERY brief (2-3 sentences max). User is overwhelmed."
  : "Keep it concise but complete (3-5 sentences)."}`;

  try {
  const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Summarize this thread:\n\n${threadText}` },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || "Thread summary unavailable.";
  } catch (error) {
    console.error("[AI Mediator] Thread summary error:", error);
    return "Thread summary unavailable.";
  }
}

/**
 * Generate reflective questions (calm communication)
 */
export async function generateReflectiveQuestion(
  threadContext: string,
  userContext: UserContext
): Promise<string> {
  const personality = userContext.personality || "diplomat";

  const systemPrompt = `You are an AI facilitator for Ease Talk.
Generate a single reflective question that helps the team think deeper, rather than reacting quickly.

User personality: ${personality.toUpperCase()}
Context: ${threadContext}

Guidelines:
- Ask ONE open-ended question
- Focus on clarity, simplification, or decision-making
- Avoid yes/no questions
- Match the user's personality style (${PERSONALITY_STYLES[personality].preferredTone})

Examples:
- "What's the smallest next step we could take here?"
- "Does this approach feel aligned with our goal?"
- "Should we simplify this before moving forward?"
- "What assumptions are we making that we should challenge?"`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate a reflective question." },
      ],
      temperature: 0.8,
      max_tokens: 100,
    });

    return response.choices[0]?.message?.content || "What's the most important thing to focus on right now?";
  } catch (error) {
    console.error("[AI Mediator] Reflective question error:", error);
    return "What's the most important thing to focus on right now?";
  }
}

// =============================================================================
// CONTEXT HELPERS
// =============================================================================

/**
 * Get adaptive greeting based on user state
 */
export function getAdaptiveGreeting(context: UserContext): string {
  const { personality, mood, workload, stress } = context;

  // High stress or overwhelm: calm and supportive
  if (stress === "critical" || workload === "overwhelmed") {
    return "Let's take this one step at a time. What's on your mind?";
  }

  if (stress === "stressed" || workload === "high") {
    return "I know things are busy. How can I help right now?";
  }

  // Low mood: gentle and encouraging
  if (mood === "low") {
    return "I'm here to help. What would be most useful for you today?";
  }

  // High energy: match momentum
  if (mood === "high") {
    return "Great energy today! What are we tackling?";
  }

  // Default: personality-based
  switch (personality) {
    case "analyst":
      return "What do you need clarity on?";
    case "diplomat":
      return "How can I support you today?";
    case "sentinel":
      return "What's the priority right now?";
    case "explorer":
      return "What are we exploring today?";
    default:
      return "How can I help?";
  }
}

/**
 * Suggest message adjustments for better communication
 */
export function suggestMessageImprovements(
  message: string,
  tone: ToneAnalysis,
  context: UserContext
): string[] {
  const suggestions: string[] = [];

  // Low clarity
  if (tone.clarity < 0.4) {
    suggestions.push("Consider simplifying or breaking this into shorter sentences.");
  }

  // High urgency with stressed user
  if (tone.urgency > 0.7 && (context.stress === "stressed" || context.stress === "critical")) {
    suggestions.push("This message feels urgent. Consider a calmer approach if possible.");
  }

  // Low empathy with low mood recipient
  if (tone.empathy < 0.3 && context.mood === "low") {
    suggestions.push("This might feel a bit direct. Add a supportive phrase if appropriate.");
  }

  // Too formal with explorer personality
  if (tone.formality > 0.7 && context.personality === "explorer") {
    suggestions.push("This feels formal. Explorers prefer casual, conversational tone.");
  }

  return suggestions;
}
