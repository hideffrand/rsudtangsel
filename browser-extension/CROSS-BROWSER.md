# Dukungan Multi-Browser (Chrome / Edge / Firefox)

> **STATUS: IMPLEMENTED.** Langkah 1–3 di bawah sudah diterapkan
> (`manifest.json`, `src/background.js`, `src/lib/webext.ts`). Langkah 5
> (smoke test manual di 3 browser) masih perlu diverifikasi.

Rencana membuat extension berjalan di Chrome, Edge, dan Firefox (MV3) dengan satu
manifest dan satu output `out/`.

## Temuan utama

- **Edge**: berbasis Chromium, sudah mendukung API `sidePanel` Chrome — cukup verifikasi, tanpa perubahan kode.
- **Firefox**: 3 perbedaan yang perlu ditangani:
  1. Tidak ada `chrome.sidePanel` → pakai `sidebar_action` (manifest) + `browser.sidebarAction`.
  2. Tidak mendukung `background.service_worker` di MV3 → pakai `background.scripts` (event page).
     Pola resmi MDN: deklarasi `scripts` + `service_worker` sekaligus, tiap browser memilih sendiri.
  3. `chrome.*` di Firefox callback-based; `browser.*` promise-based → butuh shim `browser ?? chrome`.
- Kompatibel tanpa perubahan: `storage.session` (FF 115+), fetch/CORS ke server Go,
  rename `_next/` (tidak wajib di Firefox tapi tidak mengganggu), background klasik non-module.

## Langkah implementasi

1. **manifest.json** (satu manifest untuk semua browser)
   - Tambah `sidebar_action`: `{ "default_panel": "sidepanel/index.html", "default_title": "Webform Copilot", "open_at_install": false }`
   - Tambah `browser_specific_settings.gecko`: `{ "id": "webform-copilot@rsutangsel.go.id", "strict_min_version": "115.0" }`
   - Ubah `background` → `{ "scripts": ["background.js"], "service_worker": "background.js" }`
   - Pertahankan `side_panel`, `action`, `permissions: ["sidePanel", "storage"]`, icons.
2. **src/background.js** — deteksi fitur:
   ```js
   const api = globalThis.browser || globalThis.chrome;
   if (api.sidePanel?.setPanelBehavior) {
     api.runtime.onInstalled.addListener(() =>
       api.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {}));
   } else if (api.sidebarAction && api.action) {
     api.action.onClicked.addListener(() => api.sidebarAction.toggle());
   }
   ```
3. **src/lib/webext.ts** (baru) — shim bertipe promise (`browser ?? chrome`, storage
   local/session get/set/remove + onChanged); ganti 7 pemanggilan `chrome.storage.*`
   di `auth.ts` dan `settings.ts` dengan `webext.*`.
4. **Dokumentasi** — README: langkah instal di Edge (load unpacked) dan Firefox
   (about:debugging → Load Temporary Add-on), catatan FF 115+.
5. **Verifikasi** — `npx tsc --noEmit`, `npm run build`, cek `out/` lengkap
   (0 file berawalan `_`, ada background.js, manifest valid), lalu smoke test
   login → OCR di Chrome, Edge, dan Firefox (server + ocr-service aktif).

## Keputusan

- Satu manifest (rekomendasi) — tiap browser hanya memberi warning untuk key tak dikenal.
- Tanpa web-ext (zero dependency).
- `open_at_install: false` — sidebar Firefox terbuka saat ikon toolbar diklik.

## Yang TIDAK berubah

`postbuild.mjs`, `package.json`, dan kode server Go.
