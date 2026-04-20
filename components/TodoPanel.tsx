"use client";

import { useEffect, useState } from "react";
import { loadTodos, saveTodos, addTodo, toggleTodo, deleteTodo, type Todo } from "@/lib/storage/local";

interface TodoPanelProps {
  todos?: Todo[];
  setTodos?: (next: Todo[]) => void;
}

export default function TodoPanel({ todos: todosProp, setTodos: setTodosProp }: TodoPanelProps = {}) {
  const controlled = todosProp !== undefined && setTodosProp !== undefined;

  const [internalTodos, setInternalTodos] = useState<Todo[]>(() =>
    typeof window !== "undefined" && !controlled ? loadTodos() : []
  );
  const [input, setInput] = useState("");

  const todos = controlled ? (todosProp as Todo[]) : internalTodos;
  const setTodos = controlled ? (setTodosProp as (next: Todo[]) => void) : setInternalTodos;

  // In uncontrolled mode, persist to localStorage as before.
  useEffect(() => {
    if (!controlled) saveTodos(internalTodos);
  }, [controlled, internalTodos]);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const { todos: next, added } = addTodo(todos, input);
    if (!added) return;
    setTodos(next);
    setInput("");
  }

  function handleToggle(id: string) {
    const next = toggleTodo(todos, id);
    setTodos(next);
  }

  function handleDelete(id: string) {
    const next = deleteTodo(todos, id);
    setTodos(next);
  }

  return (
    <div className="flex flex-col gap-3 w-64">
      <h2 className="text-white font-semibold text-sm uppercase tracking-widest">Todos</h2>
      <ul className="flex flex-col gap-2">
        {todos.map((todo) => (
          <li key={todo.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => handleToggle(todo.id)}
              className="accent-white cursor-pointer"
            />
            <span className={`flex-1 text-sm text-white ${todo.done ? "line-through opacity-50" : ""}`}>
              {todo.label}
            </span>
            <button
              onClick={() => handleDelete(todo.id)}
              aria-label="delete"
              className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white text-xs transition-opacity"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add task"
          className="flex-1 bg-transparent border-b border-white/30 text-white text-sm placeholder:text-white/40 outline-none pb-1"
        />
      </form>
    </div>
  );
}
