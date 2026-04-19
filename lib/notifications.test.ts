import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isNotificationSupported,
  requestPermissionIfNeeded,
  notifySessionEnd,
} from "./notifications";

function makeNotificationAPI(
  permission: NotificationPermission = "default",
  requestResult: NotificationPermission = "granted"
) {
  const MockNotification = vi.fn() as unknown as typeof Notification & {
    permission: NotificationPermission;
    requestPermission: () => Promise<NotificationPermission>;
  };
  MockNotification.permission = permission;
  MockNotification.requestPermission = vi.fn().mockResolvedValue(requestResult);
  return MockNotification;
}

describe("notifications", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("isNotificationSupported", () => {
    it("should_return_true_when_Notification_exists", () => {
      vi.stubGlobal("Notification", makeNotificationAPI());
      expect(isNotificationSupported()).toBe(true);
    });

    it("should_return_false_when_Notification_missing", () => {
      vi.stubGlobal("Notification", undefined);
      expect(isNotificationSupported()).toBe(false);
    });
  });

  describe("requestPermissionIfNeeded", () => {
    it("should_call_requestPermission_when_status_is_default", async () => {
      const mock = makeNotificationAPI("default", "granted");
      vi.stubGlobal("Notification", mock);

      await requestPermissionIfNeeded();

      expect(mock.requestPermission).toHaveBeenCalledOnce();
    });

    it("should_not_call_requestPermission_when_already_granted", async () => {
      const mock = makeNotificationAPI("granted");
      vi.stubGlobal("Notification", mock);

      await requestPermissionIfNeeded();

      expect(mock.requestPermission).not.toHaveBeenCalled();
    });

    it("should_not_call_requestPermission_when_already_denied", async () => {
      const mock = makeNotificationAPI("denied");
      vi.stubGlobal("Notification", mock);

      await requestPermissionIfNeeded();

      expect(mock.requestPermission).not.toHaveBeenCalled();
    });

    it("should_return_existing_permission_without_requesting", async () => {
      const mock = makeNotificationAPI("granted");
      vi.stubGlobal("Notification", mock);

      const result = await requestPermissionIfNeeded();

      expect(result).toBe("granted");
    });

    it("should_return_undefined_when_Notification_not_supported", async () => {
      vi.stubGlobal("Notification", undefined);

      const result = await requestPermissionIfNeeded();

      expect(result).toBeUndefined();
    });
  });

  describe("notifySessionEnd", () => {
    it("should_create_notification_when_permission_granted", () => {
      const mock = makeNotificationAPI("granted");
      vi.stubGlobal("Notification", mock);

      notifySessionEnd("pom");

      expect(mock).toHaveBeenCalledWith(
        "Pomodoro complete!",
        expect.objectContaining({ body: expect.any(String) })
      );
    });

    it("should_not_create_notification_when_permission_denied", () => {
      const mock = makeNotificationAPI("denied");
      vi.stubGlobal("Notification", mock);

      notifySessionEnd("pom");

      expect(mock).not.toHaveBeenCalled();
    });

    it("should_show_short_break_message_for_short_mode", () => {
      const mock = makeNotificationAPI("granted");
      vi.stubGlobal("Notification", mock);

      notifySessionEnd("short");

      expect(mock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: expect.stringContaining("Short Break") })
      );
    });

    it("should_show_long_break_message_for_long_mode", () => {
      const mock = makeNotificationAPI("granted");
      vi.stubGlobal("Notification", mock);

      notifySessionEnd("long");

      expect(mock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: expect.stringContaining("Long Break") })
      );
    });

    it("should_not_throw_when_Notification_not_supported", () => {
      vi.stubGlobal("Notification", undefined);

      expect(() => notifySessionEnd("pom")).not.toThrow();
    });
  });
});
