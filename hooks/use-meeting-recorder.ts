import { useState, useCallback, useRef } from "react";
import { Room } from "livekit-client";

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // seconds
  error: string | null;
}

export function useMeetingRecorder(room: Room | undefined) {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    if (!room) {
      setState((prev) => ({ ...prev, error: "Room not available" }));
      return;
    }

    try {
      // Get all audio tracks from the room
      const audioTracks: MediaStreamTrack[] = [];

      // Local participant audio
      const localAudioTrack = room.localParticipant.audioTrackPublications
        .values()
        .next().value?.track;
      if (localAudioTrack?.mediaStreamTrack) {
        audioTracks.push(localAudioTrack.mediaStreamTrack);
      }

      // Remote participants audio
      room.remoteParticipants.forEach((participant) => {
        participant.audioTrackPublications.forEach((pub) => {
          if (pub.track?.mediaStreamTrack) {
            audioTracks.push(pub.track.mediaStreamTrack);
          }
        });
      });

      if (audioTracks.length === 0) {
        setState((prev) => ({ ...prev, error: "No audio tracks found" }));
        return;
      }

      // Create audio context to mix multiple tracks
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Mix all audio tracks
      audioTracks.forEach((track) => {
        const source = audioContext.createMediaStreamSource(
          new MediaStream([track]),
        );
        source.connect(destination);
      });

      streamRef.current = destination.stream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setState((prev) => ({
          ...prev,
          isRecording: false,
          error: "Recording failed",
        }));
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();

      // Update duration every second
      intervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null,
      });
    } catch (err) {
      console.error("Failed to start recording:", err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to start recording",
      }));
    }
  }, [room]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        // Cleanup
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        mediaRecorderRef.current = null;
        chunksRef.current = [];

        setState({
          isRecording: false,
          isPaused: false,
          duration: 0,
          error: null,
        });

        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, []);

  const pauseRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();

      // Resume duration counter
      const pausedDuration = state.duration;
      startTimeRef.current = Date.now() - pausedDuration * 1000;

      intervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [state.duration]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}
