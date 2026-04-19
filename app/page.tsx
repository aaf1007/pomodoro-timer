"use client";

import { useState } from "react";
import Timer from "@/components/Timer";
import BackgroundLayer from "@/components/BackgroundLayer";
import ThemeSelector from "@/components/ThemeSelector";
import { DEFAULT_THEME_ID, getTheme, type ThemeId } from "@/lib/themes";

export default function Home() {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const theme = getTheme(themeId);

  return (
    <>
      <BackgroundLayer themeId={themeId} />
      <main className="min-h-screen flex items-center justify-center">
        <Timer accent={theme.accent} />
      </main>
      <div className="fixed bottom-6 right-6">
        <ThemeSelector current={themeId} onChange={setThemeId} />
      </div>
    </>
  );
}
