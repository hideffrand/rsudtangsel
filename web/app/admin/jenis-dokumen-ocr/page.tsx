"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import {
  type OCRDocumentType,
  getOCRDocumentTypes,
  createOCRDocumentType,
  updateOCRDocumentType,
  deleteOCRDocumentType,
} from "@/services/ocr";

type FormState = {
  id: string;
  name: string;
  fields: string;
};

// Satu rule ekstraksi = key (label) + daftar regex berurutan (pertama yang
// cocok menang, group(1) = nilai). Diserialisasi ke JSON di kolom `fields`.
type FieldRule = {
  key: string;
  required: boolean;
  patterns: string[];
};

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  fields: "[]",
};

function parseFieldRules(raw: string): { rules: FieldRule[]; legacy: boolean } {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { rules: [], legacy: true };
    return {
      rules: parsed.map((r) => ({
        key: String(r?.key ?? ""),
        required: Boolean(r?.required),
        patterns: Array.isArray(r?.patterns) ? r.patterns.map(String) : [],
      })),
      legacy: false,
    };
  } catch {
    return { rules: [], legacy: Boolean(raw.trim()) };
  }
}

// Validasi ringan sisi klien (validasi penuh tetap di microservice OCR):
// setiap rule butuh key + minimal 1 pattern yang bisa dikompilasi.
function validateFieldRules(rules: FieldRule[]): string | null {
  if (rules.length === 0) return null;
  if (rules.length > 20) return "Maksimal 20 field per jenis dokumen.";
  for (const [i, rule] of rules.entries()) {
    if (!rule.key.trim()) return `Field #${i + 1}: nama/key wajib diisi.`;
    const patterns = rule.patterns.filter((p) => p.trim());
    if (patterns.length === 0) return `Field "${rule.key}": minimal 1 pattern regex.`;
    if (patterns.length > 10) return `Field "${rule.key}": maksimal 10 pattern.`;
    for (const p of patterns) {
      if (p.length > 500) return `Field "${rule.key}": pattern terlalu panjang (maks 500 karakter).`;
      try {
        new RegExp(p);
      } catch {
        return `Field "${rule.key}": regex tidak valid — ${p}`;
      }
    }
  }
  return null;
}

