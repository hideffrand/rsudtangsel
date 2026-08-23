// Cross-browser storage shim. Prefers the promise-based WebExtension
// namespace (`browser.*`, Firefox) and falls back to `chrome.*` (Chrome/Edge,
// promise-based since MV3). All storage access in lib/ goes through this file.
// Accessors stay lazy: `chrome`/`browser` only exist inside the extension,
// never during `next build`'s Node-side page-data collection.
const ext = () => (globalThis as typeof globalThis & { browser?: typeof chrome }).browser ?? chrome;

export const storageLocal = () => ext().storage.local;
export const storageSession = () => ext().storage.session;

export type StorageChangeMap = { [key: string]: chrome.storage.StorageChange };

export function onStorageChanged(
  cb: (changes: StorageChangeMap, areaName: string) => void,
): void {
  ext().storage.onChanged.addListener(cb);
}
