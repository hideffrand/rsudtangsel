// Autofill: isi input bertanda data-copilot="<key>" di tab aktif dengan hasil
// ekstraksi OCR. Key dinormalisasi (huruf kecil, hanya alfanumerik) supaya key
// parser Indonesia ("No. Telepon") cocok dengan hook form admin ("notelepon").
export interface AutofillPair {
  key: string;
  value: string;
}

// Hasil per-field untuk tampilan debug di side panel.
export interface AutofillOutcome {
  key: string; // key asli dari parser OCR
  target: string; // nilai ternormalisasi = atribut data-copilot yang dicari
  value: string;
  found: boolean; // apakah elemen [data-copilot] ada di halaman
  filled: boolean; // apakah benar-benar diisi (elemen ada & tidak disabled)
}

// Dijalankan DI DALAM halaman via chrome.scripting.executeScript — tidak boleh
// mereferensikan fungsi/closure di luar dirinya (hanya sumber fungsi yang
// diserialisasi). Set nilai lewat prototype setter + event input/change agar
// React controlled component ikut ter-update.
function fillFieldsInPage(pairs: AutofillPair[]): AutofillOutcome[] {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const outcomes: AutofillOutcome[] = [];

  for (const { key, value } of pairs) {
    if (!value) continue;
    const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[data-copilot="${norm(key)}"]`,
    );
    let filled = false;
    if (el && !el.disabled && !("readOnly" in el && el.readOnly)) {
      const proto =
        el instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : el instanceof HTMLSelectElement
            ? HTMLSelectElement.prototype
            : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.focus();
      filled = true;
    }
    outcomes.push({ key, target: norm(key), value, found: Boolean(el), filled });
  }
  return outcomes;
}

export async function autofillActiveTab(fields: AutofillPair[]): Promise<AutofillOutcome[]> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("Tidak menemukan tab aktif");
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: fillFieldsInPage,
    args: [fields.map(({ key, value }) => ({ key, value }))],
  });

  return (results?.[0]?.result as AutofillOutcome[] | undefined) ?? [];
}
