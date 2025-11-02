"use client";

import { useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type Props = {
  orgSlug: string;
  meetingId: string;
};

export function MeetingChat({ orgSlug, meetingId }: Props) {
  const room = useRoomContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/${orgSlug}/meetings/${meetingId}/messages`,
        );
        if (res.ok) {
          const data = await res.json();
          if (mounted) setMessages(data.messages || []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const onData = (payload: Uint8Array, participant?: any) => {
      try {
        const text = new TextDecoder().decode(payload);
        // naive: treat as plain text
        setMessages((prev) => [
          ...prev,
          {
            id: `rt-${Date.now()}`,
            user_id: participant?.identity || "",
            content: text,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch {}
    };

    room.on("dataReceived", onData);
    return () => {
      mounted = false;
      room.off("dataReceived", onData);
    };
  }, [orgSlug, meetingId, room]);

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    try {
      // send via LiveKit data channel
      await room.localParticipant.publishData(
        new TextEncoder().encode(content),
      );
      // persist to DB
      await fetch(`/api/${orgSlug}/meetings/${meetingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-200">
      <div className="flex items-center justify-between p-2">
        <h3 className="text-sm font-medium">Chat</h3>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2 text-sm">
        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500">No messages yet</div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className="rounded-md border border-gray-200 bg-white p-2"
            >
              <div className="text-xs text-gray-500">
                {new Date(m.created_at).toLocaleTimeString()}
              </div>
              <div className="text-gray-900">{m.content}</div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-gray-200 p-2">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Type a message…"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <button
            onClick={send}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
