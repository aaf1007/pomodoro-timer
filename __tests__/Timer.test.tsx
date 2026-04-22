import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Timer from "@/components/Timer";

jest.mock("@/lib/audio", () => ({
  playAlert: jest.fn(),
  ALERT_SOUNDS: ["bell", "chime", "birds", "lofi"],
}));

jest.mock("@/lib/notifications", () => ({
  isNotificationSupported: () => true,
  notifySessionEnd: jest.fn(),
  requestPermissionIfNeeded: jest.fn(),
}));

describe("Timer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders initial pomodoro duration from durations prop", () => {
    render(
      <Timer
        durations={{ pom: 30, short: 5, long: 15 }}
        alertSound="chime"
        alertVolume={0.4}
        alertEnabled
        notificationsEnabled
      />,
    );
    expect(screen.getByText("30:00")).toBeInTheDocument();
  });

  it("forwards onOpenSettings through Controls", async () => {
    const onOpenSettings = jest.fn();
    const user = userEvent.setup();
    render(
      <Timer
        durations={{ pom: 25, short: 5, long: 15 }}
        alertSound="bell"
        alertVolume={0.6}
        alertEnabled
        notificationsEnabled={false}
        onOpenSettings={onOpenSettings}
      />,
    );
    await user.click(screen.getByLabelText(/open settings/i));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
