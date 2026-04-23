"use client";

import { useState } from "react";
import type { SettingsTabProps } from "@/components/SettingsModal";
import { THEMES } from "@/lib/themes";
import { requestPermissionIfNeeded } from "@/lib/notifications";

export default function SettingsTabGeneral({
  settings,
  onChange,
}: SettingsTabProps) {
  const [denyNote, setDenyNote] = useState(false);

  async function handleNotificationsToggle(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const nextOn = e.target.checked;
    if (!nextOn) {
      setDenyNote(false);
      onChange({ notifications_enabled: false });
      return;
    }
    const result = await requestPermissionIfNeeded();
    if (result === "granted") {
      setDenyNote(false);
      onChange({ notifications_enabled: true });
    } else {
      setDenyNote(true);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section>
        <div className="text-xs uppercase tracking-widest opacity-70 mb-2">
          Theme
        </div>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((theme) => {
            const isActive = theme.id === settings.theme;
            return (
              <button
                key={theme.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onChange({ theme: theme.id })}
                className={`px-3 py-2 rounded text-sm text-left cursor-pointer border border-white/10 transition ${
                  isActive
                    ? "bg-white/20 ring-2 ring-white/60"
                    : "bg-white/5 opacity-70 hover:opacity-100"
                }`}
              >
                {theme.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={settings.notifications_enabled}
            onChange={handleNotificationsToggle}
          />
          <span>Desktop notifications</span>
        </label>
        {denyNote && (
          <p className="mt-1 text-xs text-amber-300/90">
            Notifications blocked by browser. Enable in system settings.
          </p>
        )}
      </section>

      <section>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={settings.spotify_enabled}
            onChange={(e) => onChange({ spotify_enabled: e.target.checked })}
          />
          <span>Spotify / lofi embed</span>
        </label>
      </section>
    </div>
  );
}
