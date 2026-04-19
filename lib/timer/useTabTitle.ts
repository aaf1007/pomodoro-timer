"use client";

import { useEffect } from "react";
import { applyTimerTitle, restoreTimerTitle } from "@/lib/tabTitle";
import { MODE_LABELS, type Mode } from "./sequence";

export function useTabTitle(remaining: number, running: boolean, mode: Mode) {
  useEffect(() => {
    if (running) {
      applyTimerTitle(remaining, MODE_LABELS[mode]);
    } else {
      restoreTimerTitle();
    }
  }, [remaining, running, mode]);

  useEffect(() => {
    return () => { restoreTimerTitle(); };
  }, []);
}
