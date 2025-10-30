"use client";

import { useState } from "react";

export default function GoogleEventsClient() {
  const [events, setEvents] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startAuth() {
    setError(null);
    try {
      const res = await fetch("/api/google/auth/url");
      const json = await res.json();
      if (json.url) {
        // redirect to Google consent
        window.location.href = json.url;
      } else {
        setError(json.error || "Failed to get auth url");
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function loadEvents() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/google/calendar/events");
      if (!res.ok) {
        const json = await res.json();
        setError(json?.error || `HTTP ${res.status}`);
        setEvents(null);
      } else {
        const json = await res.json();
        setEvents(json.events || []);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
      setEvents(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={startAuth} className="rounded bg-blue-600 text-white px-3 py-1">Connect Google Calendar</button>
        <button onClick={loadEvents} className="rounded border px-3 py-1">Load Events</button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {events && (
        <ul className="space-y-2">
          {events.length === 0 && <li className="text-sm text-gray-500">No upcoming events</li>}
          {events.map((ev: any) => (
            <li key={ev.id} className="p-2 border rounded">
              <div className="font-medium">{ev.summary || "(No title)"}</div>
              <div className="text-sm text-gray-500">{ev.start?.dateTime || ev.start?.date || ""}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
