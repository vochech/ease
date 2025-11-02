"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ControlBar,
  RoomAudioRenderer,
  useTracks,
  ParticipantTile,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { MeetingChat } from "@/components/meeting/meeting-chat";
import { MeetingAgendaPanel } from "@/components/meeting/meeting-agenda-panel";

type InAppMeetingProps = {
  orgSlug: string;
  meetingId: string;
  userId: string;
  userRole: "owner" | "manager" | "member";
};

export function InAppMeeting({
  orgSlug,
  meetingId,
  userId,
  userRole,
}: InAppMeetingProps) {
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [hostPresent, setHostPresent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [egressId, setEgressId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/${orgSlug}/meetings/${meetingId}/livekit-token`,
        );
        if (!res.ok) throw new Error("Failed to get token");
        const data = await res.json();
        if (!mounted) return;
        setToken(data.token);
        setWsUrl(data.wsUrl);
        setIsHost(Boolean(data.isHost));
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [orgSlug, meetingId]);

  // Simple waiting room: if not host, poll for host presence
  useEffect(() => {
    if (isHost) {
      setHostPresent(true);
      return;
    }
    let timer: any;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/${orgSlug}/meetings/${meetingId}/room-state`,
        );
        if (res.ok) {
          const data = await res.json();
          setHostPresent(Boolean(data.hostPresent));
        }
      } catch {}
      timer = setTimeout(poll, 4000);
    };
    poll();
    return () => clearTimeout(timer);
  }, [isHost, orgSlug, meetingId]);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
    { source: Track.Source.Microphone, withPlaceholder: true },
  ]);

  const canRender = useMemo(() => token && wsUrl, [token, wsUrl]);

  const startRecording = async () => {
    const res = await fetch(
      `/api/${orgSlug}/meetings/${meetingId}/recordings/start`,
      { method: "POST" },
    );
    if (res.ok) {
      const data = await res.json();
      setEgressId(data.egress?.egressId || data.egress?.egress_id || null);
    } else {
      alert("Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!egressId) return;
    const res = await fetch(
      `/api/${orgSlug}/meetings/${meetingId}/recordings/stop`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ egressId }),
      },
    );
    if (!res.ok) alert("Failed to stop recording");
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-120px)] items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-120px)] w-full">
      {!hostPresent && !isHost && (
        <div className="mb-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Waiting for host to join…
        </div>
      )}

      {canRender ? (
        <LiveKitRoom
          serverUrl={wsUrl!}
          token={token!}
          connect
          video
          audio
          className="h-full w-full rounded-lg border border-gray-200"
        >
          <RoomAudioRenderer />
          <div className="flex h-full">
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex-1">
                <GridLayout className="h-full" tracks={tracks}>
                  {tracks.map((t) => (
                    <ParticipantTile
                      key={`${t.participant.identity}-${t.source}`}
                      trackRef={t}
                    />
                  ))}
                </GridLayout>
              </div>
              <div className="border-t border-gray-200 p-2">
                <div className="flex items-center justify-between">
                  <ControlBar controls={{ chat: false, screenShare: true }} />
                  {isHost && (
                    <div className="flex gap-2">
                      <button
                        onClick={startRecording}
                        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        Start recording
                      </button>
                      <button
                        onClick={stopRecording}
                        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        Stop recording
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(
                              `/api/${orgSlug}/meetings/${meetingId}/messages`,
                            );
                            const data = await res.json();
                            const transcript = (data.messages || [])
                              .map((m: any) => `- ${m.content}`)
                              .join("\n");
                            const sres = await fetch(
                              `/api/${orgSlug}/meetings/${meetingId}/transcripts/summarize`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ transcript }),
                              },
                            );
                            if (!sres.ok) {
                              alert("Failed to summarize");
                              return;
                            }
                            alert("Summary saved to meeting notes");
                          } catch (e) {
                            console.error(e);
                            alert("Failed to summarize");
                          }
                        }}
                        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        Summarize chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex w-80 flex-col border-l border-gray-200">
              <div className="flex-1 overflow-y-auto">
                <MeetingAgendaPanel
                  orgSlug={orgSlug}
                  meetingId={meetingId}
                  userId={userId}
                  userRole={userRole}
                />
              </div>
              <div className="flex-1 border-t border-gray-200">
                <MeetingChat orgSlug={orgSlug} meetingId={meetingId} />
              </div>
            </div>
          </div>
        </LiveKitRoom>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-gray-500">
          Failed to load token
        </div>
      )}
    </div>
  );
}
