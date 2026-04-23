import { act, renderHook, waitFor } from "@testing-library/react";
import { useCloudSync } from "./useCloudSync";
import { DEFAULT_SETTINGS, type Settings, type Todo } from "./local";
import type { CloudSettings, CloudTodo } from "./sync";

const getUser = jest.fn();
const onAuthStateChange = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: (...args: unknown[]) => getUser(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
    },
  }),
}));

const fetchCloudTodos = jest.fn();
const upsertCloudTodos = jest.fn();
const deleteCloudTodos = jest.fn();
const fetchCloudSettings = jest.fn();
const upsertCloudSettings = jest.fn();

jest.mock("./cloud", () => ({
  fetchCloudTodos: (...args: unknown[]) => fetchCloudTodos(...args),
  upsertCloudTodos: (...args: unknown[]) => upsertCloudTodos(...args),
  deleteCloudTodos: (...args: unknown[]) => deleteCloudTodos(...args),
  fetchCloudSettings: (...args: unknown[]) => fetchCloudSettings(...args),
  upsertCloudSettings: (...args: unknown[]) => upsertCloudSettings(...args),
}));

function makeTodo(partial: Partial<Todo>): Todo {
  return {
    id: partial.id ?? "id",
    label: partial.label ?? "label",
    done: partial.done ?? false,
    position: partial.position ?? 0,
    updated_at: partial.updated_at ?? "2026-04-18T00:00:00.000Z",
  };
}

function makeCloudTodo(partial: Partial<CloudTodo>): CloudTodo {
  return {
    id: partial.id ?? "id",
    user_id: partial.user_id ?? "user-1",
    label: partial.label ?? "label",
    done: partial.done ?? false,
    position: partial.position ?? 0,
    updated_at: partial.updated_at ?? "2026-04-18T00:00:00.000Z",
  };
}

function makeSettings(partial: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, ...partial };
}

function makeCloudSettings(partial: Partial<CloudSettings> = {}): CloudSettings {
  return {
    ...DEFAULT_SETTINGS,
    user_id: "user-1",
    updated_at: "2026-04-18T00:00:00.000Z",
    ...partial,
  };
}

interface RenderOpts {
  todos?: Todo[];
  setTodos?: (next: Todo[]) => void;
  settings?: Settings;
  setSettings?: (next: Settings) => void;
}
function renderSync(opts: RenderOpts = {}) {
  // Capture defaults once so the refs stay stable across re-renders —
  // re-creating jest.fn() inside renderHook's callback churns useCallback
  // deps and re-triggers initial sync, masking real behaviour.
  const resolved = {
    todos: opts.todos ?? [],
    setTodos: opts.setTodos ?? jest.fn(),
    settings: opts.settings ?? makeSettings(),
    setSettings: opts.setSettings ?? jest.fn(),
  };
  return renderHook(() => useCloudSync(resolved));
}

beforeEach(() => {
  getUser.mockReset();
  onAuthStateChange.mockReset();
  fetchCloudTodos.mockReset();
  upsertCloudTodos.mockReset();
  deleteCloudTodos.mockReset();
  fetchCloudSettings.mockReset();
  upsertCloudSettings.mockReset();

  upsertCloudTodos.mockResolvedValue(undefined);
  deleteCloudTodos.mockResolvedValue(undefined);
  fetchCloudSettings.mockResolvedValue(null);
  upsertCloudSettings.mockResolvedValue(undefined);

  onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
});

