import { useRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsModal from "@/components/SettingsModal";

const baseSettings = {
  pomodoro_min: 25,
  short_min: 5,
  long_min: 15,
  theme: "seoul" as const,
  alert_sound: "bell" as const,
  alert_volume: 0.6,
  alert_enabled: true,
  notifications_enabled: false,
  spotify_enabled: true,
  updated_at: "1970-01-01T00:00:00.000Z",
};

function Harness({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(true)}>
        open
      </button>
      <SettingsModal
        open={open}
        onClose={() => setOpen(false)}
        settings={baseSettings}
        onChange={() => {}}
      />
    </>
  );
}

describe("SettingsModal", () => {
  it("should_not_render_when_open_is_false", () => {
    render(<Harness />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should_render_dialog_with_four_tab_buttons_when_open", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText("open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Timer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sounds" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "General" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
  });

  it("should_show_timer_tab_by_default", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText("open"));
    expect(screen.getByText("timer tab")).toBeInTheDocument();
  });

  it("should_switch_panel_when_tab_clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText("open"));
    await user.click(screen.getByRole("button", { name: "Sounds" }));
    expect(screen.getByText("sounds tab")).toBeInTheDocument();
    expect(screen.queryByText("timer tab")).toBeNull();
  });

  it("should_call_onClose_when_Escape_pressed", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText("open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should_call_onClose_when_backdrop_clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText("open"));
    const dialog = screen.getByRole("dialog");
    await user.click(dialog);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should_not_call_onClose_when_inner_panel_clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText("open"));
    await user.click(screen.getByRole("button", { name: "Timer" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should_restore_focus_to_trigger_on_close", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByText("open");
    trigger.focus();
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
  });

  it("should_focus_first_tab_on_open", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText("open"));
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Timer" }),
    );
  });
});
