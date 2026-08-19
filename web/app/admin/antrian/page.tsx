"use client";

/**
 * Manajemen Antrian Admin — RSU Tangsel Care (/admin/antrian)
 * Filter poli + tanggal, Call/Skip pasien, tampil status real-time.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getAdminQueue,
  callPatient,
  skipPatient,
  type QueueItem,
} from "@/lib/admin-api";
import { poliApi, type Poli } from "@/services/poli";
import { Dialog } from "@/components/ui/dialog";
import { Inbox } from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Waiting: { label: "Menunggu", cls: "bg-amber-100 text-amber-700 border border-amber-200" },
  Processing: { label: "Dipanggil", cls: "bg-blue-100 text-blue-700 border border-blue-200" },
  Done: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  Cancelled: { label: "Dibatalkan", cls: "bg-red-100 text-red-600 border border-red-200" },
};

export default function AntrianAdminPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polis, setPolis] = useState<Poli[]>([]);

  // Filters
  const [filterPoli, setFilterPoli] = useState("");
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Load master data poli untuk dropdown filter.
  useEffect(() => {
    let cancelled = false;
    poliApi
      .getAll()
      .then((data) => {
        if (!cancelled) setPolis(data);
      })
      .catch(() => {
        if (!cancelled) setPolis([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dialog konfirmasi
  const [confirm, setConfirm] = useState<{
    id: number; action: "call" | "skip"; number: string; patient_name: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminQueue({
        poli: filterPoli || undefined,
        date: filterDate || undefined,
      });
      setQueue(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data antrian.");
    } finally {
      setLoading(false);
    }
  }, [filterPoli, filterDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQueue();
  }, [fetchQueue]);

  const handleConfirmAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      const updated =
        confirm.action === "call"
          ? await callPatient(confirm.id)
          : await skipPatient(confirm.id);
      setQueue((prev) =>
        prev.map((a) => (a.id === confirm.id ? { ...a, status: updated.status } : a))
      );
    } catch {
      // silent
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  };

  // Summary counts
  const waiting = queue.filter((a) => a.status === "Waiting").length;
  const processing = queue.filter((a) => a.status === "Processing").length;
  const done = queue.filter((a) => a.status === "Done").length;
  const cancelled = queue.filter((a) => a.status === "Cancelled").length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Antrian</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Pantau dan kelola antrian pasien rawat jalan hari ini.
        </p>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Menunggu", count: waiting, cls: "bg-amber-50 text-amber-700 border-amber-200" },
          { label: "Dipanggil", count: processing, cls: "bg-blue-50 text-blue-700 border-blue-200" },
          { label: "Selesai", count: done, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { label: "Dibatalkan", count: cancelled, cls: "bg-red-50 text-red-600 border-red-200" },
        ].map((chip) => (
          <div key={chip.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${chip.cls}`}>
            <span className="text-lg font-extrabold">{chip.count}</span>
            {chip.label}
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Poli / Spesialis</label>
          <select
            value={filterPoli}
            onChange={(e) => setFilterPoli(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Poli</option>
            {polis.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={fetchQueue}
            className="h-9 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
          >
            Filter
          </button>
          <button
            onClick={() => { setFilterPoli(""); setFilterDate(new Date().toISOString().split("T")[0]); }}
            className="h-9 px-4 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}{" "}
          <button onClick={fetchQueue} className="underline font-semibold ml-1">Coba lagi</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">
            Daftar Antrian <span className="text-emerald-600">({queue.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            {filterDate ? new Date(filterDate).toLocaleDateString("id-ID", { dateStyle: "long" }) : "Hari ini"}
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Inbox className="w-10 h-10 mx-auto mb-3" />
            <p className="text-sm font-medium">Tidak ada antrian{filterPoli ? ` untuk Poli ${filterPoli}` : ""} pada tanggal ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-semibold">No.</th>
                  <th className="px-6 py-3 text-left font-semibold">Nama Pasien</th>
                  <th className="px-6 py-3 text-left font-semibold">Poli</th>
                  <th className="px-6 py-3 text-left font-semibold hidden md:table-cell">Dokter</th>
                  <th className="px-6 py-3 text-left font-semibold hidden lg:table-cell">Daftar Pukul</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((item) => {
                  const badge = STATUS_BADGE[item.status] ?? { label: item.status, cls: "bg-slate-100 text-slate-600 border border-slate-200" };
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-emerald-700 text-base">{item.number}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{item.patient_name}</td>
                      <td className="px-6 py-4 text-slate-600">{item.poli}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs hidden md:table-cell">{item.doctor_name}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs hidden lg:table-cell">{item.created_at}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === "Waiting" && (
                            <>
                              <button
                                onClick={() => setConfirm({ id: item.id, action: "call", number: item.number, patient_name: item.patient_name })}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                              >
                                Panggil
                              </button>
                              <button
                                onClick={() => setConfirm({ id: item.id, action: "skip", number: item.number, patient_name: item.patient_name })}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-400 rounded-lg transition-colors"
                              >
                                Skip
                              </button>
                            </>
                          )}
                          {item.status === "Processing" && (
                            <span className="text-xs text-blue-500 font-semibold">Sedang dilayani</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog
        isOpen={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "call" ? "Panggil Pasien" : "Skip Pasien"}
        cancelLabel="Batal"
        confirmLabel={confirm?.action === "call" ? "Ya, Panggil" : "Ya, Skip"}
        onConfirm={handleConfirmAction}
        confirmVariant={confirm?.action === "skip" ? "destructive" : "primary"}
      >
        {confirm && (
          <p className="text-sm text-muted-foreground">
            {confirm.action === "call"
              ? `Memanggil pasien `
              : `Melewati pasien `}
            <strong className="text-foreground">{confirm.patient_name}</strong>
            {" "}(No. <strong className="text-emerald-600">{confirm.number}</strong>).
            {confirm.action === "skip" && " Status akan berubah menjadi Dibatalkan."}
          </p>
        )}
        {actionLoading && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Memproses...
          </div>
        )}
      </Dialog>
    </div>
  );
}
