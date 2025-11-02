"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "assistant" | "user";
  content: string;
};

type OnboardingChatProps = {
  orgSlug: string;
  orgName: string;
  userEmail: string;
};

export function OnboardingChat({
  orgSlug,
  orgName,
  userEmail,
}: OnboardingChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Ahoj a vítej v ${orgName}! 👋\n\nJsem tvůj AI asistent. Projdeme spolu rychlý onboarding - pokud tvůj manažer už připravil profil, jen to potvrdíme a zjistíme, jak se dnes cítíš. Pokud ne, projdeme to společně od začátku.\n\nJak se máš dnes? 😊`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);

    try {
      // Call onboarding API
      const response = await fetch(`/api/${orgSlug}/onboarding/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add assistant response
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.message },
      ]);

      // If onboarding is complete, redirect
      if (data.completed) {
        setIsCompleting(true);
        setTimeout(() => {
          router.push(`/${orgSlug}/dashboard`);
        }, 2000);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Omlouvám se, něco se pokazilo. Zkus to prosím znovu.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto flex h-[600px] flex-col rounded-2xl border border-gray-200 bg-white shadow-xl">
      {/* Chat messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-3">
              <div className="flex items-center gap-1">
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        {isCompleting && (
          <div className="flex justify-center">
            <div className="rounded-lg bg-green-50 border border-green-200 px-6 py-3">
              <p className="text-sm font-medium text-green-800">
                ✅ Hotovo! Přesměrovávám na dashboard...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Napiš svou odpověď..."
            disabled={isLoading || isCompleting}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isCompleting}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "..." : "Odeslat"}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 text-center">
          Stiskni Enter pro odeslání • Shift+Enter pro nový řádek
        </p>
      </div>
    </div>
  );
}
