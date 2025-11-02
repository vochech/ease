"use client";

import { useState } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useMeetingRecorder } from "@/hooks/use-meeting-recorder";
// Optional styling for components; skipped in dev to avoid module resolution issues

export default function LiveKitHealthPage() {
  const [secret, setSecret] = useState("");
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleJoin = async () => {
    setError("");
    setStatus("Requesting token…");
    try {
      const res = await fetch(
        `/api/health/livekit?secret=${encodeURIComponent(secret)}`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data: { wsUrl: string; token: string } = await res.json();
      setServerUrl(data.wsUrl);
      setToken(data.token);
      setStatus("Token issued. Connecting…");
    } catch (e) {
      setError((e as Error).message);
      setStatus("");
    }
  };

  const handleLeave = () => {
    setToken(null);
    setStatus("Left room");
  };

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        LiveKit health check
      </h1>
      <p className="text-sm text-gray-600">
        Dev-only page to verify LiveKit connectivity. Enter SEED_SECRET from
        your .env.local to mint a token.
      </p>

      {!token ? (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700">
              SEED_SECRET
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="dev-seed-secret"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleJoin}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Get token & Join
          </button>
        </div>
      ) : null}

      {status && <p className="text-sm text-gray-600">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {token && serverUrl && (
        <div className="rounded-lg border border-gray-200 p-2">
          <LiveKitRoom
            data-lk-theme="default"
            serverUrl={serverUrl}
            token={token}
            onDisconnected={handleLeave}
            connectOptions={{ autoSubscribe: true }}
            video={true}
            audio={true}
          >
            <RoomContent setError={setError} setStatus={setStatus} />
          </LiveKitRoom>
        </div>
      )}
    </main>
  );
}

function RoomContent({
  setError,
  setStatus,
}: {
  setError: (error: string) => void;
  setStatus: (status: string) => void;
}) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const room = useRoomContext();
  const recorder = useMeetingRecorder(room);

  const handleStartRecording = async () => {
    setError("");
    setStatus("Starting browser recording…");
    try {
      await recorder.startRecording();
      setStatus("Recording in browser…");
    } catch (e) {
      setError((e as Error).message);
      setStatus("");
    }
  };

  const handleStopRecording = async () => {
    setError("");
    setStatus("Stopping & uploading…");
    try {
      const blob = await recorder.stopRecording();
      if (!blob) {
        setError("No recording data");
        return;
      }

      // Upload to Supabase
      const formData = new FormData();
      formData.append("file", blob, `health-test-${Date.now()}.webm`);
      formData.append("meetingId", "health-test");
      formData.append("orgSlug", "test");

      const uploadRes = await fetch("/api/recordings/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      setStatus(
        `Recording uploaded! ${(blob.size / 1024 / 1024).toFixed(2)} MB → ${uploadData.path}`,
      );
    } catch (e) {
      setError((e as Error).message);
      setStatus("");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="md:col-span-2">
          <GridLayout tracks={tracks}>
            <ParticipantTile />
          </GridLayout>
          <RoomAudioRenderer />
        </div>
        <div className="flex flex-col gap-2">
          <ControlBar variation="minimal" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3">
        {!recorder.isRecording ? (
          <button
            onClick={handleStartRecording}
            className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            🔴 Start Recording
          </button>
        ) : (
          <>
            <button
              onClick={handleStopRecording}
              className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              ⏹️ Stop Recording
            </button>
            <span className="text-sm text-gray-600">
              {formatDuration(recorder.duration)}
            </span>
            {recorder.error && (
              <span className="text-xs text-red-600">{recorder.error}</span>
            )}
          </>
        )}
      </div>
    </>
  );
}
