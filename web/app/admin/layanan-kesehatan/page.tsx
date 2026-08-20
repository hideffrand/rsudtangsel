"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
  mcuPackagesApi,
  type McuPackage,
} from "@/services/mcuPackages";
import {
  diagnosticServicesApi,
  type DiagnosticService,
} from "@/services/diagnosticServices";

type TabKind = "mcu" | "lab" | "radiologi";

type CatalogItem = McuPackage | DiagnosticService;

interface ItemDraft {
  name: string;
  description: string;
}

interface CatalogForm {
  name: string;
  description: string;
  price: string;
  isActive: boolean;
  items: ItemDraft[];
}

const TABS: { key: TabKind; label: string }[] = [
  { key: "mcu", label: "MCU Paket" },
  { key: "lab", label: "Lab" },
  { key: "radiologi", label: "Radiologi" },
];

const EMPTY_FORM: CatalogForm = {
  name: "",
  description: "",
  price: "",
  isActive: true,
  items: [{ name: "", description: "" }],
};

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function AdminLayananKesehatanPage() {
  const [tab, setTab] = useState<TabKind>("mcu");
  const [mcu, setMcu] = useState<McuPackage[]>([]);
  const [lab, setLab] = useState<DiagnosticService[]>([]);
  const [radio, setRadio] = useState<DiagnosticService[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; kind: TabKind } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: number; name: string; kind: TabKind } | null>(null);

  const [form, setForm] = useState<CatalogForm>(EMPTY_FORM);

  const activeList: CatalogItem[] = tab === "mcu" ? mcu : tab === "lab" ? lab : radio;

  const filteredList = activeList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  const loadAll = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [m, l, r] = await Promise.all([
        mcuPackagesApi.getAll(),
        diagnosticServicesApi.getAll("lab"),
        diagnosticServicesApi.getAll("radiologi"),
      ]);
      setMcu(m);
      setLab(l);
      setRadio(r);
    } catch (err) {
      console.error(err);
      setLoadError("Gagal memuat katalog layanan dari server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const reloadKind = async (kind: TabKind) => {
    if (kind === "mcu") {
      setMcu(await mcuPackagesApi.getAll());
    } else if (kind === "lab") {
      setLab(await diagnosticServicesApi.getAll("lab"));
    } else {
      setRadio(await diagnosticServicesApi.getAll("radiologi"));
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (kind: TabKind, item: CatalogItem) => {
    setEditing({ id: item.id, kind });
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      isActive: item.is_active,
      items: item.items.map((i) => ({ name: i.name, description: i.description })),
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const updateItem = (idx: number, patch: Partial<ItemDraft>) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  };

  const addItem = () => {
    setForm((f) => ({ ...f, items: [...f.items, { name: "", description: "" }] }));
  };

  const removeItem = (idx: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      setFormError("Nama wajib diisi.");
      return;
    }
    const price = Number(form.price);
    if (form.price === "" || isNaN(price) || price < 0) {
      setFormError("Harga wajib diisi dan harus angka >= 0.");
      return;
    }

    const items = form.items
      .map((i) => ({ name: i.name.trim(), description: i.description.trim() }))
      .filter((i) => i.name);

    const kind = editing?.kind ?? tab;
    setIsSaving(true);
    setFormError(null);
    try {
      if (editing) {
        if (kind === "mcu") {
          await mcuPackagesApi.update(editing.id, { name, description: form.description, price, is_active: form.isActive, items });
        } else {
          await diagnosticServicesApi.update(editing.id, { category: kind, name, description: form.description, price, is_active: form.isActive, items });
        }
      } else {
        if (kind === "mcu") {
          await mcuPackagesApi.create({ name, description: form.description, price, is_active: form.isActive, items });
        } else {
          await diagnosticServicesApi.create({ category: kind, name, description: form.description, price, is_active: form.isActive, items });
        }
      }
      await reloadKind(kind);
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      setFormError("Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsSaving(true);
    try {
      if (deleteItem.kind === "mcu") {
        await mcuPackagesApi.remove(deleteItem.id);
      } else {
        await diagnosticServicesApi.remove(deleteItem.id);
      }
      await reloadKind(deleteItem.kind);
      setDeleteItem(null);
    } catch (err) {
      console.error(err);
      setFormError("Gagal menghapus data. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabTitle = TABS.find((t) => t.key === tab)?.label ?? "";

  const getTabCount = (key: TabKind) => {
    if (key === "mcu") return mcu.length;
    if (key === "lab") return lab.length;
    return radio.length;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 mx-auto">
      <div className="sticky top-0 z-20 -mt-6 lg:-mt-8 pt-6 lg:pt-8 pb-4 space-y-4 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Katalog Layanan</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Kelola paket MCU, layanan laboratorium, dan radiologi.
            </p>
          </div>
          <button
            onClick={openCreate}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-xs shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tambah {tabTitle}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex p-1 bg-slate-200/70 rounded-xl space-x-1 w-full sm:w-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === t.key
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.5 text-xs rounded-full ${
                    tab === t.key ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {getTabCount(t.key)}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari ${tabTitle.toLowerCase()}...`}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{loadError}</span>
          </div>
          <button onClick={loadAll} className="font-semibold underline hover:text-red-800 transition-colors text-xs">
            Coba lagi
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="h-5 bg-slate-200 rounded-md w-2/3"></div>
                <div className="h-4 bg-slate-200 rounded-full w-12"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded-md w-full"></div>
                <div className="h-3 bg-slate-100 rounded-md w-4/5"></div>
              </div>
              <div className="h-6 bg-slate-200 rounded-md w-1/3 pt-2"></div>
            </div>
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-slate-800 font-semibold text-base">
            {searchQuery ? "Layanan tidak ditemukan" : `Belum ada data ${tabTitle.toLowerCase()}`}
          </p>
          <p className="text-slate-500 text-sm mt-1 max-w-sm">
            {searchQuery
              ? `Tidak ada ${tabTitle.toLowerCase()} yang cocok dengan kata kunci "${searchQuery}".`
              : `Klik tombol "+ Tambah ${tabTitle}" di atas untuk menambahkan item baru.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
            >
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-emerald-700 transition-colors">
                      {item.name}
                    </h3>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        item.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {item.description || "Tanpa deskripsi"}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Harga</span>
                    <span className="text-lg font-extrabold text-emerald-700 tracking-tight">{formatRupiah(item.price)}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {item.items.length} Item
                  </span>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEdit(tab, item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-xs"
                >
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setDeleteItem({ id: item.id, name: item.name, kind: tab })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-all shadow-xs"
                >
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
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
        className="sm:max-w-lg"
      >
        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-800">
              {editing ? "Edit " : "Tambah "} {tabTitle}
            </h2>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Layanan <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="cth: MCU Gold / Cek Darah Lengkap"
                className="w-full h-10 px-3 text-sm bg-slate-50/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Deskripsi singkat layanan"
                className="w-full p-3 text-sm bg-slate-50/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Harga (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0"
                  className="w-full h-10 px-3 text-sm bg-slate-50/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={form.isActive ? "1" : "0"}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "1" }))}
                  className="w-full h-10 px-3 text-sm bg-slate-50/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
                >
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Item Pemeriksaan ({form.items.length})
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Tambah Item
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 border border-slate-200/80 rounded-lg">
                    <span className="text-xs font-semibold text-slate-400 w-4 text-center shrink-0">{idx + 1}</span>
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                      placeholder="Nama item (cth: Hemoglobin)"
                      className="flex-1 h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      placeholder="Keterangan (opsional)"
                      className="flex-1 h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={form.items.length === 1}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400 p-1 transition-colors shrink-0"
                      aria-label="Hapus item"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsFormOpen(false)}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
            >
              {isSaving && (
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
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
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">Hapus Layanan</h2>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong className="text-slate-800 font-semibold">{deleteItem.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">
                {formError}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
              >
                {isSaving && (
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSaving ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}