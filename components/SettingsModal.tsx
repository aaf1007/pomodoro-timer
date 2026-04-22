"use client";

import { useEffect, useRef, useState } from "react";
import type { Settings } from "@/lib/storage/local";
import SettingsTabTimer from "./SettingsTabTimer";
import SettingsTabSounds from "./SettingsTabSounds";
import SettingsTabGeneral from "./SettingsTabGeneral";
import SettingsTabAccount from "./SettingsTabAccount";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
}

export interface SettingsTabProps {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
}

const TABS = ["timer", "sounds", "general", "account"] as const;
type Tab = (typeof TABS)[number];

export default function SettingsModal({
  open,
  onClose,
  settings,
  onChange,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("timer");
  const firstTabRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      previouslyFocusedRef.current =
        document.activeElement as HTMLElement | null;
      setActiveTab("timer");
      queueMicrotask(() => {
        firstTabRef.current?.focus();
      });
      wasOpenRef.current = true;
    } else if (!open && wasOpenRef.current) {
      previouslyFocusedRef.current?.focus();
      wasOpenRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[28rem] max-w-[90vw] p-5 rounded-xl bg-black/70 backdrop-blur-md text-white shadow-lg border border-white/10"
      >
        <div className="flex items-center gap-2 mb-3">
          {TABS.map((tab, i) => {
            const isActive = tab === activeTab;
            const label = tab.charAt(0).toUpperCase() + tab.slice(1);
            return (
              <button
                key={tab}
                ref={i === 0 ? firstTabRef : undefined}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-1 rounded text-xs uppercase tracking-widest cursor-pointer ${
                  isActive ? "bg-white/20" : "opacity-60 hover:opacity-100"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div>
          {activeTab === "timer" && (
            <SettingsTabTimer settings={settings} onChange={onChange} />
          )}
          {activeTab === "sounds" && (
            <SettingsTabSounds settings={settings} onChange={onChange} />
          )}
          {activeTab === "general" && (
            <SettingsTabGeneral settings={settings} onChange={onChange} />
          )}
          {activeTab === "account" && (
            <SettingsTabAccount settings={settings} onChange={onChange} />
          )}
        </div>
      </div>
    </div>
  );
}
