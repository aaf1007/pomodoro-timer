import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

jest.mock("@/components/BackgroundLayer", () => ({
  __esModule: true,
  default: () => <div data-testid="bg-layer" />,
}));

jest.mock("@/components/AuthButton", () => ({
  __esModule: true,
  default: () => <div data-testid="auth-button" />,
}));

jest.mock("@/components/SettingsTabAccount", () => ({
  __esModule: true,
  default: () => <div data-testid="tab-account" />,
}));

jest.mock("@/lib/storage/useCloudSync", () => ({
  useCloudSync: () => ({
    migrationPrompt: null,
    resolveMigration: () => {},
    isResolvingMigration: false,
    status: "anonymous",
  }),
}));

describe("Home page wiring", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not render the legacy bottom-right ThemeSelector widget", () => {
    render(<Home />);
    expect(screen.queryByText("Seoul Sunrise")).toBeNull();
  });

  it("opens the settings modal when the gear button is clicked", async () => {
    const user = userEvent.setup();
    render(<Home />);
    expect(screen.queryByRole("dialog", { name: "Settings" })).toBeNull();
    await user.click(screen.getByLabelText(/open settings/i));
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  });

  it("loads persisted pomodoro_min from localStorage into the timer display", () => {
    localStorage.setItem(
      "pomodoro:settings",
      JSON.stringify({
        pomodoro_min: 7,
        short_min: 5,
        long_min: 15,
        theme: "seoul",
        alert_sound: "bell",
        alert_volume: 0.6,
        alert_enabled: true,
        notifications_enabled: false,
        spotify_enabled: true,
        updated_at: new Date().toISOString(),
      }),
    );
    render(<Home />);
    expect(screen.getByText("07:00")).toBeInTheDocument();
  });
});
