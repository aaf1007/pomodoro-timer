"use client";

import type { SettingsTabProps } from "@/components/SettingsModal";
import { ALERT_SOUNDS, playAlert } from "@/lib/audio";
import type { Settings } from "@/lib/storage/local";

export default function SettingsTabSounds({
  settings,
  onChange,
}: SettingsTabProps) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-white/70">Alert sound</span>
        <select
          value={settings.alert_sound}
          onChange={(e) =>
            onChange({
              alert_sound: e.target.value as Settings["alert_sound"],
            })
          }
          className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white outline-none focus:border-white/60"
        >
          {ALERT_SOUNDS.map((sound) => (
            <option key={sound} value={sound} className="text-gray-900">
              {sound}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-white/70">
          Volume ({Math.round(settings.alert_volume * 100)}%)
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.alert_volume}
          onChange={(e) =>
            onChange({ alert_volume: parseFloat(e.target.value) })
          }
          className="w-full"
        />
      </label>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={settings.alert_enabled}
          onChange={(e) => onChange({ alert_enabled: e.target.checked })}
          className="accent-white"
        />
        <span className="text-white/70">Play alert when timer ends</span>
      </label>

      <button
        type="button"
        onClick={() => playAlert(settings.alert_sound, settings.alert_volume)}
        className="self-start px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm transition-colors cursor-pointer"
      >
        Test
      </button>
    </div>
  );
}
