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
