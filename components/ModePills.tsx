"use client";

import { Mode, MODE_LABELS, MODES } from "@/lib/timer/sequence";

interface Props {
  mode: Mode;
  pomosDoneInCycle: number;
  onSelect: (mode: Mode) => void;
}

export default function ModePills({ mode, pomosDoneInCycle, onSelect }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => onSelect(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              mode === m
                ? "bg-white/20 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>
      <div className="flex gap-2" aria-label={`${pomosDoneInCycle} of 4 pomodoros done`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < pomosDoneInCycle ? "bg-white/80" : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
