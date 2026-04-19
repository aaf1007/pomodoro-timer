"use client";

import { THEMES, type ThemeId } from "@/lib/themes";

interface Props {
  current: ThemeId;
  onChange: (id: ThemeId) => void;
}

export default function ThemeSelector({ current, onChange }: Props) {
  return (
    <div className="flex gap-2" aria-label="Theme selector">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          aria-label={theme.label}
          title={theme.label}
          onClick={() => onChange(theme.id)}
          className="relative w-5 h-5 rounded-full transition-transform hover:scale-110 cursor-pointer"
          style={{ background: theme.accent }}
        >
          {current === theme.id && (
            <span className="absolute inset-0 rounded-full ring-2 ring-white/80 ring-offset-1 ring-offset-transparent" />
          )}
        </button>
      ))}
    </div>
  );
}
