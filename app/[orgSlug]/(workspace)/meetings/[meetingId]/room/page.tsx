"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
  RoomAudioRenderer,
  useRoomContext,
  useParticipants,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useMeetingRecorder } from "@/hooks/use-meeting-recorder";
import {
  useMeetingTranscription,
  type TranscriptSegment,
} from "@/hooks/use-meeting-transcription";
import { useMeeting } from "@/components/providers/meeting-provider";

type AgendaItem = {
  id: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  item_order: number;
  completed: boolean;
};

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const meetingId = params.meetingId as string;
  const { joinMeeting, leaveMeeting } = useMeeting();

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [meeting, setMeeting] = useState<{ title: string } | null>(null);

  useEffect(() => {
    const fetchTokenAndMeeting = async () => {
      try {
        // Fetch meeting details
        const meetingRes = await fetch(`/api/${orgSlug}/meetings/${meetingId}`);
        if (!meetingRes.ok) throw new Error("Meeting not found");
        const meetingData = await meetingRes.json();
        setMeeting(meetingData);

        // Fetch LiveKit token
        const tokenRes = await fetch(
          `/api/${orgSlug}/meetings/${meetingId}/livekit-token`
        );
        if (!tokenRes.ok) {
          const data = await tokenRes.json().catch(() => ({}));
          throw new Error(data.error || "Failed to get token");
        }

        const tokenData = await tokenRes.json();
        setToken(tokenData.token);
        setServerUrl(tokenData.wsUrl);

        // Join meeting in context for floating panel
        joinMeeting({
          meetingId,
          orgSlug,
          title: meetingData.title,
          token: tokenData.token,
          serverUrl: tokenData.wsUrl,
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenAndMeeting();
  }, [orgSlug, meetingId, joinMeeting]);

  const handleDisconnect = () => {
    leaveMeeting();
    router.push(`/${orgSlug}/calendar`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl">🔄</div>
          <p className="text-gray-600">Connecting to meeting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={() => router.push(`/${orgSlug}/calendar`)}
            className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return null;
  }

  return (
    <LiveKitRoom
      data-lk-theme="default"
      serverUrl={serverUrl}
      token={token}
      onDisconnected={handleDisconnect}
      connectOptions={{ autoSubscribe: true }}
      video={true}
      audio={true}
      className="h-screen"
    >
      <RoomContent
        orgSlug={orgSlug}
        meetingId={meetingId}
        setError={setError}
        meetingTitle={meeting?.title || "Meeting"}
        onDisconnect={handleDisconnect}
      />
    </LiveKitRoom>
  );
}

function RoomContent({
  orgSlug,
  meetingId,
  setError,
  meetingTitle,
  onDisconnect,
}: {
  orgSlug: string;
  meetingId: string;
  setError: (error: string) => void;
  meetingTitle: string;
  onDisconnect: () => void;
}) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const room = useRoomContext();
  const { setRoom } = useMeeting();
  const recorder = useMeetingRecorder(room);

  // Sync room with meeting provider
  useEffect(() => {
    if (room) {
      setRoom(room);
    }
  }, [room, setRoom]);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // Current user info for transcription
  const [currentUser, setCurrentUser] = useState<
    | {
        name: string;
        role: string;
        department?: string;
        avatar?: string;
      }
    | undefined
  >();

  // Fetch current user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch(`/api/${orgSlug}/me`);
        if (res.ok) {
          const data = await res.json();
          setCurrentUser({
            name: data.full_name || data.email,
            role: data.role || "member",
            department: data.department,
            avatar: data.avatar_url,
          });
        }
      } catch (e) {
        console.error("Failed to fetch user info:", e);
      }
    };
    fetchUserInfo();
  }, [orgSlug]);

  // Transcription - auto-start on mount
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(true);
  const {
    segments,
    isListening,
    error: transcriptionError,
  } = useMeetingTranscription(transcriptionEnabled, currentUser);
  const [showTranscript, setShowTranscript] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<string>("");
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);

  // Stop transcription when component unmounts
  useEffect(() => {
    return () => {
      setTranscriptionEnabled(false);
    };
  }, []);

  const handleStartRecording = async () => {
    setError("");
    setUploadStatus("Starting recording...");
    try {
      await recorder.startRecording();
      setUploadStatus("Recording...");
    } catch (e) {
      setError((e as Error).message);
      setUploadStatus("");
    }
  };

  const handleStopRecording = async () => {
    setError("");
    setUploadStatus("Stopping & uploading...");
    try {
      const blob = await recorder.stopRecording();
      if (!blob) {
        setError("No recording data");
        setUploadStatus("");
        return;
      }

      // Upload to Supabase
      const formData = new FormData();
      formData.append("file", blob, `recording-${Date.now()}.webm`);
      formData.append("meetingId", meetingId);
      formData.append("orgSlug", orgSlug);

      const uploadRes = await fetch("/api/recordings/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      setUploadStatus(
        `✅ Recording saved (${(blob.size / 1024 / 1024).toFixed(2)} MB)`
      );

      // Clear success message after 5 seconds
      setTimeout(() => setUploadStatus(""), 5000);
    } catch (e) {
      setError((e as Error).message);
      setUploadStatus("");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Generate notes from transcript with agenda item detection
  const handleGenerateNotes = async () => {
    if (segments.length === 0 || isGeneratingNotes) return;

    setIsGeneratingNotes(true);
    try {
      const fullTranscript = segments
        .filter((s) => s.isFinal)
        .map((s) => s.text)
        .join(" ");

      const res = await fetch(`/api/${orgSlug}/meetings/${meetingId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript,
          agendaItems: agendaItems,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate notes");

      const data = await res.json();
      setGeneratedNotes(data.notes.content);

      // If any agenda items were auto-completed, refresh the agenda
      if (data.completedItems && data.completedItems.length > 0) {
        console.log("✅ Auto-completed items:", data.completedItems);
        // Trigger agenda refresh by updating state
        setAgendaItems((prev) =>
          prev.map((item) =>
            data.completedItems.includes(item.id)
              ? { ...item, completed: true }
              : item
          )
        );
      }
    } catch (e) {
      console.error("Failed to generate notes:", e);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  // Auto-generate notes every 30 seconds when transcribing
  useEffect(() => {
    if (!isListening || segments.length === 0) return;

    // Generate immediately on first segments
    const timer = setTimeout(() => {
      handleGenerateNotes();
    }, 5000); // First generation after 5 seconds

    const interval = setInterval(() => {
      handleGenerateNotes();
    }, 30000); // Then every 30 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isListening, segments.length]);

  return (
    <div className="flex h-screen flex-col bg-black">
      {/* Top Bar - Minimized */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-3 py-1.5">
        {/* Left - Meeting Title & Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">
            {meetingTitle}
          </span>

          <div className="ml-2 flex items-center gap-0.5">
            {/* LiveKit Controls - inline with rest */}
            <ControlBar
              variation="minimal"
              controls={{
                microphone: true,
                camera: true,
                screenShare: true,
                chat: false,
                leave: false,
              }}
            />

            {/* Divider */}
            <div className="mx-1 h-4 w-px bg-gray-700"></div>

            {/* Participants */}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                showParticipants
                  ? "bg-gray-700 text-white"
                  : "text-white hover:bg-gray-800"
              }`}
              title="Participants"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </button>

            {/* Chat */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                showChat
                  ? "bg-gray-700 text-white"
                  : "text-white hover:bg-gray-800"
              }`}
              title="Chat"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>

            {/* Reactions */}
            <button
              className="flex h-7 w-7 items-center justify-center rounded text-white transition-colors hover:bg-gray-800"
              title="Reactions"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Divider */}
            <div className="mx-1 h-4 w-px bg-gray-700"></div>

            {/* Recording */}
            {!recorder.isRecording ? (
              <button
                onClick={handleStartRecording}
                className="flex h-7 w-7 items-center justify-center rounded text-white transition-colors hover:bg-gray-800"
                title="Start recording"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                title="Stop recording"
              >
                <span className="h-2 w-2 rounded-sm bg-white"></span>
                <span className="font-mono">
                  {formatDuration(recorder.duration)}
                </span>
              </button>
            )}

            {/* Transcription */}
            <button
              onClick={() => {
                setTranscriptionEnabled(!transcriptionEnabled);
                setShowTranscript(true);
              }}
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                isListening
                  ? "bg-blue-600 text-white"
                  : "text-white hover:bg-gray-800"
              }`}
              title={
                isListening
                  ? "AI Transcription Active"
                  : "Start AI Transcription"
              }
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>

            {/* More Options */}
            <button
              className="flex h-7 w-7 items-center justify-center rounded text-white transition-colors hover:bg-gray-800"
              title="More options"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Right - Leave Button */}
        <button
          onClick={onDisconnect}
          className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
        >
          Leave
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Participant Thumbnails */}
        <div className="w-48 border-r border-gray-800 bg-gray-950">
          <ParticipantThumbnails />
        </div>

        {/* Center - Active Speaker / Screen Share */}
        <div className="relative flex-1 bg-black">
          <div className="h-full flex items-center justify-center">
            <GridLayout tracks={tracks} className="h-full w-full">
              <ParticipantTile />
            </GridLayout>
          </div>
          <RoomAudioRenderer />

          {/* Status Messages */}
          {(uploadStatus || recorder.error) && (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
              {uploadStatus && (
                <div className="rounded-md bg-green-600/90 px-3 py-1.5 text-xs text-white backdrop-blur">
                  {uploadStatus}
                </div>
              )}
              {recorder.error && (
                <div className="rounded-md bg-red-600/90 px-3 py-1.5 text-xs text-white backdrop-blur">
                  {recorder.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Tabs (Agenda, Transcript, Notes, Chat) */}
        <div className="w-80 border-l border-gray-800 bg-gray-950">
          <MeetingSidebar
            orgSlug={orgSlug}
            meetingId={meetingId}
            showTranscript={showTranscript}
            setShowTranscript={setShowTranscript}
            segments={segments}
            generatedNotes={generatedNotes}
            isGeneratingNotes={isGeneratingNotes}
            transcriptionError={transcriptionError}
            agendaItems={agendaItems}
            setAgendaItems={setAgendaItems}
          />
        </div>
      </div>
    </div>
  );
}

function ParticipantThumbnails() {
  const participants = useParticipants();

  // Mock role data - in real app, fetch from metadata or API
  const getParticipantRole = (identity: string) => {
    // This would come from participant metadata or API
    return "Member"; // Default role
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-800 p-3">
        <h3 className="text-xs font-medium text-gray-400">
          Participants ({participants.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {participants.map((participant) => {
            const name = participant.name || participant.identity;
            const role = getParticipantRole(participant.identity);
            const initials = name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={participant.identity}
                className="group relative aspect-video overflow-hidden rounded-lg bg-gray-900"
              >
                {/* Video Thumbnail would go here - for now using placeholder */}
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                    {initials}
                  </div>
                </div>

                {/* Name & Role overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-medium text-white">
                        {name}
                      </span>
                      <div className="flex items-center gap-1">
                        {!participant.isMicrophoneEnabled && (
                          <svg
                            className="h-3 w-3 text-red-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                          </svg>
                        )}
                        {participant.isSpeaking && (
                          <div className="flex h-3 w-3">
                            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="truncate text-[10px] text-gray-400">
                      {role}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MeetingSidebar({
  orgSlug,
  meetingId,
  showTranscript,
  setShowTranscript,
  segments,
  generatedNotes,
  isGeneratingNotes,
  transcriptionError,
  agendaItems,
  setAgendaItems,
}: {
  orgSlug: string;
  meetingId: string;
  showTranscript: boolean;
  setShowTranscript: (show: boolean) => void;
  segments: TranscriptSegment[];
  generatedNotes: string;
  isGeneratingNotes: boolean;
  transcriptionError: string;
  agendaItems: AgendaItem[];
  setAgendaItems: (
    items: AgendaItem[] | ((prev: AgendaItem[]) => AgendaItem[])
  ) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "agenda" | "transcript" | "notes" | "chat"
  >("notes");

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Enhanced Tabs with Icons */}
      <div className="grid grid-cols-4 border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab("agenda")}
          className={`group flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-xs font-medium transition-all ${
            activeTab === "agenda"
              ? "border-b-2 border-blue-500 bg-blue-500/10 text-white"
              : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
          }`}
        >
          <svg
            className={`h-4 w-4 transition-transform ${
              activeTab === "agenda" ? "scale-110" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <span>Agenda</span>
          {agendaItems.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === "agenda"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {agendaItems.filter((i) => i.completed).length}/
              {agendaItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("transcript")}
          className={`group flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-xs font-medium transition-all ${
            activeTab === "transcript"
              ? "border-b-2 border-purple-500 bg-purple-500/10 text-white"
              : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
          }`}
        >
          <svg
            className={`h-4 w-4 transition-transform ${
              activeTab === "transcript" ? "scale-110" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          <span>Live</span>
          {segments.length > 0 && (
            <span
              className={`flex h-2 w-2 ${
                activeTab === "transcript" ? "" : "opacity-60"
              }`}
            >
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`group flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-xs font-medium transition-all ${
            activeTab === "notes"
              ? "border-b-2 border-emerald-500 bg-emerald-500/10 text-white"
              : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
          }`}
        >
          <svg
            className={`h-4 w-4 transition-transform ${
              activeTab === "notes" ? "scale-110" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span>Notes</span>
          {isGeneratingNotes && (
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`group flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-xs font-medium transition-all ${
            activeTab === "chat"
              ? "border-b-2 border-orange-500 bg-orange-500/10 text-white"
              : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
          }`}
        >
          <svg
            className={`h-4 w-4 transition-transform ${
              activeTab === "chat" ? "scale-110" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>Chat</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "agenda" && (
          <MeetingAgendaSidebar
            orgSlug={orgSlug}
            meetingId={meetingId}
            agendaItems={agendaItems}
            setAgendaItems={setAgendaItems}
          />
        )}
        {activeTab === "transcript" && (
          <TranscriptPanel segments={segments} error={transcriptionError} />
        )}
        {activeTab === "notes" && (
          <NotesPanel
            notes={generatedNotes}
            isGenerating={isGeneratingNotes}
            orgSlug={orgSlug}
            meetingId={meetingId}
          />
        )}
        {activeTab === "chat" && <ChatPanel meetingId={meetingId} />}
      </div>
    </div>
  );
}

function MeetingAgendaSidebar({
  orgSlug,
  meetingId,
  agendaItems,
  setAgendaItems,
}: {
  orgSlug: string;
  meetingId: string;
  agendaItems: AgendaItem[];
  setAgendaItems: (
    items: AgendaItem[] | ((prev: AgendaItem[]) => AgendaItem[])
  ) => void;
}) {
  const [items, setItems] = useState<AgendaItem[]>(agendaItems);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDuration, setNewDuration] = useState("");

  useEffect(() => {
    const fetchAgenda = async () => {
      try {
        const res = await fetch(`/api/${orgSlug}/meetings/${meetingId}/agenda`);
        if (res.ok) {
          const data = await res.json();
          const fetchedItems = data.items || [];
          setItems(fetchedItems);
          setAgendaItems(fetchedItems);
        }
      } catch (error) {
        console.error("Failed to fetch agenda:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgenda();
  }, [orgSlug, meetingId, setAgendaItems]);

  // Sync with parent agendaItems (for auto-completion updates)
  useEffect(() => {
    setItems(agendaItems);
  }, [agendaItems]);

  const toggleComplete = async (itemId: string, completed: boolean) => {
    try {
      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, completed: !completed } : item
      );
      setItems(updatedItems);
      setAgendaItems(updatedItems);
    } catch (error) {
      console.error("Failed to update agenda item:", error);
      const revertedItems = items.map((item) =>
        item.id === itemId ? { ...item, completed } : item
      );
      setItems(revertedItems);
      setAgendaItems(revertedItems);
    }
  };

  const addItem = async () => {
    if (!newTitle.trim()) return;

    try {
      const res = await fetch(`/api/${orgSlug}/meetings/${meetingId}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || undefined,
          duration_minutes: newDuration ? parseInt(newDuration) : undefined,
          item_order: items.length,
        }),
      });

      if (!res.ok) throw new Error("Failed to add item");

      const data = await res.json();
      setItems((prev) => [...prev, data.item]);
      setNewTitle("");
      setNewDescription("");
      setNewDuration("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add agenda item:", error);
      alert("Failed to add item");
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm("Delete this agenda item?")) return;

    try {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      // TODO: Add DELETE endpoint
    } catch (error) {
      console.error("Failed to delete agenda item:", error);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Agenda</h2>
            <p className="mt-1 text-xs text-gray-400">
              {items.filter((i) => i.completed).length} of {items.length} done
            </p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Agenda Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-sm text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-2">
            {/* Add New Item Form */}
            {isAdding && (
              <div className="rounded-lg border border-blue-600 bg-gray-900 p-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Item title"
                  className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500"
                  autoFocus
                />
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-white placeholder-gray-500"
                />
                <input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="Duration (min)"
                  className="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-white placeholder-gray-500"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={addItem}
                    className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewTitle("");
                      setNewDescription("");
                      setNewDuration("");
                    }}
                    className="rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {items.length === 0 && !isAdding ? (
              <div className="text-center text-sm text-gray-400">
                No agenda items yet
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg border border-gray-800 bg-gray-900 p-3 transition-colors hover:border-gray-700"
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleComplete(item.id, item.completed)}
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 transition-colors ${
                        item.completed
                          ? "border-green-500 bg-green-500"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                    >
                      {item.completed && (
                        <svg
                          className="h-full w-full text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-medium ${
                          item.completed
                            ? "text-gray-500 line-through"
                            : "text-white"
                        }`}
                      >
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-1 text-xs text-gray-400">
                          {item.description}
                        </p>
                      )}
                      {item.duration_minutes && (
                        <p className="mt-1 text-xs text-gray-500">
                          ⏱️ {item.duration_minutes} min
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                      title="Delete"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TranscriptPanel({
  segments,
  error,
}: {
  segments: TranscriptSegment[];
  error: string;
}) {
  useEffect(() => {
    const container = document.getElementById("transcript-container");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [segments]);

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Live Transcript</h3>
        <span className="text-xs text-gray-400">
          {segments.length} segments
        </span>
      </div>

      {error && (
        <div className="mb-3 rounded border border-red-800 bg-red-900/20 p-2 text-xs text-red-400">
          {error}
        </div>
      )}

      <div
        id="transcript-container"
        className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 p-3"
      >
        {segments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-2 text-3xl">🎤</div>
            <div className="text-sm font-medium text-gray-400">
              No transcript yet
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Start speaking to see live transcription
            </div>
          </div>
        ) : (
          segments.map((segment, idx) => (
            <div
              key={idx}
              className={`group rounded-lg border transition-all ${
                segment.isFinal
                  ? "border-gray-700 bg-gray-800/80 text-gray-200 hover:border-gray-600 hover:bg-gray-800"
                  : "border-gray-700/50 bg-gray-800/30 text-gray-400 italic"
              }`}
            >
              {/* Speaker Header */}
              {segment.speaker && (
                <div className="flex items-center gap-2 border-b border-gray-700/50 px-3 py-2">
                  {/* Avatar */}
                  <div className="relative">
                    {segment.speaker.avatar ? (
                      <Image
                        src={segment.speaker.avatar}
                        alt={segment.speaker.name}
                        width={28}
                        height={28}
                        unoptimized
                        className="h-7 w-7 rounded-full ring-2 ring-gray-700"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white ring-2 ring-gray-700">
                        {segment.speaker.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Live indicator for current speaker */}
                    {idx === segments.length - 1 && !segment.isFinal && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-gray-900"></span>
                      </span>
                    )}
                  </div>

                  {/* Speaker Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {segment.speaker.name}
                      </span>
                      {/* Role Badge */}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          segment.speaker.role === "owner"
                            ? "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30"
                            : segment.speaker.role === "manager"
                            ? "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30"
                            : "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                        }`}
                      >
                        {segment.speaker.role}
                      </span>
                    </div>
                    {/* Department */}
                    {segment.speaker.department && (
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-500">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        {segment.speaker.department}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-[10px] text-gray-500">
                    {new Date(segment.timestamp).toLocaleTimeString("cs-CZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>
              )}

              {/* Transcript Text */}
              <div className="px-3 py-2.5">
                <div className="text-sm leading-relaxed">{segment.text}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NotesPanel({
  notes,
  isGenerating,
  orgSlug,
  meetingId,
}: {
  notes: string;
  isGenerating: boolean;
  orgSlug: string;
  meetingId: string;
}) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectCreated, setProjectCreated] = useState(false);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCreateProject = async () => {
    if (!notes || isCreatingProject) return;

    setIsCreatingProject(true);
    try {
      const res = await fetch(
        `/api/${orgSlug}/meetings/${meetingId}/create-project`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create project");
      }

      const data = await res.json();
      setProjectCreated(true);

      // Redirect to project after 2 seconds
      setTimeout(() => {
        window.location.href = `/${orgSlug}/projects/${data.projectId}`;
      }, 2000);
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const renderNotes = () => {
    if (!notes) return null;

    const lines = notes.split("\n");
    const sections: { title: string; content: string[]; icon: string }[] = [];
    let currentSection: {
      title: string;
      content: string[];
      icon: string;
    } | null = null;

    lines.forEach((line) => {
      if (line.startsWith("# ")) {
        // Skip main title
        return;
      } else if (line.startsWith("## ")) {
        if (currentSection) sections.push(currentSection);
        const title = line.replace("## ", "");
        let icon = "📋";
        if (title.includes("Agenda")) icon = "✅";
        else if (title.includes("Decisions")) icon = "🎯";
        else if (title.includes("Action")) icon = "⚡";
        else if (title.includes("Transcript")) icon = "💬";
        currentSection = { title, content: [], icon };
      } else if (line.startsWith("### ")) {
        if (currentSection) {
          currentSection.content.push(`**${line.replace("### ", "")}**`);
        }
      } else if (line.trim()) {
        if (currentSection) {
          currentSection.content.push(line);
        }
      }
    });

    if (currentSection) sections.push(currentSection);

    return sections.map((section, idx) => (
      <div
        key={idx}
        className="group mb-4 rounded-lg border border-gray-800 bg-gray-900/50 p-4 transition-all hover:border-gray-700 hover:bg-gray-900"
      >
        {/* Section Header */}
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="text-lg">{section.icon}</span>
            {section.title}
            <span className="rounded-full bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-gray-300">
              {section.content.filter((c) => c.startsWith("-")).length ||
                section.content.length}
            </span>
          </h4>
          <button
            onClick={() =>
              copyToClipboard(section.content.join("\n"), section.title)
            }
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-300 transition-all hover:bg-gray-700"
          >
            {copiedSection === section.title ? (
              <>
                <svg
                  className="h-3 w-3 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>

        {/* Section Content */}
        <div className="space-y-2">
          {section.content.map((item, itemIdx) => {
            if (item.startsWith("**") && item.endsWith("**")) {
              // Agenda item title
              return (
                <div
                  key={itemIdx}
                  className="mt-3 first:mt-0 flex items-center gap-2 text-sm font-semibold text-emerald-400"
                >
                  {item.replace(/\*\*/g, "")}
                </div>
              );
            } else if (item.startsWith("- ")) {
              // List item
              return (
                <div
                  key={itemIdx}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span className="flex-1">{item.replace("- ", "")}</span>
                </div>
              );
            } else {
              // Regular paragraph
              return (
                <p
                  key={itemIdx}
                  className="text-sm leading-relaxed text-gray-400"
                >
                  {item}
                </p>
              );
            }
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">AI-Generated Notes</h3>
          {isGenerating && (
            <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400">
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              Analyzing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notes && !projectCreated && (
            <button
              onClick={handleCreateProject}
              disabled={isCreatingProject}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreatingProject ? (
                <>
                  <span className="flex h-3 w-3">
                    <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
                  </span>
                  Creating...
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Create Project
                </>
              )}
            </button>
          )}
          {projectCreated && (
            <span className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Project Created!
            </span>
          )}
          {notes && (
            <button
              onClick={() => copyToClipboard(notes, "all")}
              className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700"
            >
              {copiedSection === "all" ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied All!
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Copy All
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {notes ? (
          <div className="space-y-1">{renderNotes()}</div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900/30">
            <div className="text-center">
              {isGenerating ? (
                <div className="animate-pulse">
                  <div className="mb-3 text-4xl">🤖</div>
                  <div className="text-sm font-medium text-gray-400">
                    Generating notes from transcript...
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    This may take a few seconds
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-3 text-4xl">📝</div>
                  <div className="text-sm font-medium text-gray-400">
                    AI notes will appear here
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Start speaking to generate notes automatically
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPanel({ meetingId }: { meetingId: string }) {
  const [messages, setMessages] = useState<
    Array<{ id: string; sender: string; text: string; timestamp: Date }>
  >([]);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "You",
        text: newMessage,
        timestamp: new Date(),
      },
    ]);
    setNewMessage("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-3 text-4xl">💬</div>
              <div className="text-sm font-medium text-gray-400">
                No messages yet
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Send a message to start the conversation
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="rounded-lg bg-gray-800/50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-400">
                    {msg.sender}
                  </span>
                  <span className="text-xs text-gray-500">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-200">{msg.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
