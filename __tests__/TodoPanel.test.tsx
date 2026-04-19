import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodoPanel from "@/components/TodoPanel";

beforeEach(() => {
  localStorage.clear();
});

describe("TodoPanel", () => {
  it("should_render_empty_input_and_no_todos_initially", () => {
    render(<TodoPanel />);
    expect(screen.getByPlaceholderText(/add task/i)).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("should_add_todo_when_form_submitted", async () => {
    const user = userEvent.setup();
    render(<TodoPanel />);
    await user.type(screen.getByPlaceholderText(/add task/i), "ship v1");
    await user.keyboard("{Enter}");
    expect(screen.getByText("ship v1")).toBeInTheDocument();
  });

  it("should_clear_input_after_adding_todo", async () => {
    const user = userEvent.setup();
    render(<TodoPanel />);
    const input = screen.getByPlaceholderText(/add task/i);
    await user.type(input, "task");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("");
  });

  it("should_not_add_todo_when_input_is_blank", async () => {
    const user = userEvent.setup();
    render(<TodoPanel />);
    await user.keyboard("{Enter}");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("should_toggle_todo_done_when_checkbox_clicked", async () => {
    const user = userEvent.setup();
    render(<TodoPanel />);
    await user.type(screen.getByPlaceholderText(/add task/i), "task");
    await user.keyboard("{Enter}");
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("should_delete_todo_when_delete_button_clicked", async () => {
    const user = userEvent.setup();
    render(<TodoPanel />);
    await user.type(screen.getByPlaceholderText(/add task/i), "to delete");
    await user.keyboard("{Enter}");
    expect(screen.getByText("to delete")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.queryByText("to delete")).not.toBeInTheDocument();
  });

  it("should_persist_todos_to_localStorage_on_add", async () => {
    const user = userEvent.setup();
    render(<TodoPanel />);
    await user.type(screen.getByPlaceholderText(/add task/i), "persisted");
    await user.keyboard("{Enter}");
    const stored = JSON.parse(localStorage.getItem("pomodoro:todos")!);
    expect(stored).toHaveLength(1);
    expect(stored[0].label).toBe("persisted");
  });

  it("should_load_todos_from_localStorage_on_mount", () => {
    localStorage.setItem(
      "pomodoro:todos",
      JSON.stringify([{ id: "1", label: "restored", done: false, position: 0, updated_at: "2026-04-18T00:00:00.000Z" }])
    );
    render(<TodoPanel />);
    expect(screen.getByText("restored")).toBeInTheDocument();
  });
});
