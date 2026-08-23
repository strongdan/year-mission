"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdown(initialSeconds: number, onComplete?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const completedRef = useRef(false);

  const reset = useCallback((seconds = initialSeconds, autoStart = false) => {
    completedRef.current = false;
    setSecondsLeft(seconds);
    setRunning(autoStart);
  }, [initialSeconds]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const id = window.setTimeout(() => {
      if (secondsLeft <= 1) {
        setSecondsLeft(0);
        setRunning(false);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      } else {
        setSecondsLeft(secondsLeft - 1);
      }
    }, 1000);
    return () => window.clearTimeout(id);
  }, [onComplete, running, secondsLeft]);

  return {
    secondsLeft,
    running,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    toggle: () => setRunning((value) => !value),
    reset,
    setSecondsLeft,
  };
}

export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
