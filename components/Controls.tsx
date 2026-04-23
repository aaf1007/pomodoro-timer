"use client";

interface Props {
  running: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onOpenSettings?: () => void;
}

export default function Controls({
  running,
  onStart,
  onPause,
  onReset,
  onOpenSettings,
}: Props) {
  return (
    <div className="flex items-center gap-6">
      <button
        onClick={running ? onPause : onStart}
        className="px-10 py-3 rounded-full bg-white text-gray-900 font-semibold text-lg tracking-wide hover:bg-white/90 transition-colors cursor-pointer"
      >
        {running ? "pause" : "start"}
      </button>
      <button
        onClick={onReset}
        aria-label="Reset timer"
        className="text-white/60 hover:text-white transition-colors cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          aria-label="Open settings"
          className="text-white/60 hover:text-white transition-colors cursor-pointer text-xl leading-none"
        >
          ⚙
        </button>
      )}
    </div>
  );
}
