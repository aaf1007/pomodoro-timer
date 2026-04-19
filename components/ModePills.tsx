"use client";

import React from "react";
import { Mode, MODE_LABELS, MODES } from "@/lib/timer/sequence";

interface Props {
  mode: Mode;
  pomosDoneInCycle: number;
  onSelect: (mode: Mode) => void;
  accent?: string;
}

export default function ModePills({ mode, pomosDoneInCycle, onSelect, accent }: Props) {
  const activePillStyle = (m: Mode): React.CSSProperties | undefined =>
    mode === m
      ? {
          backgroundColor: accent ? `${accent}33` : "rgba(255,255,255,0.12)",
          outline: `1.5px solid ${accent ?? "rgba(255,255,255,0.3)"}`,
        }
      : undefined;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => onSelect(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              mode === m
                ? "text-white"
                : "text-white/50 hover:text-white/80"
            }`}
            style={activePillStyle(m)}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>
      <div className="flex gap-2" aria-label={`${pomosDoneInCycle} of 4 pomodoros done`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-colors"
            style={{
              backgroundColor:
                i < pomosDoneInCycle
                  ? accent ?? "rgba(255,255,255,0.8)"
                  : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
