import { formatCountdown, applyTimerTitle, restoreTimerTitle } from "./tabTitle";

describe("formatCountdown", () => {
  it("should_format_25_minutes_as_25_00", () => {
    expect(formatCountdown(25 * 60 * 1000)).toBe("25:00");
  });

  it("should_format_zero_ms_as_00_00", () => {
    expect(formatCountdown(0)).toBe("00:00");
  });

  it("should_format_90_seconds_as_01_30", () => {
    expect(formatCountdown(90 * 1000)).toBe("01:30");
  });

  it("should_format_1_ms_as_00_01_ceiling", () => {
    expect(formatCountdown(1)).toBe("00:01");
  });

  it("should_format_exact_minutes_correctly", () => {
    expect(formatCountdown(5 * 60 * 1000)).toBe("05:00");
  });
});

describe("applyTimerTitle", () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  it("should_set_document_title_with_countdown_and_mode", () => {
    applyTimerTitle(25 * 60 * 1000, "Pomodoro");
    expect(document.title).toBe("25:00 · Pomodoro");
  });

  it("should_update_title_with_remaining_time", () => {
    applyTimerTitle(90 * 1000, "Short Break");
    expect(document.title).toBe("01:30 · Short Break");
  });
});

describe("restoreTimerTitle", () => {
  afterEach(() => {
    document.title = "pomodoro-timer";
  });

  it("should_restore_default_title", () => {
    document.title = "01:30 · Pomodoro";
    restoreTimerTitle();
    expect(document.title).toBe("study-with-ant.io");
  });
});
