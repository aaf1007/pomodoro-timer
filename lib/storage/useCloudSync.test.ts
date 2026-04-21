import { act, renderHook, waitFor } from "@testing-library/react";
import { useCloudSync } from "./useCloudSync";
import type { Todo } from "./local";
import type { CloudTodo } from "./sync";

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

jest.mock("./cloud", () => ({
  fetchCloudTodos: (...args: unknown[]) => fetchCloudTodos(...args),
  upsertCloudTodos: (...args: unknown[]) => upsertCloudTodos(...args),
  deleteCloudTodos: (...args: unknown[]) => deleteCloudTodos(...args),
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

interface Harness {
  todos: Todo[];
  setTodos: (next: Todo[]) => void;
}
function makeHarness(initial: Todo[] = []): Harness {
  const state = { todos: initial };
  return {
    get todos() {
      return state.todos;
    },
    setTodos: (next: Todo[]) => {
      state.todos = next;
    },
  } as unknown as Harness;
}

beforeEach(() => {
  getUser.mockReset();
  onAuthStateChange.mockReset();
  fetchCloudTodos.mockReset();
  upsertCloudTodos.mockReset();
  deleteCloudTodos.mockReset();

  upsertCloudTodos.mockResolvedValue(undefined);
  deleteCloudTodos.mockResolvedValue(undefined);

  onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
});

describe("useCloudSync", () => {
  it("should_start_anonymous_when_signed_out", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const h = makeHarness();
    const { result } = renderHook(() =>
      useCloudSync({ todos: h.todos, setTodos: h.setTodos }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe("anonymous");
    });
    expect(fetchCloudTodos).not.toHaveBeenCalled();
  });

  it("should_push_local_when_signed_in_with_empty_cloud", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fetchCloudTodos.mockResolvedValue([]);
    const initial = [makeTodo({ id: "a", label: "a" })];
    const h = makeHarness(initial);
    const { result } = renderHook(() =>
      useCloudSync({ todos: h.todos, setTodos: h.setTodos }),
    );

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
    const h = makeHarness([]);
    const setTodosSpy = jest.fn();

    const { result } = renderHook(() =>
      useCloudSync({ todos: h.todos, setTodos: setTodosSpy }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(setTodosSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "c", label: "cloudy" })]),
    );
  });

  it("should_emit_migrationPrompt_when_both_sides_non_empty", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fetchCloudTodos.mockResolvedValue([makeCloudTodo({ id: "c" })]);
    const h = makeHarness([makeTodo({ id: "a" })]);

    const { result } = renderHook(() =>
      useCloudSync({ todos: h.todos, setTodos: h.setTodos }),
    );

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

    const { result } = renderHook(() =>
      useCloudSync({
        todos: [makeTodo({ id: "a", label: "local", position: 0 })],
        setTodos: setTodosSpy,
      }),
    );

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

    const { result } = renderHook(() =>
      useCloudSync({
        todos: [makeTodo({ id: "a", label: "local" })],
        setTodos: setTodosSpy,
      }),
    );
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

    const { result } = renderHook(() =>
      useCloudSync({ todos: initialTodos, setTodos: setTodosSpy }),
    );
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

    const { result } = renderHook(() =>
      useCloudSync({ todos: [], setTodos: jest.fn() }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("synced");
    });
    expect(fetchCloudTodos).toHaveBeenCalledTimes(1);

    await act(async () => {
      capturedCb?.("INITIAL_SESSION", { user: { id: "user-1" } });
    });

    expect(fetchCloudTodos).toHaveBeenCalledTimes(1);
  });

  it("should_set_status_error_when_fetch_fails", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fetchCloudTodos.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() =>
      useCloudSync({ todos: [], setTodos: jest.fn() }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.errorMessage).toMatch(/boom/i);
  });
});
