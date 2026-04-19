"use client";

import { useTimer } from "@/lib/timer/useTimer";
import ModePills from "./ModePills";
import Controls from "./Controls";

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Timer() {
  const { mode, pomosDoneInCycle, remaining, running, start, pause, reset, selectMode } =
    useTimer();

  return (
    <div className="flex flex-col items-center gap-10">
      <ModePills
        mode={mode}
        pomosDoneInCycle={pomosDoneInCycle}
        onSelect={selectMode}
      />
      <div className="text-white text-[8rem] font-semibold tabular-nums tracking-tight leading-none">
        {formatTime(remaining)}
      </div>
      <Controls running={running} onStart={start} onPause={pause} onReset={reset} />
    </div>
  );
}
