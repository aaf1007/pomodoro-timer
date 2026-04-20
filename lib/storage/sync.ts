export interface CloudSettings {
  user_id: string;
  pomodoro_min: number;
  short_min: number;
  long_min: number;
  theme: string;
  alert_sound: string;
  alert_volume: number;
  alert_enabled: boolean;
  notifications_enabled: boolean;
  spotify_enabled: boolean;
  updated_at: string;
}

export interface CloudTodo {
  id: string;
  user_id: string;
  label: string;
  done: boolean;
  position: number;
  updated_at: string;
}

// Row-level LWW (not per-field) — schema tracks updated_at per row only.
export function mergeSettings(
  local: CloudSettings | null,
  cloud: CloudSettings | null,
): CloudSettings | null {
  if (local === null && cloud === null) return null;
  if (local === null) return cloud;
  if (cloud === null) return local;
  return local.updated_at > cloud.updated_at ? local : cloud;
}

// Row-level LWW (not per-field) — schema tracks updated_at per row only.
export function mergeTodos(local: CloudTodo[], cloud: CloudTodo[]): CloudTodo[] {
  const byId = new Map<string, { todo: CloudTodo; order: number }>();
  let order = 0;
  for (const todo of local) {
    byId.set(todo.id, { todo, order: order++ });
  }
  for (const todo of cloud) {
    const existing = byId.get(todo.id);
    if (existing === undefined) {
      byId.set(todo.id, { todo, order: order++ });
    } else if (todo.updated_at >= existing.todo.updated_at) {
      byId.set(todo.id, { todo, order: existing.order });
    }
  }
  return Array.from(byId.values())
    .sort((a, b) => a.todo.position - b.todo.position || a.order - b.order)
    .map((entry) => entry.todo);
}
