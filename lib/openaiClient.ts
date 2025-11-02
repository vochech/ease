import "server-only";
import OpenAI from "openai";

/**
 * Lazily create OpenAI client.
 * - Does NOT throw at import time (so Next build won't fail without env vars)
 * - Throws only when actually used and API key is missing
 */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OpenAI API key missing. Set OPENAI_API_KEY in environment to use AI features."
    );
  }
  return new OpenAI({
    apiKey,
    organization: process.env.OPENAI_ORG_ID,
  });
}

// Example: Generate text with GPT-4
export async function generateText(prompt: string) {
  try {
    const completion = await getOpenAI().chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-1106-preview",
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate text");
  }
}