describe("useCloudSync", () => {
  it("should_start_anonymous_when_signed_out", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { result } = renderSync();
    await waitFor(() => {
      expect(result.current.status).toBe("anonymous");
    });
    expect(fetchCloudTodos).not.toHaveBeenCalled();
    expect(fetchCloudSettings).not.toHaveBeenCalled();
  });

  it("should_push_local_when_signed_in_with_empty_cloud", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fetchCloudTodos.mockResolvedValue([]);
    const { result } = renderSync({
      todos: [makeTodo({ id: "a", label: "a" })],
    });

    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(upsertCloudTodos).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      expect.arrayContaining([expect.objectContaining({ id: "a" })]),
    );
  });

  it("should_pull_cloud_when_signed_in_with_empty_local", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const cloud = [makeCloudTodo({ id: "c", label: "cloudy" })];
    fetchCloudTodos.mockResolvedValue(cloud);
    const setTodosSpy = jest.fn();

    const { result } = renderSync({ todos: [], setTodos: setTodosSpy });

    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(setTodosSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "c", label: "cloudy" })]),
    );
  });

  it("should_merge_silently_when_local_ids_subset_of_cloud", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const cloud = [
      makeCloudTodo({ id: "a", label: "cloud-a" }),
      makeCloudTodo({ id: "b", label: "cloud-b" }),
    ];
    fetchCloudTodos.mockResolvedValue(cloud);
    const setTodosSpy = jest.fn();

    const { result } = renderSync({
      todos: [makeTodo({ id: "a", label: "local-a" })],
      setTodos: setTodosSpy,
    });

    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(result.current.migrationPrompt).toBeNull();
    expect(setTodosSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "a" }),
        expect.objectContaining({ id: "b" }),
      ]),
    );
    expect(upsertCloudTodos).not.toHaveBeenCalled();
  });

  it("should_emit_migrationPrompt_when_both_sides_non_empty", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fetchCloudTodos.mockResolvedValue([makeCloudTodo({ id: "c" })]);

    const { result } = renderSync({ todos: [makeTodo({ id: "a" })] });

    await waitFor(() => {
      expect(result.current.migrationPrompt).toEqual({
        localCount: 1,
        cloudCount: 1,
      });
    });
    expect(result.current.status).toBe("loading");
  });

  it("should_merge_and_push_when_resolveMigration_called_with_merge", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const cloud = [makeCloudTodo({ id: "c", label: "cloud", position: 1 })];
    fetchCloudTodos.mockResolvedValue(cloud);
    const setTodosSpy = jest.fn();

    const { result } = renderSync({
      todos: [makeTodo({ id: "a", label: "local", position: 0 })],
      setTodos: setTodosSpy,
    });

    await waitFor(() => {
      expect(result.current.migrationPrompt).not.toBeNull();
    });

    await act(async () => {
      result.current.resolveMigration("merge");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(upsertCloudTodos).toHaveBeenCalled();
    expect(setTodosSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "a" }),
        expect.objectContaining({ id: "c" }),
      ]),
    );
  });

  it("should_overwrite_local_when_keep_cloud_chosen", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const cloud = [makeCloudTodo({ id: "c", label: "cloud" })];
    fetchCloudTodos.mockResolvedValue(cloud);
    const setTodosSpy = jest.fn();

    const { result } = renderSync({
      todos: [makeTodo({ id: "a", label: "local" })],
      setTodos: setTodosSpy,
    });
    await waitFor(() => {
      expect(result.current.migrationPrompt).not.toBeNull();
    });

    await act(async () => {
      result.current.resolveMigration("keep-cloud");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(setTodosSpy).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "c" })]),
    );
  });

  it("should_push_and_delete_cloud_only_ids_when_overwrite_cloud_chosen", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const cloud = [
      makeCloudTodo({ id: "c", label: "cloud-only" }),
      makeCloudTodo({ id: "shared", label: "shared-cloud" }),
    ];
    fetchCloudTodos.mockResolvedValue(cloud);

    const setTodosSpy = jest.fn();
    const initialTodos = [
      makeTodo({ id: "shared", label: "shared-local" }),
      makeTodo({ id: "new", label: "local-new" }),
    ];

    const { result } = renderSync({
      todos: initialTodos,
      setTodos: setTodosSpy,
    });
    await waitFor(() => {
      expect(result.current.migrationPrompt).not.toBeNull();
    });

    await act(async () => {
      result.current.resolveMigration("overwrite-cloud");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(deleteCloudTodos).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      expect.arrayContaining(["c"]),
    );
    expect(upsertCloudTodos).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      expect.arrayContaining([
        expect.objectContaining({ id: "shared" }),
        expect.objectContaining({ id: "new" }),
      ]),
    );
  });

  it("should_run_initial_sync_once_when_INITIAL_SESSION_fires_after_getUser", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fetchCloudTodos.mockResolvedValue([]);

    let capturedCb:
      | ((event: string, session: { user?: { id: string } } | null) => void)
      | null = null;
    onAuthStateChange.mockImplementation((cb) => {
      capturedCb = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const { result } = renderSync();

    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(fetchCloudTodos).toHaveBeenCalledTimes(1);

    await act(async () => {
      capturedCb?.("INITIAL_SESSION", { user: { id: "user-1" } });
    });

    expect(fetchCloudTodos).toHaveBeenCalledTimes(1);
  });

  it("should_push_only_local_newer_rows_in_subset_merge", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const cloud = [
      makeCloudTodo({
        id: "a",
        label: "cloud-a",
        updated_at: "2026-04-18T00:00:00.000Z",
      }),
      makeCloudTodo({
        id: "b",
        label: "cloud-b",
        updated_at: "2026-04-18T00:00:00.000Z",
      }),
    ];
    fetchCloudTodos.mockResolvedValue(cloud);

    const { result } = renderSync({
      todos: [
        makeTodo({
          id: "a",
          label: "local-a-newer",
          updated_at: "2026-04-20T00:00:00.000Z",
        }),
      ],
    });

    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(result.current.migrationPrompt).toBeNull();
    expect(upsertCloudTodos).toHaveBeenCalledTimes(1);
    const pushedRows = upsertCloudTodos.mock.calls[0][2] as CloudTodo[];
    expect(pushedRows).toHaveLength(1);
    expect(pushedRows[0]).toMatchObject({ id: "a", label: "local-a-newer" });
  });

  it("should_set_status_error_when_push_fails_on_initial_sync", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fetchCloudTodos.mockResolvedValue([]);
    upsertCloudTodos.mockRejectedValueOnce(new Error("network boom"));

    const { result } = renderSync({ todos: [makeTodo({ id: "a" })] });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.errorMessage).toMatch(/boom/i);
  });

  it("should_resync_after_sign_out_and_back_in_same_uid", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fetchCloudTodos.mockResolvedValue([]);

    let capturedCb:
      | ((event: string, session: { user?: { id: string } } | null) => void)
      | null = null;
    onAuthStateChange.mockImplementation((cb) => {
      capturedCb = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const { result } = renderSync();

    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(fetchCloudTodos).toHaveBeenCalledTimes(1);

    await act(async () => {
      capturedCb?.("SIGNED_OUT", null);
    });
    await waitFor(() => {
      expect(result.current.status).toBe("anonymous");
    });

    await act(async () => {
      capturedCb?.("SIGNED_IN", { user: { id: "user-1" } });
    });
    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(fetchCloudTodos).toHaveBeenCalledTimes(2);
  });

  it("should_set_status_error_when_fetch_fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fetchCloudTodos.mockRejectedValue(new Error("boom"));
    const { result } = renderSync();
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.errorMessage).toMatch(/boom/i);
  });

  describe("settings sync", () => {
    it("should_push_local_settings_when_cloud_has_none", async () => {
      getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });
      fetchCloudTodos.mockResolvedValue([]);
      fetchCloudSettings.mockResolvedValue(null);

      const localSettings = makeSettings({
        pomodoro_min: 40,
        theme: "tokyo",
        updated_at: "2026-04-20T00:00:00.000Z",
      });
      const setSettingsSpy = jest.fn();

      const { result } = renderSync({
        settings: localSettings,
        setSettings: setSettingsSpy,
      });

      await waitFor(() => {
        expect(result.current.status).toBe("synced");
      });
      expect(upsertCloudSettings).toHaveBeenCalledWith(
        expect.anything(),
        "user-1",
        expect.objectContaining({
          user_id: "user-1",
          pomodoro_min: 40,
          theme: "tokyo",
          updated_at: "2026-04-20T00:00:00.000Z",
        }),
      );
      expect(setSettingsSpy).not.toHaveBeenCalled();
    });

    it("should_adopt_cloud_settings_when_updated_at_ties", async () => {
      // Tie-break matches mergeSettings (sync.ts): cloud wins ties. Strict-
      // greater on both sides would let divergent-content tie rows stay
      // permanently unreconciled.
      getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });
      fetchCloudTodos.mockResolvedValue([]);
      const cloudSettings = makeCloudSettings({
        pomodoro_min: 42,
        theme: "fire",
        updated_at: "2026-04-20T00:00:00.000Z",
      });
      fetchCloudSettings.mockResolvedValue(cloudSettings);

      const localSettings = makeSettings({
        pomodoro_min: 25,
        theme: "seoul",
        updated_at: "2026-04-20T00:00:00.000Z",
      });
      const setSettingsSpy = jest.fn();

      const { result } = renderSync({
        settings: localSettings,
        setSettings: setSettingsSpy,
      });

      await waitFor(() => {
        expect(result.current.status).toBe("synced");
      });
      expect(setSettingsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          pomodoro_min: 42,
          theme: "fire",
          updated_at: "2026-04-20T00:00:00.000Z",
        }),
      );
      expect(upsertCloudSettings).not.toHaveBeenCalled();
    });

    it("should_overwrite_local_settings_when_cloud_is_newer", async () => {
      getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });
      fetchCloudTodos.mockResolvedValue([]);
      const cloudSettings = makeCloudSettings({
        pomodoro_min: 50,
        theme: "fire",
        updated_at: "2026-04-22T00:00:00.000Z",
      });
      fetchCloudSettings.mockResolvedValue(cloudSettings);

      const localSettings = makeSettings({
        pomodoro_min: 25,
        theme: "seoul",
        updated_at: "2026-04-20T00:00:00.000Z",
      });
      const setSettingsSpy = jest.fn();

      const { result } = renderSync({
        settings: localSettings,
        setSettings: setSettingsSpy,
      });

      await waitFor(() => {
        expect(result.current.status).toBe("synced");
      });
      expect(setSettingsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          pomodoro_min: 50,
          theme: "fire",
          updated_at: "2026-04-22T00:00:00.000Z",
        }),
      );
      expect(upsertCloudSettings).not.toHaveBeenCalled();
    });

    it("should_overwrite_cloud_settings_when_local_is_newer", async () => {
      getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });
      fetchCloudTodos.mockResolvedValue([]);
      const cloudSettings = makeCloudSettings({
        pomodoro_min: 25,
        theme: "seoul",
        updated_at: "2026-04-10T00:00:00.000Z",
      });
      fetchCloudSettings.mockResolvedValue(cloudSettings);

      const localSettings = makeSettings({
        pomodoro_min: 45,
        theme: "paris",
        updated_at: "2026-04-21T00:00:00.000Z",
      });
      const setSettingsSpy = jest.fn();

      const { result } = renderSync({
        settings: localSettings,
        setSettings: setSettingsSpy,
      });

      await waitFor(() => {
        expect(result.current.status).toBe("synced");
      });
      expect(upsertCloudSettings).toHaveBeenCalledWith(
        expect.anything(),
        "user-1",
        expect.objectContaining({
          user_id: "user-1",
          pomodoro_min: 45,
          theme: "paris",
          updated_at: "2026-04-21T00:00:00.000Z",
        }),
      );
      expect(setSettingsSpy).not.toHaveBeenCalled();
    });

    it("should_not_clobber_cloud_settings_after_signout_and_back_in", async () => {
      getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });
      fetchCloudTodos.mockResolvedValue([]);
      const cloudSettings = makeCloudSettings({
        pomodoro_min: 35,
        updated_at: "2026-04-20T00:00:00.000Z",
      });
      fetchCloudSettings.mockResolvedValue(cloudSettings);

      let capturedCb:
        | ((
            event: string,
            session: { user?: { id: string } } | null,
          ) => void)
        | null = null;
      onAuthStateChange.mockImplementation((cb) => {
        capturedCb = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      const setSettingsSpy = jest.fn();
      const { result } = renderSync({
        settings: makeSettings({
          pomodoro_min: 25,
          updated_at: "2026-04-10T00:00:00.000Z",
        }),
        setSettings: setSettingsSpy,
      });

      await waitFor(() => {
        expect(result.current.status).toBe("synced");
      });
      // Initial sync pulled the newer cloud settings into local.
      expect(setSettingsSpy).toHaveBeenCalledTimes(1);
      expect(upsertCloudSettings).not.toHaveBeenCalled();

      // Sign out clears state; lastSyncedSettingsRef must reset so that when
      // the same user signs back in we don't skip settings reconciliation.
      await act(async () => {
        capturedCb?.("SIGNED_OUT", null);
      });
      await waitFor(() => {
        expect(result.current.status).toBe("anonymous");
      });

      await act(async () => {
        capturedCb?.("SIGNED_IN", { user: { id: "user-1" } });
      });
      await waitFor(() => {
        expect(result.current.status).toBe("synced");
      });
      // Re-sync must re-query settings and not push stale local values.
      expect(fetchCloudSettings).toHaveBeenCalledTimes(2);
      expect(upsertCloudSettings).not.toHaveBeenCalled();
    });

    it("should_push_settings_when_user_edits_while_signed_in", async () => {
      jest.useFakeTimers();
      try {
        getUser.mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        });
        fetchCloudTodos.mockResolvedValue([]);
        const cloudSettings = makeCloudSettings({
          pomodoro_min: 25,
          updated_at: "2026-04-20T00:00:00.000Z",
        });
        fetchCloudSettings.mockResolvedValue(cloudSettings);

        const initialSettings = makeSettings({
          pomodoro_min: 25,
          updated_at: "2026-04-20T00:00:00.000Z",
        });
        const editedSettings = makeSettings({
          pomodoro_min: 33,
          updated_at: "2026-04-21T00:00:00.000Z",
        });

        const { result, rerender } = renderHook(
          (props: { settings: Settings }) =>
            useCloudSync({
              todos: [],
              setTodos: jest.fn(),
              settings: props.settings,
              setSettings: jest.fn(),
            }),
          { initialProps: { settings: initialSettings } },
        );

        await waitFor(() => {
          expect(result.current.status).toBe("synced");
        });
        expect(upsertCloudSettings).not.toHaveBeenCalled();

        rerender({ settings: editedSettings });
        await act(async () => {
          jest.advanceTimersByTime(500);
        });

        await waitFor(() => {
          expect(upsertCloudSettings).toHaveBeenCalledWith(
            expect.anything(),
            "user-1",
            expect.objectContaining({
              user_id: "user-1",
              pomodoro_min: 33,
              updated_at: "2026-04-21T00:00:00.000Z",
            }),
          );
        });
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
