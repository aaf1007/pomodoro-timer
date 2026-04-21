import type { SupabaseClient } from "@supabase/supabase-js";
import type { CloudSettings, CloudTodo } from "./sync";

export async function fetchCloudSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<CloudSettings | null> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // PGRST116 = "no rows" from PostgREST when .single() finds none.
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return (data as CloudSettings) ?? null;
}

export async function upsertCloudSettings(
  supabase: SupabaseClient,
  userId: string,
  partial: Partial<CloudSettings>,
): Promise<void> {
  // Preserve caller-supplied updated_at so LWW compares against the real
  // source-of-truth timestamp. Only synthesize one if the caller didn't.
  const row = {
    ...partial,
    user_id: userId,
    updated_at: partial.updated_at ?? new Date().toISOString(),
  };
  const { error } = await supabase
    .from("settings")
    .upsert(row, { onConflict: "user_id" });
  if (error) throw error;
}

export async function fetchCloudTodos(
  supabase: SupabaseClient,
  userId: string,
): Promise<CloudTodo[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data as CloudTodo[]) ?? [];
}

export async function upsertCloudTodos(
  supabase: SupabaseClient,
  userId: string,
  todos: CloudTodo[],
): Promise<void> {
  if (todos.length === 0) return;
  // Preserve each row's own updated_at so LWW merge decisions aren't overwritten.
  const rows = todos.map((t) => ({ ...t, user_id: userId }));
  const { error } = await supabase.from("todos").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteCloudTodos(
  supabase: SupabaseClient,
  userId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("user_id", userId)
    .in("id", ids);
  if (error) throw error;
}
