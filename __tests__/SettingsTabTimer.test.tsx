import { render, screen, fireEvent } from "@testing-library/react";
import SettingsTabTimer from "@/components/SettingsTabTimer";
import type { Settings } from "@/lib/storage/local";

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

describe("SettingsTabTimer", () => {
  it("should_render_three_inputs_with_current_values", () => {
    render(<SettingsTabTimer settings={baseSettings} onChange={() => {}} />);
    expect(screen.getByLabelText(/pomodoro/i)).toHaveValue(25);
    expect(screen.getByLabelText(/short/i)).toHaveValue(5);
    expect(screen.getByLabelText(/long/i)).toHaveValue(15);
  });

  it("should_emit_onChange_with_pomodoro_min_when_pomodoro_input_changes", () => {
    const onChange = jest.fn();
    render(<SettingsTabTimer settings={baseSettings} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/pomodoro/i), {
      target: { value: "30" },
    });
    expect(onChange).toHaveBeenCalledWith({ pomodoro_min: 30 });
  });

  it("should_emit_onChange_with_short_min_when_short_input_changes", () => {
    const onChange = jest.fn();
    render(<SettingsTabTimer settings={baseSettings} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/short/i), {
      target: { value: "7" },
    });
    expect(onChange).toHaveBeenCalledWith({ short_min: 7 });
  });

  it("should_emit_onChange_with_long_min_when_long_input_changes", () => {
    const onChange = jest.fn();
    render(<SettingsTabTimer settings={baseSettings} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/long/i), {
      target: { value: "20" },
    });
    expect(onChange).toHaveBeenCalledWith({ long_min: 20 });
  });

  it("should_clamp_to_1_when_input_is_below_range", () => {
    const onChange = jest.fn();
    render(<SettingsTabTimer settings={baseSettings} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/pomodoro/i), {
      target: { value: "0" },
    });
    expect(onChange).toHaveBeenCalledWith({ pomodoro_min: 1 });
  });

  it("should_clamp_to_90_when_input_is_above_range", () => {
    const onChange = jest.fn();
    render(<SettingsTabTimer settings={baseSettings} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/pomodoro/i), {
      target: { value: "91" },
    });
    expect(onChange).toHaveBeenCalledWith({ pomodoro_min: 90 });
  });
});
