import { mergeSettings, mergeTodos } from "./sync";
import type { CloudSettings, CloudTodo } from "./sync";

function makeSettings(overrides: Partial<CloudSettings> = {}): CloudSettings {
  return {
    user_id: "u1",
    pomodoro_min: 25,
    short_min: 5,
    long_min: 15,
    theme: "seoul",
    alert_sound: "bell",
    alert_volume: 0.8,
    alert_enabled: true,
    notifications_enabled: false,
    spotify_enabled: false,
    updated_at: "2026-04-20T12:00:00.000Z",
    ...overrides,
  };
}

function makeTodo(overrides: Partial<CloudTodo> = {}): CloudTodo {
  return {
    id: "t1",
    user_id: "u1",
    label: "task",
    done: false,
    position: 0,
    updated_at: "2026-04-20T12:00:00.000Z",
    ...overrides,
  };
}

describe("mergeSettings", () => {
  it("should return null when both local and cloud are null", () => {
    const local = null;
    const cloud = null;

    const result = mergeSettings(local, cloud);

    expect(result).toBeNull();
  });

  it("should return cloud when local is null", () => {
    const local = null;
    const cloud = makeSettings({ theme: "tokyo" });

    const result = mergeSettings(local, cloud);

    expect(result).toBe(cloud);
  });

  it("should return local when cloud is null", () => {
    const local = makeSettings({ theme: "paris" });
    const cloud = null;

    const result = mergeSettings(local, cloud);

    expect(result).toBe(local);
  });

  it("should return newer-timestamped side when both present", () => {
    const local = makeSettings({ theme: "paris", updated_at: "2026-04-20T13:00:00.000Z" });
    const cloud = makeSettings({ theme: "tokyo", updated_at: "2026-04-20T12:00:00.000Z" });

    const result = mergeSettings(local, cloud);

    expect(result).toBe(local);
  });

  it("should return cloud on timestamp tie", () => {
    const local = makeSettings({ theme: "paris", updated_at: "2026-04-20T12:00:00.000Z" });
    const cloud = makeSettings({ theme: "tokyo", updated_at: "2026-04-20T12:00:00.000Z" });

    const result = mergeSettings(local, cloud);

    expect(result).toBe(cloud);
  });
});

describe("mergeTodos", () => {
  it("should return empty array when both sides empty", () => {
    const result = mergeTodos([], []);

    expect(result).toEqual([]);
  });

  it("should include items present only on local", () => {
    const localOnly = makeTodo({ id: "a", label: "local-only" });

    const result = mergeTodos([localOnly], []);

    expect(result).toEqual([localOnly]);
  });

  it("should include items present only on cloud", () => {
    const cloudOnly = makeTodo({ id: "b", label: "cloud-only" });

    const result = mergeTodos([], [cloudOnly]);

    expect(result).toEqual([cloudOnly]);
  });

  it("should pick newer-timestamped version on id overlap", () => {
    const localNewer = makeTodo({ id: "x", label: "local", updated_at: "2026-04-20T13:00:00.000Z" });
    const cloudOlder = makeTodo({ id: "x", label: "cloud", updated_at: "2026-04-20T12:00:00.000Z" });

    const result = mergeTodos([localNewer], [cloudOlder]);

    expect(result).toEqual([localNewer]);
  });

  it("should prefer cloud on timestamp tie for id overlap", () => {
    const local = makeTodo({ id: "x", label: "local", updated_at: "2026-04-20T12:00:00.000Z" });
    const cloud = makeTodo({ id: "x", label: "cloud", updated_at: "2026-04-20T12:00:00.000Z" });

    const result = mergeTodos([local], [cloud]);

    expect(result).toEqual([cloud]);
  });

  it("should return items sorted by position ascending", () => {
    const t0 = makeTodo({ id: "a", position: 2 });
    const t1 = makeTodo({ id: "b", position: 0 });
    const t2 = makeTodo({ id: "c", position: 1 });

    const result = mergeTodos([t0, t1], [t2]);

    expect(result.map((t) => t.id)).toEqual(["b", "c", "a"]);
  });

  it("should preserve stable ordering for equal positions", () => {
    const first = makeTodo({ id: "first", position: 0 });
    const second = makeTodo({ id: "second", position: 0 });
    const third = makeTodo({ id: "third", position: 0 });

    const result = mergeTodos([first, second], [third]);

    expect(result.map((t) => t.id)).toEqual(["first", "second", "third"]);
  });
});
