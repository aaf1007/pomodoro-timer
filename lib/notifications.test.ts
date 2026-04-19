import {
  isNotificationSupported,
  requestPermissionIfNeeded,
  notifySessionEnd,
} from "./notifications";

function makeNotificationAPI(
  permission: NotificationPermission = "default",
  requestResult: NotificationPermission = "granted"
) {
  const MockNotification = jest.fn() as unknown as typeof Notification & {
    permission: NotificationPermission;
    requestPermission: () => Promise<NotificationPermission>;
  };
  MockNotification.permission = permission;
  MockNotification.requestPermission = jest.fn().mockResolvedValue(requestResult);
  return MockNotification;
}

describe("notifications", () => {
  const originalNotification = global.Notification;

  afterEach(() => {
    global.Notification = originalNotification;
  });

  describe("isNotificationSupported", () => {
    it("should_return_true_when_Notification_exists", () => {
      global.Notification = makeNotificationAPI() as unknown as typeof Notification;
      expect(isNotificationSupported()).toBe(true);
    });

    it("should_return_false_when_Notification_missing", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).Notification = undefined;
      expect(isNotificationSupported()).toBe(false);
    });
  });

  describe("requestPermissionIfNeeded", () => {
    it("should_call_requestPermission_when_status_is_default", async () => {
      const mock = makeNotificationAPI("default", "granted");
      global.Notification = mock as unknown as typeof Notification;

      await requestPermissionIfNeeded();

      expect(mock.requestPermission).toHaveBeenCalledTimes(1);
    });

    it("should_not_call_requestPermission_when_already_granted", async () => {
      const mock = makeNotificationAPI("granted");
      global.Notification = mock as unknown as typeof Notification;

      await requestPermissionIfNeeded();

      expect(mock.requestPermission).not.toHaveBeenCalled();
    });

    it("should_not_call_requestPermission_when_already_denied", async () => {
      const mock = makeNotificationAPI("denied");
      global.Notification = mock as unknown as typeof Notification;

      await requestPermissionIfNeeded();

      expect(mock.requestPermission).not.toHaveBeenCalled();
    });

    it("should_return_existing_permission_without_requesting", async () => {
      const mock = makeNotificationAPI("granted");
      global.Notification = mock as unknown as typeof Notification;

      const result = await requestPermissionIfNeeded();

      expect(result).toBe("granted");
    });

    it("should_return_undefined_when_Notification_not_supported", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).Notification = undefined;

      const result = await requestPermissionIfNeeded();

      expect(result).toBeUndefined();
    });
  });

  describe("notifySessionEnd", () => {
    it("should_create_notification_when_permission_granted", () => {
      const mock = makeNotificationAPI("granted");
      global.Notification = mock as unknown as typeof Notification;

      notifySessionEnd("pom");

      expect(mock).toHaveBeenCalledWith(
        "Pomodoro complete!",
        expect.objectContaining({ body: expect.any(String) })
      );
    });

    it("should_not_create_notification_when_permission_denied", () => {
      const mock = makeNotificationAPI("denied");
      global.Notification = mock as unknown as typeof Notification;

      notifySessionEnd("pom");

      expect(mock).not.toHaveBeenCalled();
    });

    it("should_show_short_break_message_for_short_mode", () => {
      const mock = makeNotificationAPI("granted");
      global.Notification = mock as unknown as typeof Notification;

      notifySessionEnd("short");

      expect(mock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: expect.stringContaining("Short Break") })
      );
    });

    it("should_show_long_break_message_for_long_mode", () => {
      const mock = makeNotificationAPI("granted");
      global.Notification = mock as unknown as typeof Notification;

      notifySessionEnd("long");

      expect(mock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: expect.stringContaining("Long Break") })
      );
    });

    it("should_not_throw_when_Notification_not_supported", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).Notification = undefined;

      expect(() => notifySessionEnd("pom")).not.toThrow();
    });
  });
});
