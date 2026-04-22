import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  SETTINGS_KEY,
  type Settings,
} from "@/lib/storage/local";

beforeEach(() => {
  localStorage.clear();
});

describe("settings storage", () => {
  it("should_return_DEFAULT_SETTINGS_when_no_stored_value", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("should_round_trip_saved_settings", () => {
    const s: Settings = {
      pomodoro_min: 50,
      short_min: 10,
      long_min: 20,
      theme: "tokyo",
      alert_sound: "chime",
      alert_volume: 0.25,
      alert_enabled: false,
      notifications_enabled: true,
      spotify_enabled: false,
      updated_at: "2026-04-21T12:00:00.000Z",
    };
    saveSettings(s);
    expect(loadSettings()).toEqual(s);
  });

  it("should_return_DEFAULT_SETTINGS_when_stored_json_is_corrupt", () => {
    localStorage.setItem(SETTINGS_KEY, "{not json");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("should_return_DEFAULT_SETTINGS_when_stored_value_is_not_an_object", () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify([1, 2, 3]));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify("x"));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("should_write_to_key_pomodoro_settings_on_save", () => {
    saveSettings(DEFAULT_SETTINGS);
    const stored = JSON.parse(localStorage.getItem("pomodoro:settings")!);
    expect(stored).toEqual(DEFAULT_SETTINGS);
  });
});
