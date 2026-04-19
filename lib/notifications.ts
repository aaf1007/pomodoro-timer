import type { Mode } from "./timer/sequence";

const SESSION_LABELS: Record<Mode, string> = {
  pom: "Pomodoro",
  short: "Short Break",
  long: "Long Break",
};

const NEXT_LABELS: Record<Mode, string> = {
  pom: "Time to focus!",
  short: "Short Break starting — take a breather.",
  long: "Long Break starting — well earned!",
};

export function isNotificationSupported(): boolean {
  return typeof Notification !== "undefined";
}

export async function requestPermissionIfNeeded(): Promise<
  NotificationPermission | undefined
> {
  if (!isNotificationSupported()) return undefined;
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

export function notifySessionEnd(completedMode: Mode): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  const label = SESSION_LABELS[completedMode];
  const body = NEXT_LABELS[completedMode];

  new Notification(`${label} complete!`, { body, icon: "/favicon.ico" });
}
