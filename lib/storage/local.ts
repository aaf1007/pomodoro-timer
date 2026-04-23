export const TODOS_KEY = "pomodoro:todos";

export interface Todo {
  id: string;
  label: string;
  done: boolean;
  position: number;
  updated_at: string;
}

export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(TODOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Todo[]) : [];
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

export function addTodo(
  todos: Todo[],
  label: string
): { todos: Todo[]; added: Todo | null } {
  const trimmed = label.trim();
  if (!trimmed) return { todos, added: null };

  const added: Todo = {
    id: crypto.randomUUID(),
    label: trimmed,
    done: false,
    position: todos.length,
    updated_at: new Date().toISOString(),
  };
  return { todos: [...todos, added], added };
}

export function toggleTodo(todos: Todo[], id: string): Todo[] {
  return todos.map((t) =>
    t.id === id ? { ...t, done: !t.done, updated_at: new Date().toISOString() } : t
  );
}

export function deleteTodo(todos: Todo[], id: string): Todo[] {
  return todos.filter((t) => t.id !== id);
}

export const SETTINGS_KEY = "pomodoro:settings";

export interface Settings {
  pomodoro_min: number;
  short_min: number;
  long_min: number;
  theme: "seoul" | "tokyo" | "paris" | "fire";
  alert_sound: "bell" | "chime" | "birds" | "lofi";
  alert_volume: number;
  alert_enabled: boolean;
  notifications_enabled: boolean;
  spotify_enabled: boolean;
  updated_at: string;
}

export const DEFAULT_SETTINGS: Settings = {
  pomodoro_min: 25,
  short_min: 5,
  long_min: 15,
  theme: "seoul",
  alert_sound: "bell",
  alert_volume: 0.6,
  alert_enabled: true,
  notifications_enabled: false,
  spotify_enabled: true,
  updated_at: "1970-01-01T00:00:00.000Z",
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Settings)
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
