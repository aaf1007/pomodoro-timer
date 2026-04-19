"use client";

import { useCallback } from "react";
import { useTimer } from "@/lib/timer/useTimer";
import { useTabTitle } from "@/lib/timer/useTabTitle";
import { playAlert } from "@/lib/audio";
import { notifySessionEnd } from "@/lib/notifications";
import { formatCountdown } from "@/lib/tabTitle";
import type { Mode } from "@/lib/timer/sequence";
import ModePills from "./ModePills";
import Controls from "./Controls";

interface Props {
  accent?: string;
}

export default function Timer({ accent }: Props) {
  const handleSessionEnd = useCallback((mode: Mode) => {
    playAlert("bell", 0.6);
    notifySessionEnd(mode);
  }, []);

  const { mode, pomosDoneInCycle, remaining, running, start, pause, reset, selectMode } =
    useTimer(undefined, handleSessionEnd);

  useTabTitle(remaining, running, mode);

  return (
    <div className="flex flex-col items-center gap-10">
      <ModePills
        mode={mode}
        pomosDoneInCycle={pomosDoneInCycle}
        onSelect={selectMode}
        accent={accent}
      />
      <div className="text-white text-[8rem] font-semibold tabular-nums tracking-tight leading-none">
        {formatCountdown(remaining)}
      </div>
      <Controls running={running} onStart={start} onPause={pause} onReset={reset} />
    </div>
  );
}
