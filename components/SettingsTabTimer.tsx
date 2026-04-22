"use client";

import type { SettingsTabProps } from "@/components/SettingsModal";
import type { Settings } from "@/lib/storage/local";

type DurationKey = "pomodoro_min" | "short_min" | "long_min";

const FIELDS: ReadonlyArray<{
  key: DurationKey;
  label: string;
  id: string;
}> = [
  { key: "pomodoro_min", label: "Pomodoro (min)", id: "settings-pomodoro-min" },
  { key: "short_min", label: "Short break (min)", id: "settings-short-min" },
  { key: "long_min", label: "Long break (min)", id: "settings-long-min" },
];

function clampMinutes(n: number): number {
  return Math.min(90, Math.max(1, Math.round(n)));
}

export default function SettingsTabTimer({
  settings,
  onChange,
}: SettingsTabProps) {
  const handleChange = (
    key: DurationKey,
    raw: string,
  ): void => {
    if (raw.trim() === "") return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    const clamped = clampMinutes(parsed);
    onChange({ [key]: clamped } as Partial<Settings>);
  };

  return (
    <div className="flex flex-col gap-3">
      {FIELDS.map(({ key, label, id }) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <label
            htmlFor={id}
            className="text-sm text-white/80"
          >
            {label}
          </label>
          <input
            id={id}
            type="number"
            min={1}
            max={90}
            step={1}
            value={settings[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-20 px-2 py-1 rounded bg-white/10 border border-white/10 text-white text-sm text-right outline-none focus:bg-white/15"
          />
        </div>
      ))}
    </div>
  );
}
