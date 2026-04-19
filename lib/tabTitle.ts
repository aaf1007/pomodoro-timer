const DEFAULT_TITLE = "study-with-ant.io";

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function applyTimerTitle(ms: number, modeLabel: string): void {
  document.title = `${formatCountdown(ms)} · ${modeLabel}`;
}

export function restoreTimerTitle(): void {
  document.title = DEFAULT_TITLE;
}
