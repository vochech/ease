"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Room } from "livekit-client";

type MeetingContextType = {
  // Active meeting state
  activeMeeting: {
    meetingId: string;
    orgSlug: string;
    title: string;
    token: string;
    serverUrl: string;
    room?: Room;
  } | null;

  // Actions
  joinMeeting: (meeting: {
    meetingId: string;
    orgSlug: string;
    title: string;
    token: string;
    serverUrl: string;
  }) => void;
  leaveMeeting: () => void;
  setRoom: (room: Room | undefined) => void;
};

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [activeMeeting, setActiveMeeting] =
    useState<MeetingContextType["activeMeeting"]>(null);

  const joinMeeting = useCallback(
    (meeting: {
      meetingId: string;
      orgSlug: string;
      title: string;
      token: string;
      serverUrl: string;
    }) => {
      setActiveMeeting({ ...meeting, room: undefined });
    },
    [],
  );

  const leaveMeeting = useCallback(() => {
    if (activeMeeting?.room) {
      activeMeeting.room.disconnect();
    }
    setActiveMeeting(null);
  }, [activeMeeting]);

  const setRoom = useCallback((room: Room | undefined) => {
    setActiveMeeting((prev) => (prev ? { ...prev, room } : null));
  }, []);

  return (
    <MeetingContext.Provider
      value={{
        activeMeeting,
        joinMeeting,
        leaveMeeting,
        setRoom,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error("useMeeting must be used within MeetingProvider");
  }
  return context;
}
