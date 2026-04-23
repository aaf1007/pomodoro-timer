"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthButton from "@/components/AuthButton";
import type { SettingsTabProps } from "@/components/SettingsModal";
import type { CloudSyncStatus } from "@/lib/storage/useCloudSync";

interface AuthedUser {
  id: string;
  email: string | null;
}

export interface SettingsTabAccountProps extends SettingsTabProps {
  syncStatus?: CloudSyncStatus;
}

const SYNC_STATUS_LABELS: Record<CloudSyncStatus, string> = {
  anonymous: "Cloud sync: idle",
  loading: "Syncing…",
  synced: "Synced ✓",
  error: "Sync error",
};

export default function SettingsTabAccount({
  syncStatus,
}: SettingsTabAccountProps) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AuthedUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data?.user) {
        setUser({ id: data.user.id, email: data.user.email ?? null });
      } else {
        setUser(null);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (
        _event: string,
        session: { user?: { id: string; email?: string | null } } | null,
      ) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email ?? null });
        } else {
          setUser(null);
        }
      },
    );

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, [supabase]);

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }

  const btnClass =
    "px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm backdrop-blur-sm transition-colors cursor-pointer";

  return (
    <div className="flex flex-col gap-3 text-white">
      {user ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/80 max-w-[18rem] truncate">
            Signed in as {user.email ?? "anonymous user"}
          </span>
          <button onClick={handleSignOut} className={btnClass}>
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AuthButton />
          <p className="text-xs text-white/60">
            Sign in to sync across devices.
          </p>
        </div>
      )}

      {syncStatus !== undefined && (
        <p className="text-xs text-white/60">{SYNC_STATUS_LABELS[syncStatus]}</p>
      )}
    </div>
  );
}
