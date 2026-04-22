import type { Settings } from "./local";
import type { CloudSettings } from "./sync";

export function toCloudSettings(s: Settings, userId: string): CloudSettings {
  return { ...s, user_id: userId };
}

export function fromCloudSettings(cs: CloudSettings): Settings {
  const { user_id: _user_id, ...rest } = cs;
  return rest as Settings;
}