export default function AdminJenisDokumenOCRPage() {
  const [docTypes, setDocTypes] = useState<OCRDocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<OCRDocumentType | null>(null);
  const [deleteItem, setDeleteItem] = useState<OCRDocumentType | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [rules, setRules] = useState<FieldRule[]>([]);
  const [legacyFields, setLegacyFields] = useState(false);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getOCRDocumentTypes();
      setDocTypes(data);
    } catch (err) {
      console.error(err);
      setLoadError("Gagal memuat data jenis dokumen OCR dari server. Silakan coba lagi.");
      toast.error("Gagal memuat data jenis dokumen OCR dari server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [loadAll]);

  const filteredDocTypes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return docTypes;
    return docTypes.filter(
      (d) => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
    );
  }, [docTypes, searchTerm]);

  const openAddModal = () => {
    setEditingType(null);
    setForm(EMPTY_FORM);
    setRules([]);
    setLegacyFields(false);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (item: OCRDocumentType) => {
    setEditingType(item);
    setForm({ id: item.id, name: item.name, fields: item.fields });
    const parsed = parseFieldRules(item.fields);
    setRules(parsed.rules);
    setLegacyFields(parsed.legacy);
    setFormError(null);
    setIsFormOpen(true);
  };

  const validateForm = (): string | null => {
    if (!form.id.trim()) return "ID / slug wajib diisi.";
    if (!/^[a-z0-9-]+$/.test(form.id.trim())) {
      return "ID hanya boleh huruf kecil, angka, dan tanda hubung (-).";
    }
    if (!form.name.trim()) return "Nama wajib diisi.";
    if (!editingType && docTypes.some((d) => d.id === form.id.trim())) {
      return "ID sudah dipakai oleh jenis dokumen OCR lain.";
    }
    return validateFieldRules(rules);
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const fieldsJson = JSON.stringify(rules.filter((r) => r.key.trim() && r.patterns.some((p) => p.trim())));
      if (editingType) {
        const updated = await updateOCRDocumentType(editingType.id, {
          name: form.name.trim(),
          fields: fieldsJson,
        });
        setDocTypes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      } else {
        const created = await createOCRDocumentType({
          id: form.id.trim(),
          name: form.name.trim(),
          fields: fieldsJson,
        });
        setDocTypes((prev) => [...prev, created]);
      }
      setIsFormOpen(false);
      toast.success(
        editingType
          ? `Jenis dokumen "${form.name.trim()}" berhasil diperbarui.`
          : `Jenis dokumen "${form.name.trim()}" berhasil ditambahkan.`,
      );
    } catch (err) {
      console.error(err);
      const msg = "Gagal menyimpan jenis dokumen OCR. Silakan coba lagi.";
      setFormError(msg);
      toast.error(err instanceof Error && err.message ? err.message : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsSaving(true);
    try {
      await deleteOCRDocumentType(deleteItem.id);
      setDocTypes((prev) => prev.filter((d) => d.id !== deleteItem.id));
      setDeleteItem(null);
      toast.success(`Jenis dokumen "${deleteItem.name}" berhasil dihapus.`);
    } catch (err) {
      console.error(err);
      const msg = "Gagal menghapus jenis dokumen OCR. Silakan coba lagi.";
      setFormError(msg);
      toast.error(err instanceof Error && err.message ? err.message : msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 mx-auto">
      <div className="sticky top-0 z-20 -mt-6 lg:-mt-8 pt-6 lg:pt-8 pb-4 space-y-4 bg-slate-50/95 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Jenis Dokumen OCR</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Kelola pilihan &quot;Jenis dokumen OCR&quot; untuk ekstraksi OCR (KTP, BPJS, rujukan, resep, dll).
            </p>
          </div>
          <button
            onClick={openAddModal}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
          >
            + Tambah Jenis Dokumen OCR
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex-1 space-y-1 w-full">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cari Jenis Dokumen OCR</label>
            <input
              type="search"
              placeholder="Ketik nama atau ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{loadError}</span>
          <button onClick={loadAll} className="font-semibold underline">
            Coba lagi
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
          Memuat data jenis dokumen OCR...
        </div>
      ) : filteredDocTypes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
          {docTypes.length === 0
            ? "Belum ada jenis dokumen OCR terdaftar. Klik \"+ Tambah Jenis Dokumen OCR\" untuk membuat yang pertama."
            : "Tidak ada jenis dokumen OCR yang cocok dengan pencarian."}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocTypes.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-base leading-tight">{item.name}</h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {item.id}
                  </span>
                </div>
                {(() => {
                  const { rules: itemRules, legacy } = parseFieldRules(item.fields);
                  if (legacy) return <p className="text-xs text-slate-500 mt-2">{item.fields}</p>;
                  if (itemRules.length === 0) {
                    return <p className="text-xs text-slate-300 italic mt-2">Belum ada field terdaftar.</p>;
                  }
                  return (
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      {itemRules.map((r) => (
                        <div key={r.key} className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">{r.key}</span>
                          {r.required && <span className="text-red-500">*</span>}
                          <span className="font-mono text-[10px] text-slate-400">
                            {r.patterns.length} pattern
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => openEditModal(item)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteItem(item)}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md border border-red-200 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        className="sm:max-w-3xl xl:max-w-5xl"
      >
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">
            {editingType ? "Edit Jenis Dokumen OCR" : "Tambah Jenis Dokumen OCR Baru"}
          </h2>
          <div className="space-y-3 text-sm">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md px-3 py-2">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">ID / Slug</label>
                <input
                  type="text"
                  value={form.id}
                  disabled={!!editingType}
                  onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="mis. ktp, bpjs, rujukan"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1 disabled:bg-slate-100 disabled:text-slate-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nilai ini dikirim sebagai <span className="font-mono">doc_type</span> ke layanan OCR.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Nama</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="mis. Surat Rujukan"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Field Ekstraksi &amp; Regex</label>
              <p className="text-[11px] text-slate-400 mt-1">
                Key = label persis di form tujuan (dipakai autofill ekstensi). Pattern regex
                dicari pada teks hasil OCR — yang pertama cocok menang, group 1 = nilai.
              </p>
              {legacyFields && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[11px] rounded-md px-3 py-2 mt-2">
                  Data ini masih memakai format lama (bukan JSON). Jika disimpan, nilai lama akan
                  diganti konfigurasi di bawah.
                </div>
              )}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 items-start">
                {rules.map((rule, ruleIdx) => (
                  <div key={ruleIdx} className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/60 flex flex-col">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rule.key}
                        onChange={(e) =>
                          setRules((rs) => rs.map((r, i) => (i === ruleIdx ? { ...r, key: e.target.value } : r)))
                        }
                        placeholder='Key field, mis. "Nama Lengkap"'
                        className="flex-1 min-w-0 h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500"
                      />
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={rule.required}
                          onChange={(e) =>
                            setRules((rs) => rs.map((r, i) => (i === ruleIdx ? { ...r, required: e.target.checked } : r)))
                          }
                          className="accent-emerald-600"
                        />
                        Wajib
                      </label>
                      <button
                        onClick={() => setRules((rs) => rs.filter((_, i) => i !== ruleIdx))}
                        title="Hapus field"
                        className="text-red-500 hover:text-red-700 text-xs font-semibold px-1.5"
                      >
                        ✕
                      </button>
                    </div>
                    {rule.patterns.map((pattern, patIdx) => (
                      <div key={patIdx} className="flex items-start gap-2">
                        <textarea
                          value={pattern}
                          onChange={(e) =>
                            setRules((rs) =>
                              rs.map((r, i) =>
                                i === ruleIdx
                                  ? { ...r, patterns: r.patterns.map((p, j) => (j === patIdx ? e.target.value : p)) }
                                  : r,
                              ),
                            )
                          }
                          rows={2}
                          placeholder={`Regex #${patIdx + 1}, mis. NIK[ \\\\t]*[:\\\\-]*(\\\\d{16})`}
                          className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md resize-y focus:outline-none focus:border-emerald-500"
                        />
                        {rule.patterns.length > 1 && (
                          <button
                            onClick={() =>
                              setRules((rs) =>
                                rs.map((r, i) =>
                                  i === ruleIdx ? { ...r, patterns: r.patterns.filter((_, j) => j !== patIdx) } : r,
                                ),
                              )
                            }
                            title="Hapus pattern"
                            className="text-slate-400 hover:text-red-600 text-xs font-semibold px-1 mt-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setRules((rs) =>
                          rs.map((r, i) => (i === ruleIdx ? { ...r, patterns: [...r.patterns, ""] } : r)),
                        )
                      }
                      className="self-start text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 mt-auto pt-0.5"
                    >
                      + Tambah pattern fallback
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setRules((rs) => [...rs, { key: "", required: false, patterns: [""] }])}
                className="w-full mt-3 py-2 text-xs font-semibold text-emerald-700 border border-dashed border-emerald-300 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                + Tambah Field
              </button>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <button
              onClick={() => setIsFormOpen(false)}
              className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        className="sm:max-w-md"
      >
        {deleteItem && (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Hapus Jenis Dokumen OCR</h2>
            <div className="space-y-2 text-sm">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md px-3 py-2">
                  {formError}
                </div>
              )}
              <p className="text-slate-600">
                Yakin ingin menghapus jenis dokumen OCR{" "}
                <strong className="text-slate-800">{deleteItem.name}</strong> (
                <span className="font-mono text-xs">{deleteItem.id}</span>)? Tindakan ini tidak dapat
                dibatalkan.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isSaving ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
