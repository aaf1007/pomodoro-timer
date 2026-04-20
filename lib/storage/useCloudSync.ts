"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Todo } from "./local";
import type { CloudSettings, CloudTodo } from "./sync";
import { mergeTodos } from "./sync";
import { fromCloudTodos, toCloudTodo, toCloudTodos } from "./cloudTodos";
import {
  deleteCloudTodos,
  fetchCloudSettings,
  fetchCloudTodos,
  upsertCloudSettings,
  upsertCloudTodos,
} from "./cloud";

export type CloudSyncStatus = "anonymous" | "loading" | "synced" | "error";

export interface MigrationPromptState {
  localCount: number;
  cloudCount: number;
}

type MigrationChoice = "keep-cloud" | "overwrite-cloud" | "merge";

export interface UseCloudSyncResult {
  status: CloudSyncStatus;
  migrationPrompt: MigrationPromptState | null;
  resolveMigration: (choice: MigrationChoice) => void;
  errorMessage: string | null;
}

interface UseCloudSyncOptions {
  todos: Todo[];
  setTodos: (next: Todo[]) => void;
}

const PUSH_DEBOUNCE_MS = 400;

// TODO(phase-6): once the unified local settings shape exists, map it into
// `Partial<CloudSettings>` and pipe through `pushLocalSettings` / apply results
// from `pullCloudSettings`. For now we only call pull on sign-in so the signed-in
// plumbing is exercised; Phase 6 will wire push from the SettingsModal.
export async function pullCloudSettings(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<CloudSettings | null> {
  return fetchCloudSettings(supabase, userId);
}

export async function pushLocalSettings(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  partial: Partial<CloudSettings>,
): Promise<void> {
  return upsertCloudSettings(supabase, userId, partial);
}

export function useCloudSync(opts: UseCloudSyncOptions): UseCloudSyncResult {
  const { todos, setTodos } = opts;

  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<CloudSyncStatus>("anonymous");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [migrationPrompt, setMigrationPrompt] =
    useState<MigrationPromptState | null>(null);

  // Latest todos snapshot for async callbacks without stale-closure bugs.
  const todosRef = useRef<Todo[]>(todos);
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  // Last-seen cloud state: id -> updated_at. Used by the diff-based pushes so
  // we don't re-upsert rows that are already current in the cloud.
  const lastSyncedRef = useRef<Map<string, string>>(new Map());
  const pendingMigrationRef = useRef<{
    local: Todo[];
    cloud: CloudTodo[];
  } | null>(null);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSyncDoneRef = useRef(false);

  function snapshotSynced(cloud: CloudTodo[]) {
    const map = new Map<string, string>();
    for (const t of cloud) map.set(t.id, t.updated_at);
    lastSyncedRef.current = map;
  }

  const runInitialSync = useCallback(
    async (uid: string) => {
      setStatus("loading");
      setErrorMessage(null);
      initialSyncDoneRef.current = false;
      try {
        const [cloudTodos] = await Promise.all([
          fetchCloudTodos(supabase, uid),
          pullCloudSettings(supabase, uid),
        ]);
        const local = todosRef.current;

        if (cloudTodos.length === 0 && local.length === 0) {
          // Nothing on either side — already synced.
          snapshotSynced([]);
          initialSyncDoneRef.current = true;
          setStatus("synced");
          return;
        }

        if (cloudTodos.length === 0 && local.length > 0) {
          const toPush = toCloudTodos(local, uid);
          await upsertCloudTodos(supabase, uid, toPush);
          snapshotSynced(toPush);
          initialSyncDoneRef.current = true;
          setStatus("synced");
          return;
        }

        if (cloudTodos.length > 0 && local.length === 0) {
          const next = fromCloudTodos(cloudTodos);
          setTodos(next);
          snapshotSynced(cloudTodos);
          initialSyncDoneRef.current = true;
          setStatus("synced");
          return;
        }

        // Both sides non-empty: prompt user.
        pendingMigrationRef.current = { local, cloud: cloudTodos };
        setMigrationPrompt({
          localCount: local.length,
          cloudCount: cloudTodos.length,
        });
        // status stays "loading" until resolveMigration runs.
      } catch (err) {
        setStatus("error");
        setErrorMessage(errToMessage(err));
      }
    },
    [supabase, setTodos],
  );

  // Subscribe to auth state.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      const uid = data?.user?.id ?? null;
      setUserId(uid);
      if (uid) void runInitialSync(uid);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (
        _event: string,
        session: { user?: { id: string } } | null,
      ) => {
        const uid = session?.user?.id ?? null;
        setUserId(uid);
        if (uid) {
          void runInitialSync(uid);
        } else {
          // Sign out: reset status; do not touch local todos.
          lastSyncedRef.current = new Map();
          pendingMigrationRef.current = null;
          initialSyncDoneRef.current = false;
          setMigrationPrompt(null);
          setErrorMessage(null);
          setStatus("anonymous");
        }
      },
    );

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, [supabase, runInitialSync]);

  const resolveMigration = useCallback(
    (choice: MigrationChoice) => {
      const pending = pendingMigrationRef.current;
      const uid = userId;
      if (!pending || !uid) return;
      pendingMigrationRef.current = null;
      setMigrationPrompt(null);

      (async () => {
        try {
          if (choice === "keep-cloud") {
            const next = fromCloudTodos(pending.cloud);
            setTodos(next);
            snapshotSynced(pending.cloud);
          } else if (choice === "overwrite-cloud") {
            const localAsCloud = toCloudTodos(pending.local, uid);
            const cloudOnlyIds = pending.cloud
              .filter((c) => !pending.local.some((l) => l.id === c.id))
              .map((c) => c.id);
            if (cloudOnlyIds.length > 0) {
              await deleteCloudTodos(supabase, uid, cloudOnlyIds);
            }
            if (localAsCloud.length > 0) {
              await upsertCloudTodos(supabase, uid, localAsCloud);
            }
            snapshotSynced(localAsCloud);
          } else {
            // merge (default)
            const localAsCloud = toCloudTodos(pending.local, uid);
            const merged = mergeTodos(localAsCloud, pending.cloud);
            await upsertCloudTodos(supabase, uid, merged);
            setTodos(fromCloudTodos(merged));
            snapshotSynced(merged);
          }
          initialSyncDoneRef.current = true;
          setStatus("synced");
        } catch (err) {
          setStatus("error");
          setErrorMessage(errToMessage(err));
        }
      })();
    },
    [supabase, userId, setTodos],
  );

  const diffPush = useCallback(
    async (uid: string) => {
      try {
        const current = todosRef.current;
        const last = lastSyncedRef.current;

        const toUpsert: CloudTodo[] = [];
        const currentIds = new Set<string>();
        for (const t of current) {
          currentIds.add(t.id);
          const lastUpdated = last.get(t.id);
          if (lastUpdated === undefined || lastUpdated !== t.updated_at) {
            toUpsert.push(toCloudTodo(t, uid));
          }
        }

        const toDelete: string[] = [];
        for (const id of last.keys()) {
          if (!currentIds.has(id)) toDelete.push(id);
        }

        if (toUpsert.length === 0 && toDelete.length === 0) return;

        if (toUpsert.length > 0) {
          await upsertCloudTodos(supabase, uid, toUpsert);
        }
        if (toDelete.length > 0) {
          await deleteCloudTodos(supabase, uid, toDelete);
        }

        // Update last-synced snapshot from current local state.
        const next = new Map<string, string>();
        for (const t of current) next.set(t.id, t.updated_at);
        lastSyncedRef.current = next;
        setStatus("synced");
      } catch (err) {
        setStatus("error");
        setErrorMessage(errToMessage(err));
      }
    },
    [supabase],
  );

  // Debounced diff-push on todos change, only after initial sync.
  useEffect(() => {
    if (!userId) return;
    if (!initialSyncDoneRef.current) return;

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      void diffPush(userId);
    }, PUSH_DEBOUNCE_MS);

    return () => {
      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current);
        pushTimerRef.current = null;
      }
    };
  }, [todos, userId, diffPush]);

  return { status, migrationPrompt, resolveMigration, errorMessage };
}

function errToMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Unknown error";
}
