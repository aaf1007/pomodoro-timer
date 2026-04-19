export const ALERT_SOUNDS = ["bell", "chime", "birds", "lofi"] as const;
export type AlertSound = (typeof ALERT_SOUNDS)[number];

export function playAlert(sound: AlertSound, volume: number): void {
  const clamped = Math.min(1, Math.max(0, volume));
  const audio = new Audio(`/sounds/${sound}.mp3`);
  audio.volume = clamped;
  audio.play().catch(() => {});
}
