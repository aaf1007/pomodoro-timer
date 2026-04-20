"use client";

import { useEffect, useState } from "react";
import Timer from "@/components/Timer";
import TodoPanel from "@/components/TodoPanel";
import BackgroundLayer from "@/components/BackgroundLayer";
import ThemeSelector from "@/components/ThemeSelector";
import AuthButton from "@/components/AuthButton";
import MigrationPrompt from "@/components/MigrationPrompt";
import { DEFAULT_THEME_ID, getTheme, type ThemeId } from "@/lib/themes";
import { loadTodos, saveTodos, type Todo } from "@/lib/storage/local";
import { useCloudSync } from "@/lib/storage/useCloudSync";

export default function Home() {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const theme = getTheme(themeId);

  // Lazy initializer reads from localStorage on first render (client component).
  const [todos, setTodos] = useState<Todo[]>(() =>
    typeof window !== "undefined" ? loadTodos() : [],
  );

  // Persist to localStorage on change.
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const { migrationPrompt, resolveMigration } = useCloudSync({ todos, setTodos });

  return (
    <>
      <BackgroundLayer themeId={themeId} />
      <div className="fixed top-6 right-6 z-10">
        <AuthButton />
      </div>
      <main className="min-h-screen flex items-center justify-center gap-16">
        <Timer accent={theme.accent} />
        <TodoPanel todos={todos} setTodos={setTodos} />
      </main>
      <div className="fixed bottom-6 right-6">
        <ThemeSelector current={themeId} onChange={setThemeId} />
      </div>
      {migrationPrompt && (
        <MigrationPrompt state={migrationPrompt} onResolve={resolveMigration} />
      )}
    </>
  );
}
