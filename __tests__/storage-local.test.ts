import {
  loadTodos,
  saveTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  TODOS_KEY,
} from "@/lib/storage/local";

beforeEach(() => {
  localStorage.clear();
});

describe("loadTodos", () => {
  it("should_return_empty_array_when_nothing_in_storage", () => {
    expect(loadTodos()).toEqual([]);
  });

  it("should_return_parsed_todos_from_storage", () => {
    const todos = [{ id: "1", label: "ship v1", done: false, position: 0, updated_at: "2026-04-18T00:00:00.000Z" }];
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
    expect(loadTodos()).toEqual(todos);
  });

  it("should_return_empty_array_when_storage_is_corrupt", () => {
    localStorage.setItem(TODOS_KEY, "not-json{{{");
    expect(loadTodos()).toEqual([]);
  });
});

describe("saveTodos", () => {
  it("should_persist_todos_to_localStorage", () => {
    const todos = [{ id: "1", label: "test", done: false, position: 0, updated_at: "2026-04-18T00:00:00.000Z" }];
    saveTodos(todos);
    expect(JSON.parse(localStorage.getItem(TODOS_KEY)!)).toEqual(todos);
  });
});

describe("addTodo", () => {
  it("should_create_todo_with_label_done_false_and_next_position", () => {
    const existing = [{ id: "1", label: "first", done: false, position: 0, updated_at: "2026-04-18T00:00:00.000Z" }];
    const { todos, added } = addTodo(existing, "second");
    expect(todos).toHaveLength(2);
    expect(added!.label).toBe("second");
    expect(added!.done).toBe(false);
    expect(added!.position).toBe(1);
    expect(added!.id).toBeTruthy();
  });

  it("should_assign_position_0_when_list_is_empty", () => {
    const { added } = addTodo([], "first task");
    expect(added!.position).toBe(0);
  });

  it("should_not_add_todo_with_blank_label", () => {
    const { todos, added } = addTodo([], "   ");
    expect(todos).toHaveLength(0);
    expect(added).toBeNull();
  });
});

describe("toggleTodo", () => {
  it("should_flip_done_from_false_to_true", () => {
    const todos = [{ id: "1", label: "task", done: false, position: 0, updated_at: "2026-04-18T00:00:00.000Z" }];
    const result = toggleTodo(todos, "1");
    expect(result[0].done).toBe(true);
  });

  it("should_flip_done_from_true_to_false", () => {
    const todos = [{ id: "1", label: "task", done: true, position: 0, updated_at: "2026-04-18T00:00:00.000Z" }];
    const result = toggleTodo(todos, "1");
    expect(result[0].done).toBe(false);
  });

  it("should_leave_other_todos_unchanged", () => {
    const todos = [
      { id: "1", label: "a", done: false, position: 0, updated_at: "2026-04-18T00:00:00.000Z" },
      { id: "2", label: "b", done: false, position: 1, updated_at: "2026-04-18T00:00:00.000Z" },
    ];
    const result = toggleTodo(todos, "1");
    expect(result[1].done).toBe(false);
  });
});

describe("deleteTodo", () => {
  it("should_remove_todo_by_id", () => {
    const todos = [
      { id: "1", label: "a", done: false, position: 0, updated_at: "2026-04-18T00:00:00.000Z" },
      { id: "2", label: "b", done: false, position: 1, updated_at: "2026-04-18T00:00:00.000Z" },
    ];
    const result = deleteTodo(todos, "1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("should_return_unchanged_list_when_id_not_found", () => {
    const todos = [{ id: "1", label: "a", done: false, position: 0, updated_at: "2026-04-18T00:00:00.000Z" }];
    const result = deleteTodo(todos, "999");
    expect(result).toHaveLength(1);
  });
});
