import { useState, useEffect, useRef } from "react";

export type TranscriptSegment = {
  text: string;
  timestamp: number;
  speaker?: {
    name: string;
    role: string;
    department?: string;
    avatar?: string;
  };
  isFinal: boolean;
};

export function useMeetingTranscription(
  isEnabled: boolean,
  currentUser?: {
    name: string;
    role: string;
    department?: string;
    avatar?: string;
  }
) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [isListening, setIsListening] = useState(false);
  // Initialize error state based on feature support to avoid setting state inside effects
  const [error, setError] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    return SR ? "" : "Speech recognition not supported in this browser";
  });
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (!isEnabled) return;

    // Check for browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Error is initialized upfront; no state updates in effect body
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "cs-CZ"; // Czech language, můžeš změnit na "en-US"

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const isFinal = lastResult.isFinal;

      const newSegment: TranscriptSegment = {
        text: transcript,
        timestamp: Date.now(),
        speaker: currentUser,
        isFinal,
      };

      setSegments((prev) => {
        // Replace interim results, append final ones
        if (isFinal) {
          return [...prev, newSegment];
        } else {
          // Replace last interim result
          const filtered = prev.filter((s) => s.isFinal);
          return [...filtered, newSegment];
        }
      });
    };

    recognition.onerror = (event: any) => {
      // Ignore "aborted" errors - they happen during normal cleanup
      if (event.error === "aborted") {
        return;
      }
      // Only log errors if component is still mounted
      if (isMountedRef.current) {
        console.error("Speech recognition error:", event.error);
        setError(`Recognition error: ${event.error}`);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Only auto-restart if still mounted and enabled
      if (isEnabled && isMountedRef.current) {
        setTimeout(() => {
          try {
            if (recognitionRef.current && isMountedRef.current) {
              recognition.start();
            }
          } catch (e) {
            console.error("Failed to restart recognition:", e);
          }
        }, 1000);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }

    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          recognitionRef.current = null;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isEnabled, currentUser]);

  const stop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return {
    segments,
    isListening,
    error,
    stop,
  };
}
