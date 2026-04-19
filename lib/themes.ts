export type ThemeId = "seoul" | "tokyo" | "paris" | "fire";

export interface Theme {
  id: ThemeId;
  label: string;
  video: string;
  poster: string;
  accent: string;
  overlay: string;
}

export const THEMES: Theme[] = [
  {
    id: "seoul",
    label: "Seoul Sunrise",
    video: "/bg/seoul.webm",
    poster: "/bg/seoul.jpg",
    accent: "#f97316",
    overlay: "rgba(0,0,0,0.38)",
  },
  {
    id: "tokyo",
    label: "Tokyo Sakura",
    video: "/bg/tokyo.webm",
    poster: "/bg/tokyo.jpg",
    accent: "#f472b6",
    overlay: "rgba(0,0,0,0.32)",
  },
  {
    id: "paris",
    label: "Rainy Paris",
    video: "/bg/paris.webm",
    poster: "/bg/paris.jpg",
    accent: "#60a5fa",
    overlay: "rgba(0,0,0,0.48)",
  },
  {
    id: "fire",
    label: "Cozy Fireplace",
    video: "/bg/fire.webm",
    poster: "/bg/fire.jpg",
    accent: "#ef4444",
    overlay: "rgba(0,0,0,0.30)",
  },
];

export const DEFAULT_THEME_ID: ThemeId = "seoul";

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
