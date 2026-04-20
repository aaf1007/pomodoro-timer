"use client";

import type { MigrationPromptState } from "@/lib/storage/useCloudSync";

interface MigrationPromptProps {
  state: MigrationPromptState;
  onResolve: (choice: "keep-cloud" | "overwrite-cloud" | "merge") => void;
}

export default function MigrationPrompt({ state, onResolve }: MigrationPromptProps) {
  const { localCount, cloudCount } = state;

  const btnClass =
    "px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm backdrop-blur-sm transition-colors cursor-pointer";
  const primaryClass =
    "px-3 py-1.5 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer";

  return (
    <div
      role="dialog"
      aria-label="Merge todos"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div className="w-[22rem] p-5 rounded-xl bg-black/70 backdrop-blur-md text-white shadow-lg border border-white/10">
        <h2 className="text-sm uppercase tracking-widest mb-3">Sync todos</h2>
        <p className="text-sm text-white/80 mb-4">
          You have {localCount} local todo{localCount === 1 ? "" : "s"} and {cloudCount}{" "}
          cloud todo{cloudCount === 1 ? "" : "s"}. Pick how to merge:
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onResolve("merge")}
            className={primaryClass}
          >
            Merge
          </button>
          <button
            type="button"
            onClick={() => onResolve("keep-cloud")}
            className={btnClass}
          >
            Keep cloud
          </button>
          <button
            type="button"
            onClick={() => onResolve("overwrite-cloud")}
            className={btnClass}
          >
            Overwrite cloud
          </button>
        </div>
      </div>
    </div>
  );
}
