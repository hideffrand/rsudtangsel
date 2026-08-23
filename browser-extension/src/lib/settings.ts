import { DEFAULT_SETTINGS, Settings } from "./types";
import { storageLocal } from "./webext";

const KEY = "copilot_settings";

export async function getSettings(): Promise<Settings> {
  const stored = await storageLocal().get(KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[KEY] as Partial<Settings> | undefined) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await storageLocal().set({ [KEY]: settings });
}
