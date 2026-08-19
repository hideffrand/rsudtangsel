"use client";

/**
 * Manajemen MCU Booking Admin — RSU Tangsel Care (/admin/mcu)
 * Filter status + tanggal, Confirm/Cancel/Konfirmasi Pembayaran.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getMcuBookings,
  confirmMcuBooking,
  cancelMcuBooking,
  confirmMcuPayment,
  type McuBookingItem,
} from "@/lib/admin-api";
import { Dialog } from "@/components/ui/dialog";
import { ClipboardList } from "lucide-react";

const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700 border border-amber-200" },
  confirmed: { label: "Dikonfirmasi", cls: "bg-blue-100 text-blue-700 border border-blue-200" },
  completed: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  cancelled: { label: "Dibatalkan", cls: "bg-red-100 text-red-600 border border-red-200" },
};

const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  unpaid: { label: "Belum Bayar", cls: "bg-slate-100 text-slate-600" },
  awaiting_confirmation: { label: "Menunggu Konfirmasi", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Lunas", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Dibatalkan", cls: "bg-red-100 text-red-600" },
};

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

type ActionType = "confirm" | "cancel" | "payment";

export default function McuAdminPage() {
  const [bookings, setBookings] = useState<McuBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [confirm, setConfirm] = useState<{
    id: number; action: ActionType; name: string; package_name: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [detailItem, setDetailItem] = useState<McuBookingItem | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMcuBookings({
        status: filterStatus || undefined,
        date: filterDate || undefined,
      });
      setBookings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data MCU Booking.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings();
  }, [fetchBookings]);

  const handleAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      let updated: McuBookingItem;
      if (confirm.action === "confirm") {
        updated = await confirmMcuBooking(confirm.id);
      } else if (confirm.action === "cancel") {
        updated = await cancelMcuBooking(confirm.id);
      } else {
        updated = await confirmMcuPayment(confirm.id);
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === confirm.id ? updated : b))
      );
    } catch {
      // silent
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  };

  const ACTION_CONFIG: Record<ActionType, { title: string; confirmLabel: string; destructive: boolean }> = {
    confirm: { title: "Konfirmasi Booking", confirmLabel: "Ya, Konfirmasi", destructive: false },
    cancel: { title: "Batalkan Booking", confirmLabel: "Ya, Batalkan", destructive: true },
    payment: { title: "Konfirmasi Pembayaran", confirmLabel: "Tandai Lunas", destructive: false },
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">MCU Booking</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Kelola pendaftaran Medical Check Up pasien — konfirmasi, batalkan, dan catat pembayaran.
        </p>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-3">
        {(["pending", "confirmed", "completed", "cancelled"] as const).map((s) => {
          const count = bookings.filter((b) => b.status === s).length;
          const badge = BOOKING_STATUS[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${badge.cls} ${filterStatus === s ? "ring-2 ring-offset-1 ring-emerald-500" : ""}`}
            >
              <span className="text-lg font-extrabold">{count}</span>
              {badge.label}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Booking</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Dikonfirmasi</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Booking</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={fetchBookings}
            className="h-9 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
          >
            Filter
          </button>
          <button
            onClick={() => { setFilterStatus(""); setFilterDate(""); }}
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
          <button onClick={fetchBookings} className="underline font-semibold ml-1">Coba lagi</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">
            Daftar MCU Booking <span className="text-emerald-600">({bookings.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3" />
            <p className="text-sm font-medium">Tidak ada data booking{filterStatus ? ` dengan status "${filterStatus}"` : ""}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">Pasien</th>
                  <th className="px-5 py-3 text-left font-semibold">Paket MCU</th>
                  <th className="px-5 py-3 text-left font-semibold hidden md:table-cell">Tgl. Booking</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold hidden lg:table-cell">Pembayaran</th>
                  <th className="px-5 py-3 text-left font-semibold hidden lg:table-cell">Total</th>
                  <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((item) => {
                  const bStatus = BOOKING_STATUS[item.status] ?? { label: item.status, cls: "bg-slate-100 text-slate-600 border border-slate-200" };
                  const pStatus = PAYMENT_STATUS[item.payment_status] ?? { label: item.payment_status, cls: "bg-slate-100 text-slate-600" };
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{item.full_name}</p>
                        <p className="text-xs text-slate-400">{item.phone_number}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-medium">{item.package_name}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs hidden md:table-cell">
                        {new Date(item.booking_date).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                        <br />
                        <span className="text-slate-400">{item.booking_time?.slice(0, 5)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${bStatus.cls}`}>
                          {bStatus.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${pStatus.cls}`}>
                          {pStatus.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800 hidden lg:table-cell">
                        {formatRupiah(item.total_price)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Detail
                          </button>
                          {item.status === "pending" && (
                            <button
                              onClick={() => setConfirm({ id: item.id, action: "confirm", name: item.full_name, package_name: item.package_name })}
                              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                            >
                              Konfirmasi
                            </button>
                          )}
                          {item.payment_status === "awaiting_confirmation" && (
                            <button
                              onClick={() => setConfirm({ id: item.id, action: "payment", name: item.full_name, package_name: item.package_name })}
                              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                            >
                              Konfirmasi Bayar
                            </button>
                          )}
                          {(item.status === "pending" || item.status === "confirmed") && (
                            <button
                              onClick={() => setConfirm({ id: item.id, action: "cancel", name: item.full_name, package_name: item.package_name })}
                              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-400 rounded-lg transition-colors"
                            >
                              Batalkan
                            </button>
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
      {confirm && (
        <Dialog
          isOpen={confirm !== null}
          onClose={() => setConfirm(null)}
          title={ACTION_CONFIG[confirm.action].title}
          cancelLabel="Batal"
          confirmLabel={ACTION_CONFIG[confirm.action].confirmLabel}
          onConfirm={handleAction}
          confirmVariant={ACTION_CONFIG[confirm.action].destructive ? "destructive" : "primary"}
        >
          <p className="text-sm text-muted-foreground">
            {confirm.action === "confirm" && "Anda akan mengkonfirmasi booking "}
            {confirm.action === "cancel" && "Anda akan membatalkan booking "}
            {confirm.action === "payment" && "Anda akan menandai pembayaran sebagai LUNAS untuk "}
            <strong className="text-foreground">{confirm.name}</strong> — paket{" "}
            <strong className="text-foreground">{confirm.package_name}</strong>.
          </p>
          {actionLoading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Memproses...
            </div>
          )}
        </Dialog>
      )}

      {/* Detail Dialog */}
      <Dialog
        isOpen={detailItem !== null}
        onClose={() => setDetailItem(null)}
        title="Detail MCU Booking"
        cancelLabel="Tutup"
      >
        {detailItem && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Nama", value: detailItem.full_name },
                { label: "NIK", value: detailItem.nik },
                { label: "Telepon", value: detailItem.phone_number },
                { label: "Paket MCU", value: detailItem.package_name },
                { label: "Tgl. Booking", value: new Date(detailItem.booking_date).toLocaleDateString("id-ID", { dateStyle: "long" }) },
                { label: "Jam", value: detailItem.booking_time?.slice(0, 5) },
                { label: "Metode Bayar", value: detailItem.payment_method || "-" },
                { label: "Total", value: formatRupiah(detailItem.total_price) },
              ].map((row) => (
                <div key={row.label} className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">{row.label}</p>
                  <p className="text-sm font-medium text-foreground">{row.value}</p>
                </div>
              ))}
            </div>
            {detailItem.notes && (
              <div className="border-t border-border pt-3 space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Catatan</p>
                <p className="text-sm">{detailItem.notes}</p>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
