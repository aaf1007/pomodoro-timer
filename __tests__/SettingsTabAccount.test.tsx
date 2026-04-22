import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const authMock = {
  getUser: jest.fn(),
  onAuthStateChange: jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  })),
  signOut: jest.fn(),
};

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: authMock }),
}));

jest.mock("@/components/AuthButton", () => ({
  __esModule: true,
  default: () => <div data-testid="auth-button-stub">AUTH</div>,
}));

import SettingsTabAccount from "@/components/SettingsTabAccount";

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

describe("SettingsTabAccount", () => {
  beforeEach(() => {
    authMock.getUser.mockReset();
    authMock.onAuthStateChange.mockReset();
    authMock.signOut.mockReset();
    authMock.onAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    }));
    authMock.signOut.mockResolvedValue({ error: null });
  });

  it("should_render_auth_button_when_signed_out", async () => {
    authMock.getUser.mockResolvedValue({ data: { user: null } });
    render(
      <SettingsTabAccount settings={baseSettings} onChange={() => {}} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("auth-button-stub")).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("should_render_email_and_sign_out_when_signed_in", async () => {
    authMock.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.co" } },
    });
    render(
      <SettingsTabAccount settings={baseSettings} onChange={() => {}} />,
    );
    await waitFor(() =>
      expect(screen.getByText(/a@b\.co/)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
  });

  it("should_call_signOut_when_sign_out_clicked", async () => {
    const user = userEvent.setup();
    authMock.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.co" } },
    });
    render(
      <SettingsTabAccount settings={baseSettings} onChange={() => {}} />,
    );
    const signOutBtn = await screen.findByRole("button", { name: "Sign out" });
    await user.click(signOutBtn);
    expect(authMock.signOut).toHaveBeenCalled();
  });

  it("should_not_render_sync_status_when_prop_omitted", async () => {
    authMock.getUser.mockResolvedValue({ data: { user: null } });
    render(
      <SettingsTabAccount settings={baseSettings} onChange={() => {}} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("auth-button-stub")).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Synced/)).toBeNull();
    expect(screen.queryByText(/Syncing/)).toBeNull();
    expect(screen.queryByText(/Cloud sync/)).toBeNull();
    expect(screen.queryByText(/Sync error/)).toBeNull();
  });

  it("should_render_sync_status_when_prop_provided", async () => {
    authMock.getUser.mockResolvedValue({ data: { user: null } });
    render(
      <SettingsTabAccount
        settings={baseSettings}
        onChange={() => {}}
        syncStatus="synced"
      />,
    );
    await waitFor(() =>
      expect(screen.getByText(/Synced/)).toBeInTheDocument(),
    );
  });
});
