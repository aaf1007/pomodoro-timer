import type { Todo } from "./local";
import type { CloudTodo } from "./sync";

export function toCloudTodo(local: Todo, userId: string): CloudTodo {
  return {
    id: local.id,
    user_id: userId,
    label: local.label,
    done: local.done,
    position: local.position,
    updated_at: local.updated_at,
  };
}

export function fromCloudTodo(cloud: CloudTodo): Todo {
  return {
    id: cloud.id,
    label: cloud.label,
    done: cloud.done,
    position: cloud.position,
    updated_at: cloud.updated_at,
  };
}

export function toCloudTodos(locals: Todo[], userId: string): CloudTodo[] {
  return locals.map((t) => toCloudTodo(t, userId));
}

export function fromCloudTodos(clouds: CloudTodo[]): Todo[] {
  return clouds.map(fromCloudTodo);
}
