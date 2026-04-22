"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DEFAULT_DURATIONS, Mode, SequenceState, nextSequence } from "./sequence";

export interface TimerDurations {
  pom: number;
  short: number;
  long: number;
}

export interface UseTimerReturn {
  mode: Mode;
  pomosDoneInCycle: number;
  remaining: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  selectMode: (mode: Mode) => void;
}

export function useTimer(
  durations: TimerDurations = DEFAULT_DURATIONS,
  onSessionEnd?: (mode: Mode) => void
): UseTimerReturn {
  const [sequence, setSequence] = useState<SequenceState>({
    mode: "pom",
    pomosDoneInCycle: 0,
  });
  const [remaining, setRemaining] = useState(durations.pom * 60 * 1000);
  const [running, setRunning] = useState(false);

  const endsAtRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const remainingRef = useRef(remaining);
  const durationsRef = useRef(durations);
  const onSessionEndRef = useRef(onSessionEnd);
  useLayoutEffect(() => { onSessionEndRef.current = onSessionEnd; });

  useLayoutEffect(() => {
    remainingRef.current = remaining;
    durationsRef.current = durations;
  });

  // Drift-safe rAF loop — defined as a local function so it can self-reference cleanly
  useEffect(() => {
    if (!running) return;

    let rafId: number;
    let lastUpdate = 0;

    function tick() {
      if (endsAtRef.current == null) return;
      const now = Date.now();
      const rem = Math.max(0, endsAtRef.current - now);

      if (now - lastUpdate >= 250 || rem === 0) {
        lastUpdate = now;
        setRemaining(rem);

        if (rem === 0) {
          endsAtRef.current = null;
          setRunning(false);
          setSequence((prev) => {
            onSessionEndRef.current?.(prev.mode);
            const next = nextSequence(prev);
            const nextMs = durationsRef.current[next.mode] * 60 * 1000;
            setRemaining(nextMs);
            return next;
          });
          return;
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [running]);

  const modeMs = durations[sequence.mode] * 60 * 1000;
  useEffect(() => {
    if (endsAtRef.current !== null) return;
    if (pausedRef.current) return;
    setRemaining(modeMs);
  }, [modeMs]);

  const start = useCallback(() => {
    endsAtRef.current = Date.now() + remainingRef.current;
    pausedRef.current = false;
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    endsAtRef.current = null;
    pausedRef.current = true;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    endsAtRef.current = null;
    pausedRef.current = false;
    setRunning(false);
    setSequence((prev) => {
      const dur = durationsRef.current[prev.mode] * 60 * 1000;
      setRemaining(dur);
      return prev;
    });
  }, []);

  const selectMode = useCallback((mode: Mode) => {
    endsAtRef.current = null;
    pausedRef.current = false;
    setRunning(false);
    setRemaining(durationsRef.current[mode] * 60 * 1000);
    setSequence((prev) => ({ mode, pomosDoneInCycle: prev.pomosDoneInCycle }));
  }, []);

  return {
    mode: sequence.mode,
    pomosDoneInCycle: sequence.pomosDoneInCycle,
    remaining,
    running,
    start,
    pause,
    reset,
    selectMode,
  };
}
