"use client";

import { useEffect, useState } from "react";
import { THEMES, type ThemeId } from "@/lib/themes";

interface Props {
  themeId: ThemeId;
}

export default function BackgroundLayer({ themeId }: Props) {
  const [current, setCurrent] = useState<ThemeId>(themeId);
  const [fading, setFading] = useState(false);

  // Derived: non-null only while a transition is in flight
  const next: ThemeId | null = themeId !== current ? themeId : null;

  useEffect(() => {
    if (!next) {
      // Theme reverted before transition finished — cancel the fade
      const reset = setTimeout(() => setFading(false), 0);
      return () => clearTimeout(reset);
    }
    // Small delay lets the next video element mount and begin loading
    const startFade = setTimeout(() => setFading(true), 50);
    const finish = setTimeout(() => {
      setCurrent(next);
      setFading(false);
    }, 750);
    return () => {
      clearTimeout(startFade);
      clearTimeout(finish);
    };
  }, [next]);

  const currentTheme = THEMES.find((t) => t.id === current) ?? THEMES[0];
  const nextTheme = next ? THEMES.find((t) => t.id === next) ?? null : null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <video
        key={current}
        src={currentTheme.video}
        poster={currentTheme.poster}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: fading ? 0 : 1,
          transition: "opacity 0.7s ease",
        }}
      />

      {nextTheme && (
        <video
          key={next}
          src={nextTheme.video}
          poster={nextTheme.poster}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: fading ? 1 : 0,
            transition: "opacity 0.7s ease",
          }}
        />
      )}

      <div
        data-overlay
        className="absolute inset-0"
        style={{ background: currentTheme.overlay }}
      />
    </div>
  );
}
