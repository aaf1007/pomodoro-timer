import { toCloudTodo, fromCloudTodo, toCloudTodos, fromCloudTodos } from "./cloudTodos";
import type { Todo } from "./local";
import type { CloudTodo } from "./sync";

describe("toCloudTodo", () => {
  it("should_copy_fields_and_attach_user_id", () => {
    const local: Todo = {
      id: "abc",
      label: "hello",
      done: false,
      position: 2,
      updated_at: "2026-04-18T00:00:00.000Z",
    };
    const cloud = toCloudTodo(local, "user-1");
    expect(cloud).toEqual<CloudTodo>({
      id: "abc",
      user_id: "user-1",
      label: "hello",
      done: false,
      position: 2,
      updated_at: "2026-04-18T00:00:00.000Z",
    });
  });
});

describe("fromCloudTodo", () => {
  it("should_drop_user_id", () => {
    const cloud: CloudTodo = {
      id: "abc",
      user_id: "user-1",
      label: "hello",
      done: true,
      position: 5,
      updated_at: "2026-04-18T00:00:00.000Z",
    };
    const local = fromCloudTodo(cloud);
    expect(local).toEqual<Todo>({
      id: "abc",
      label: "hello",
      done: true,
      position: 5,
      updated_at: "2026-04-18T00:00:00.000Z",
    });
    expect("user_id" in local).toBe(false);
  });
});

describe("round trip", () => {
  it("should_preserve_fields_through_local_to_cloud_to_local", () => {
    const local: Todo = {
      id: "abc",
      label: "round",
      done: false,
      position: 0,
      updated_at: "2026-04-18T00:00:00.000Z",
    };
    expect(fromCloudTodo(toCloudTodo(local, "user-1"))).toEqual(local);
  });
});

describe("toCloudTodos / fromCloudTodos empty arrays", () => {
  it("should_return_empty_when_input_empty", () => {
    expect(toCloudTodos([], "user-1")).toEqual([]);
    expect(fromCloudTodos([])).toEqual([]);
  });
});
