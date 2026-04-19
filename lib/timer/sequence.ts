export type Mode = "pom" | "short" | "long";

export interface SequenceState {
  mode: Mode;
  pomosDoneInCycle: number;
}

export const DEFAULT_DURATIONS: Record<Mode, number> = {
  pom: 25,
  short: 5,
  long: 15,
};

export const MODE_LABELS: Record<Mode, string> = {
  pom: "Pomodoro",
  short: "Short Break",
  long: "Long Break",
};

export const MODES: Mode[] = ["pom", "short", "long"];

export function nextSequence(state: SequenceState): SequenceState {
  if (state.mode === "pom") {
    const pomosDone = state.pomosDoneInCycle + 1;
    if (pomosDone >= 4) {
      return { mode: "long", pomosDoneInCycle: 0 };
    }
    return { mode: "short", pomosDoneInCycle: pomosDone };
  }
  return { mode: "pom", pomosDoneInCycle: state.pomosDoneInCycle };
}
