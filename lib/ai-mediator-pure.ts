// Pure helpers from AI mediator that are safe on the client
// No OpenAI or server-only imports here.

export type PersonalityType = "analyst" | "diplomat" | "sentinel" | "explorer";
export type MoodLevel = "high" | "neutral" | "low";
export type WorkloadLevel = "light" | "moderate" | "high" | "overwhelmed";
export type StressLevel = "calm" | "focused" | "stressed" | "critical";

export type ToneAnalysis = {
  clarity: number;
  empathy: number;
  urgency: number;
  supportiveness: number;
  formality: number;
};

export interface UserContext {
  userId: string;
  personality?: PersonalityType;
  mood?: MoodLevel;
  workload?: WorkloadLevel;
  stress?: StressLevel;
  energyLevel?: number; // 0-100
}

export function getAdaptiveGreeting(context: UserContext): string {
  const name = context.userId ? "" : ""; // keep minimal, UI usually adds name from session
  const mood = context.mood || "neutral";
  const workload = context.workload || "moderate";

  if (mood === "low") return `Ahoj${name ? ` ${name}` : ""} – klidně zvol pomalejší tempo, jsem tu, když budeš něco potřebovat.`;
  if (workload === "overwhelmed") return `Držím palce – pojďme to zjednodušit a krokovat.`;
  return `Ahoj${name ? ` ${name}` : ""}!`;
}

export function suggestMessageImprovements(
  message: string,
  tone: ToneAnalysis,
  context: UserContext,
): string[] {
  const suggestions: string[] = [];

  if (tone.clarity < 0.5) {
    suggestions.push("Zkrať věty a zvýrazni hlavní bod v první větě.");
  }
  if (tone.empathy < 0.5 && (context.personality === "diplomat" || context.stress === "stressed")) {
    suggestions.push("Přidej větu uznání nebo poděkování pro zmírnění napětí.");
  }
  if (tone.urgency > 0.7) {
    suggestions.push("Zvaž, zda je nutné označit zprávu jako urgentní, ať nepůsobíme panicky.");
  }
  if (tone.formality > 0.8) {
    suggestions.push("Zjednoduš formální obraty, ať je to čitelnější.");
  }
  if (!/\?$/.test(message)) {
    suggestions.push("Zakonči otázkou, pokud očekáváš reakci (např. 'Je to v pořádku?').");
  }

  return suggestions.slice(0, 4);
}
