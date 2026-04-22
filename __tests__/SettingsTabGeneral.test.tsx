import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsTabGeneral from "@/components/SettingsTabGeneral";
import type { Settings } from "@/lib/storage/local";

jest.mock("@/lib/notifications", () => ({
  requestPermissionIfNeeded: jest.fn(),
  isNotificationSupported: jest.fn(() => true),
}));
import { requestPermissionIfNeeded } from "@/lib/notifications";
const reqMock = requestPermissionIfNeeded as jest.MockedFunction<
  typeof requestPermissionIfNeeded
>;

beforeEach(() => reqMock.mockReset());

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

describe("SettingsTabGeneral", () => {
  it("should_render_four_theme_buttons_and_mark_active_theme", () => {
    const onChange = jest.fn();
    render(
      <SettingsTabGeneral settings={baseSettings} onChange={onChange} />,
    );
    const seoul = screen.getByRole("button", { name: /seoul/i });
    const tokyo = screen.getByRole("button", { name: /tokyo/i });
    const paris = screen.getByRole("button", { name: /paris/i });
    const fire = screen.getByRole("button", { name: /fire/i });
    expect(seoul).toBeInTheDocument();
    expect(tokyo).toBeInTheDocument();
    expect(paris).toBeInTheDocument();
    expect(fire).toBeInTheDocument();
    expect(seoul).toHaveAttribute("aria-pressed", "true");
    expect(tokyo).toHaveAttribute("aria-pressed", "false");
    expect(paris).toHaveAttribute("aria-pressed", "false");
    expect(fire).toHaveAttribute("aria-pressed", "false");
  });

  it("should_emit_onChange_with_theme_when_theme_button_clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <SettingsTabGeneral settings={baseSettings} onChange={onChange} />,
    );
    await user.click(screen.getByRole("button", { name: /tokyo/i }));
    expect(onChange).toHaveBeenCalledWith({ theme: "tokyo" });
  });

  it("should_request_permission_and_emit_true_when_notifications_turned_on_and_granted", async () => {
    reqMock.mockResolvedValue("granted");
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <SettingsTabGeneral settings={baseSettings} onChange={onChange} />,
    );
    await user.click(
      screen.getByRole("checkbox", { name: /notifications/i }),
    );
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ notifications_enabled: true }),
    );
    expect(reqMock).toHaveBeenCalledTimes(1);
  });

  it("should_not_emit_and_should_show_note_when_permission_denied", async () => {
    reqMock.mockResolvedValue("denied");
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <SettingsTabGeneral settings={baseSettings} onChange={onChange} />,
    );
    await user.click(
      screen.getByRole("checkbox", { name: /notifications/i }),
    );
    await waitFor(() => expect(reqMock).toHaveBeenCalledTimes(1));
    expect(onChange).not.toHaveBeenCalledWith({ notifications_enabled: true });
    expect(
      screen.getByText(/notifications blocked by browser/i),
    ).toBeInTheDocument();
  });

  it("should_not_call_requestPermission_when_notifications_turned_off", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <SettingsTabGeneral
        settings={{ ...baseSettings, notifications_enabled: true }}
        onChange={onChange}
      />,
    );
    await user.click(
      screen.getByRole("checkbox", { name: /notifications/i }),
    );
    expect(reqMock).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith({ notifications_enabled: false });
  });

  it("should_emit_onChange_with_spotify_enabled_when_spotify_toggle_clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <SettingsTabGeneral settings={baseSettings} onChange={onChange} />,
    );
    await user.click(screen.getByRole("checkbox", { name: /spotify/i }));
    expect(onChange).toHaveBeenCalledWith({ spotify_enabled: false });
  });
});
