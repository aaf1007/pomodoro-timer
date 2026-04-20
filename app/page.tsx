"use client";

import { useState } from "react";
import Timer from "@/components/Timer";
import TodoPanel from "@/components/TodoPanel";
import BackgroundLayer from "@/components/BackgroundLayer";
import ThemeSelector from "@/components/ThemeSelector";
import AuthButton from "@/components/AuthButton";
import { DEFAULT_THEME_ID, getTheme, type ThemeId } from "@/lib/themes";

export default function Home() {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const theme = getTheme(themeId);

  return (
    <>
      <BackgroundLayer themeId={themeId} />
      <div className="fixed top-6 right-6 z-10">
        <AuthButton />
      </div>
      <main className="min-h-screen flex items-center justify-center gap-16">
        <Timer accent={theme.accent} />
        <TodoPanel />
      </main>
      <div className="fixed bottom-6 right-6">
        <ThemeSelector current={themeId} onChange={setThemeId} />
      </div>
    </>
  );
}
