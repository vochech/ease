import "server-only";
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OpenAI API key missing. Set OPENAI_API_KEY in .env.local");
}

// Create OpenAI client with optional org ID
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

// Example: Generate text with GPT-4
export async function generateText(prompt: string) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-1106-preview",
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate text");
  }
}
