"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
  type OCRDocumentType,
  getOCRDocumentTypes,
  createOCRDocumentType,
  updateOCRDocumentType,
  deleteOCRDocumentType,
} from "@/lib/admin-api";

type FormState = {
  id: string;
  name: string;
  fields: string;
};

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  fields: "",
};

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

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getOCRDocumentTypes();
      setDocTypes(data);
    } catch (err) {
      console.error(err);
      setLoadError("Gagal memuat data jenis dokumen OCR dari server. Silakan coba lagi.");
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
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (item: OCRDocumentType) => {
    setEditingType(item);
    setForm({ id: item.id, name: item.name, fields: item.fields });
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
    return null;
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
      if (editingType) {
        const updated = await updateOCRDocumentType(editingType.id, {
          name: form.name.trim(),
          fields: form.fields.trim(),
        });
        setDocTypes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      } else {
        const created = await createOCRDocumentType({
          id: form.id.trim(),
          name: form.name.trim(),
          fields: form.fields.trim(),
        });
        setDocTypes((prev) => [...prev, created]);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      setFormError("Gagal menyimpan jenis dokumen OCR. Silakan coba lagi.");
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
    } catch (err) {
      console.error(err);
      setFormError("Gagal menghapus jenis dokumen OCR. Silakan coba lagi.");
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
                {item.fields ? (
                  <p className="text-xs text-slate-500 mt-2">{item.fields}</p>
                ) : (
                  <p className="text-xs text-slate-300 italic mt-2">Belum ada field terdaftar.</p>
                )}
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
        className="sm:max-w-md"
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
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Fields (dipisah koma)</label>
              <textarea
                value={form.fields}
                onChange={(e) => setForm((f) => ({ ...f, fields: e.target.value }))}
                placeholder="mis. No. Rujukan, Poli Tujuan, Diagnosa Awal"
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1 resize-y"
              />
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
