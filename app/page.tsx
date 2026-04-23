"use client";

import { useCallback, useEffect, useState } from "react";
import Timer from "@/components/Timer";
import TodoPanel from "@/components/TodoPanel";
import BackgroundLayer from "@/components/BackgroundLayer";
import AuthButton from "@/components/AuthButton";
import MigrationPrompt from "@/components/MigrationPrompt";
import SettingsModal from "@/components/SettingsModal";
import { getTheme } from "@/lib/themes";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  loadTodos,
  saveTodos,
  type Settings,
  type Todo,
} from "@/lib/storage/local";
import { useCloudSync } from "@/lib/storage/useCloudSync";

export default function Home() {
  const [settings, setSettings] = useState<Settings>(() =>
    typeof window !== "undefined" ? loadSettings() : DEFAULT_SETTINGS,
  );

  const [todos, setTodos] = useState<Todo[]>(() =>
    typeof window !== "undefined" ? loadTodos() : [],
  );

  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const onChangeSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((s) => {
      const changed = (Object.keys(partial) as (keyof Settings)[]).some(
        (k) => s[k] !== partial[k],
      );
      if (!changed) return s;
      return { ...s, ...partial, updated_at: new Date().toISOString() };
    });
  }, []);

  const { status, migrationPrompt, resolveMigration, isResolvingMigration } =
    useCloudSync({
      todos,
      setTodos,
      settings,
      setSettings,
    });

  const theme = getTheme(settings.theme);

  return (
    <>
      <BackgroundLayer themeId={settings.theme} />
      <div className="fixed top-6 right-6 z-10">
        <AuthButton />
      </div>
      <main className="min-h-screen flex items-center justify-center gap-16">
        <Timer
          accent={theme.accent}
          durations={{
            pom: settings.pomodoro_min,
            short: settings.short_min,
            long: settings.long_min,
          }}
          alertSound={settings.alert_sound}
          alertVolume={settings.alert_volume}
          alertEnabled={settings.alert_enabled}
          notificationsEnabled={settings.notifications_enabled}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <TodoPanel todos={todos} setTodos={setTodos} />
      </main>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={onChangeSettings}
        syncStatus={status}
      />
      {migrationPrompt && (
        <MigrationPrompt
          state={migrationPrompt}
          onResolve={resolveMigration}
          isResolving={isResolvingMigration}
        />
      )}
    </>
  );
}
