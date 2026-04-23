export const ALERT_SOUNDS = ["bell", "chime", "birds", "lofi"] as const;
export type AlertSound = (typeof ALERT_SOUNDS)[number];

const inflight = new Set<HTMLAudioElement>();

export function playAlert(sound: AlertSound, volume: number): void {
  const clamped = Math.min(1, Math.max(0, volume));
  const audio = new Audio(`/sounds/${sound}.mp3`);
  audio.volume = clamped;
  inflight.add(audio);
  const release = () => inflight.delete(audio);
  audio.addEventListener("ended", release);
  audio.addEventListener("error", () => {
    console.warn(`[audio] load failed for ${sound}`, audio.error);
    release();
  });
  audio.play().catch((err) => {
    console.warn(`[audio] play rejected for ${sound}`, err);
    release();
  });
}
