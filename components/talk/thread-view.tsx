"use client";

import { useEffect, useState, useRef } from "react";

interface Message {
  id: string;
  sender_id: string;
  message: string;
  sentiment: string | null;
  tone_analysis: {
    clarity?: number;
    empathy?: number;
    urgency?: number;
  } | null;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  reactions: Array<{ user_id: string; reaction: string }>;
}

interface ThreadViewProps {
  threadId: string;
  orgSlug: string;
  currentUserId: string;
}

export function ThreadView({ threadId, orgSlug, currentUserId }: ThreadViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [threadId]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/${orgSlug}/talk/messages?thread_id=${threadId}`
      );
      const data = await res.json();
      setMessages(data.messages || []);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("[ThreadView] Load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
      case "excited":
      case "supportive":
        return "text-green-600";
      case "negative":
      case "stressed":
        return "text-red-600";
      case "concerned":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-gray-500">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-4xl">💬</div>
          <div className="text-sm text-gray-500">
            No messages yet. Start the conversation!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-8 py-6">
      <div className="space-y-6">
        {messages.map((msg, idx) => {
          const isOwn = msg.sender_id === currentUserId;
          const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;
          const showName = showAvatar;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              {showAvatar ? (
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                    isOwn ? "bg-gray-900" : "bg-blue-500"
                  }`}
                >
                  {(msg.profiles.full_name || msg.profiles.email)[0].toUpperCase()}
                </div>
              ) : (
                <div className="h-9 w-9 flex-shrink-0" />
              )}

              {/* Message Content */}
              <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                {/* Name & Time */}
                {showName && (
                  <div className={`mb-1 flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <span className="text-sm font-medium text-gray-900">
                      {msg.profiles.full_name || msg.profiles.email}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(msg.created_at)}
                    </span>
                    {msg.sentiment && (
                      <span
                        className={`text-xs font-medium ${getSentimentColor(
                          msg.sentiment
                        )}`}
                      >
                        {msg.sentiment}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`inline-block max-w-2xl rounded-2xl px-4 py-3 ${
                    isOwn
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  style={{
                    fontFamily: "Inter, -apple-system, sans-serif",
                    fontSize: "15px",
                    lineHeight: "1.5",
                  }}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                </div>

                {/* Tone Analysis (for own messages) */}
                {isOwn && msg.tone_analysis && (
                  <div className="mt-1 flex items-center justify-end gap-2">
                    {msg.tone_analysis.clarity !== undefined && msg.tone_analysis.clarity > 0.7 && (
                      <div className="text-xs text-gray-400">✓ Clear</div>
                    )}
                    {msg.tone_analysis.empathy !== undefined && msg.tone_analysis.empathy > 0.7 && (
                      <div className="text-xs text-gray-400">♥ Empathetic</div>
                    )}
                  </div>
                )}

                {/* Reactions */}
                {msg.reactions.length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    {Array.from(
                      new Set(msg.reactions.map((r) => r.reaction))
                    ).map((reaction) => {
                      const count = msg.reactions.filter(
                        (r) => r.reaction === reaction
                      ).length;
                      return (
                        <button
                          key={reaction}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                        >
                          <span>{reaction}</span>
                          <span className="text-gray-600">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
