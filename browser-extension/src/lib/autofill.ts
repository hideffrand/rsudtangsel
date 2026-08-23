// Autofill: isi input bertanda data-copilot="<key>" di tab aktif dengan hasil
// ekstraksi OCR. Key dinormalisasi (huruf kecil, hanya alfanumerik) supaya key
// parser Indonesia ("No. Telepon") cocok dengan hook form admin ("notelepon").
export interface AutofillPair {
  key: string;
  value: string;
}

// Hasil per-field untuk tampilan debug di side panel.
export interface AutofillOutcome {
  key: string; // key asli dari parser OCR (= label form)
  target: string; // nilai ternormalisasi yang dicocokkan
  value: string;
  match: "copilot" | "label" | null; // strategi yang menemukan elemen
  filled: boolean; // apakah benar-benar diisi
}

// Dijalankan DI DALAM halaman via chrome.scripting.executeScript — tidak boleh
// mereferensikan fungsi/closure di luar dirinya (hanya sumber fungsi yang
// diserialisasi). Set nilai lewat prototype setter + event input/change agar
// React controlled component ikut ter-update.
//
// Strategi pencocokan (key parser dibuat sama persis dengan label form):
// 1. data-copilot="<key ternormalisasi>" — kontrak eksplisit, prioritas utama.
// 2. <label> yang teksnya sama dengan key — fallback agar tetap jalan di form
//    mana pun tanpa atribut, selama labelnya cocok.
function fillFieldsInPage(pairs: AutofillPair[]): AutofillOutcome[] {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const outcomes: AutofillOutcome[] = [];

  type Fillable = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

  function findByCopilot(keyNorm: string): Fillable | null {
    return document.querySelector<Fillable>(`[data-copilot="${keyNorm}"]`);
  }

  function findByLabel(keyNorm: string): Fillable | null {
    for (const label of Array.from(document.getElementsByTagName("label"))) {
      if (norm(label.textContent || "") !== keyNorm) continue;
      const byId = label.htmlFor ? document.getElementById(label.htmlFor) : null;
      if (byId instanceof HTMLInputElement || byId instanceof HTMLTextAreaElement || byId instanceof HTMLSelectElement) {
        return byId;
      }
      return label.querySelector<Fillable>("input, textarea, select");
    }
    return null;
  }

  for (const { key, value } of pairs) {
    if (!value) continue;
    const keyNorm = norm(key);
    const viaCopilot = findByCopilot(keyNorm);
    const el = viaCopilot ?? findByLabel(keyNorm);
    const match = viaCopilot ? "copilot" : el ? "label" : null;

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
    outcomes.push({ key, target: keyNorm, value, match, filled });
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
