"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = { role: "assistant" | "user"; content: string };

type DailyCheckinChatProps = {
  orgSlug: string;
};

type CheckinPayload = {
  mood_score: number;
  stress_score: number;
  energy_level: number;
  external_stressors: string[];
  wants_lighter_day: boolean;
  wants_day_off: boolean;
  notes: string | null;
};

const assistant = (text: string): Message => ({ role: "assistant", content: text });

export function DailyCheckinChat({ orgSlug }: DailyCheckinChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    assistant(
      "Ahoj! Než začneme, uděláme si krátký denní check‑in. Zabere to minutu a pomůže mi doporučit ti práci na dnešek."
    ),
    assistant("Na škále 1–10, jaká je dnes tvoje nálada? (1 = špatná, 10 = výborná)")
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<number>(0);
  const [data, setData] = useState<CheckinPayload>({
    mood_score: 5,
    stress_score: 5,
    energy_level: 5,
    external_stressors: [],
    wants_lighter_day: false,
    wants_day_off: false,
    notes: null,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function parseInteger1to10(value: string): number | null {
    const n = Number(value.trim());
    if (!Number.isFinite(n)) return null;
    if (n < 1 || n > 10) return null;
    return Math.floor(n);
  }

  async function handleSend() {
    if (!input.trim() || isLoading || isSubmitting) return;
    const userText = input.trim();
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: "user", content: userText }]);

    const next = async () => {
      switch (step) {
        case 0: {
          const n = parseInteger1to10(userText);
          if (n == null) {
            setMessages((prev) => [
              ...prev,
              assistant("Prosím odpověz číslem 1–10. Jaká je tvoje nálada?")
            ]);
            break;
          }
          setData((d) => ({ ...d, mood_score: n }));
          setMessages((prev) => [
            ...prev,
            assistant("Díky! A teď stres – 1–10? (1 = žádný, 10 = vysoký)")
          ]);
          setStep(1);
          break;
        }
        case 1: {
          const n = parseInteger1to10(userText);
          if (n == null) {
            setMessages((prev) => [
              ...prev,
              assistant("Prosím číslo 1–10: jak moc stres dnes cítíš?")
            ]);
            break;
          }
          setData((d) => ({ ...d, stress_score: n }));
          setMessages((prev) => [
            ...prev,
            assistant("Super. Jaká je tvoje energie 1–10? (1 = minimální, 10 = plná)")
          ]);
          setStep(2);
          break;
        }
        case 2: {
          const n = parseInteger1to10(userText);
          if (n == null) {
            setMessages((prev) => [
              ...prev,
              assistant("Prosím číslo 1–10: kolik máš dnes energie?")
            ]);
            break;
          }
          setData((d) => ({ ...d, energy_level: n }));
          setMessages((prev) => [
            ...prev,
            assistant(
              "Má něco, co tě dnes rozptyluje? Napiš odděleně čárkami z: traffic, health, family, personal, none."
            )
          ]);
          setStep(3);
          break;
        }
        case 3: {
          const raw = userText.toLowerCase();
          const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
          const mapped = parts.includes("none") ? [] : parts.filter((p) => ["traffic","health","family","personal"].includes(p));
          setData((d) => ({ ...d, external_stressors: mapped }));
          setMessages((prev) => [
            ...prev,
            assistant("Chceš dnes raději lehčí den? (ano/ne)")
          ]);
          setStep(4);
          break;
        }
        case 4: {
          const val = ["a","ano","y","yes"].includes(userText.trim().toLowerCase());
          setData((d) => ({ ...d, wants_lighter_day: val }));
          setMessages((prev) => [
            ...prev,
            assistant("Chceš požádat o den volna? (ano/ne)")
          ]);
          setStep(5);
          break;
        }
        case 5: {
          const val = ["a","ano","y","yes"].includes(userText.trim().toLowerCase());
          setData((d) => ({ ...d, wants_day_off: val }));
          setMessages((prev) => [
            ...prev,
            assistant("Poslední věc – chceš přidat krátkou poznámku? (napiš nebo 'ne')")
          ]);
          setStep(6);
          break;
        }
        case 6: {
          const note = userText.toLowerCase().trim();
          setData((d) => ({ ...d, notes: note === "ne" ? null : userText }));
          // Submit
          setIsSubmitting(true);
          try {
            const res = await fetch(`/api/${orgSlug}/analytics/daily-checkin`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...data, notes: note === "ne" ? null : userText }),
            });
            if (!res.ok) throw new Error("Check-in submit failed");
            setMessages((prev) => [
              ...prev,
              assistant("Hotovo, díky! Přesměrovávám tě na dashboard…")
            ]);
            setTimeout(() => router.push(`/${orgSlug}/dashboard`), 1200);
          } catch (e) {
            console.error(e);
            setMessages((prev) => [
              ...prev,
              assistant("Něco se nepovedlo. Zkus to prosím znovu odeslat.")
            ]);
          } finally {
            setIsSubmitting(false);
          }
          break;
        }
      }
    };

    await next();
    setIsLoading(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="mx-auto flex h-[600px] w-full max-w-2xl flex-col rounded-2xl border border-gray-200 bg-white shadow-xl">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Napiš odpověď…"
            disabled={isLoading || isSubmitting}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            rows={2}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isLoading || isSubmitting}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSubmitting ? "Odesílám…" : isLoading ? "…" : "Odeslat"}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-gray-500">Enter = odeslat • Shift+Enter = nový řádek</p>
      </div>
    </div>
  );
}
