import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/lib/audio", () => {
  const actual = jest.requireActual("@/lib/audio");
  return { ...actual, playAlert: jest.fn() };
});

import SettingsTabSounds from "@/components/SettingsTabSounds";
import { playAlert } from "@/lib/audio";
import type { Settings } from "@/lib/storage/local";

const playAlertMock = playAlert as jest.MockedFunction<typeof playAlert>;

const baseSettings: Settings = {
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

describe("SettingsTabSounds", () => {
  beforeEach(() => {
    playAlertMock.mockClear();
  });

  it("should_render_sound_select_volume_range_alert_toggle_and_test_button", () => {
    render(<SettingsTabSounds settings={baseSettings} onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /test/i }),
    ).toBeInTheDocument();
  });

  it("should_emit_onChange_with_alert_sound_when_select_changes", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<SettingsTabSounds settings={baseSettings} onChange={onChange} />);
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "chime");
    expect(onChange).toHaveBeenCalledWith({ alert_sound: "chime" });
  });

  it("should_emit_onChange_with_alert_volume_when_range_changes", () => {
    const onChange = jest.fn();
    render(<SettingsTabSounds settings={baseSettings} onChange={onChange} />);
    const range = screen.getByRole("slider");
    fireEvent.change(range, { target: { value: "0.3" } });
    expect(onChange).toHaveBeenCalledWith({ alert_volume: 0.3 });
  });

  it("should_emit_onChange_with_alert_enabled_when_checkbox_toggled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<SettingsTabSounds settings={baseSettings} onChange={onChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith({ alert_enabled: false });
  });

  it("should_call_playAlert_with_current_sound_and_volume_when_test_clicked", async () => {
    const user = userEvent.setup();
    render(<SettingsTabSounds settings={baseSettings} onChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: /test/i }));
    expect(playAlertMock).toHaveBeenCalledWith("bell", 0.6);
  });
});
