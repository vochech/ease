"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import { Track, Room } from "livekit-client";
import { useMeeting } from "@/components/providers/meeting-provider";

export default function FloatingVideoPanel() {
  const { activeMeeting, leaveMeeting, setRoom } = useMeeting();
  const pathname = useMemo(() => {
    if (typeof window === "undefined") return "/";
    return window.location.pathname;
  }, []);
  const [isDragging, setIsDragging] = useState(false);
  // Position in bottom-right corner (20px from edges)
  const [position, setPosition] = useState({
    x: typeof window !== "undefined" ? window.innerWidth - 380 : 20,
    y: typeof window !== "undefined" ? window.innerHeight - 260 : 20,
  });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y,
      };
    },
    [position.x, position.y]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  // Note: initial position is computed during state init; no need to set state in effect

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Don't render if no active meeting
  if (!activeMeeting) {
    return null;
  }

  // Check if we're on the meeting room page - if yes, don't show floating panel
  const isOnMeetingPage =
    pathname ===
    `/${activeMeeting.orgSlug}/meetings/${activeMeeting.meetingId}/room`;

  if (isOnMeetingPage) {
    return null;
  }

  const handleMaximize = () => {
    window.location.assign(
      `/${activeMeeting.orgSlug}/meetings/${activeMeeting.meetingId}/room`
    );
  };

  const handleLeave = () => {
    leaveMeeting();
    window.location.assign(`/${activeMeeting.orgSlug}/calendar`);
  };

  return (
    <div
      className="fixed z-50 overflow-hidden rounded-xl border-2 border-gray-700 bg-gray-900 shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "360px",
        height: "240px",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      {/* Draggable Header */}
      <div
        className="flex items-center justify-between border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 px-3 py-2"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </div>
          <span className="text-xs font-semibold text-white truncate max-w-[180px]">
            {activeMeeting.title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleMaximize}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
            title="Maximize"
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
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
          <button
            onClick={handleLeave}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-red-600 hover:text-white"
            title="Leave Meeting"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Video Content */}
      <div className="h-[calc(100%-40px)]">
        <LiveKitRoom
          data-lk-theme="default"
          serverUrl={activeMeeting.serverUrl}
          token={activeMeeting.token}
          connectOptions={{ autoSubscribe: true }}
          video={true}
          audio={true}
          className="h-full w-full"
        >
          <FloatingVideoContent setRoom={setRoom} />
        </LiveKitRoom>
      </div>
    </div>
  );
}

function FloatingVideoContent({ setRoom }: { setRoom: (room: Room) => void }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const room = useRoomContext();

  useEffect(() => {
    if (room) {
      setRoom(room);
    }
  }, [room, setRoom]);

  return (
    <div className="relative h-full w-full bg-gray-950">
      <RoomAudioRenderer />

      {tracks.length > 0 ? (
        <GridLayout tracks={tracks} className="h-full w-full">
          <ParticipantTile />
        </GridLayout>
      ) : (
        <div className="flex h-full items-center justify-center text-gray-500">
          <div className="text-center">
            <svg
              className="mx-auto h-8 w-8 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">No video</p>
          </div>
        </div>
      )}

      {/* Minimal controls */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
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
      </div>
    </div>
  );
}
