"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  User,
  ListOrdered,
  RotateCw,
  AlertTriangle,
  ClipboardList,
  Hospital,
  CalendarDays,
  FlaskConical,
  Inbox,
} from "lucide-react";
import {
  getDashboardStats,
  getAdminQueue,
  callPatient,
  skipPatient,
  type DashboardStats,
  type QueueItem,
} from "@/lib/admin-api";
import { StatCard } from "@/components/admin/stat-card";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Waiting: { label: "Menunggu", cls: "bg-amber-100 text-amber-700" },
  Processing: { label: "Dipanggil", cls: "bg-blue-100 text-blue-700" },
  Done: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700" },
  Cancelled: { label: "Dibatalkan", cls: "bg-red-100 text-red-600" },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingQueue, setLoadingAntrian] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoadingStats(true);
      setLoadingAntrian(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    try {
      const [s, a] = await Promise.all([
        getDashboardStats(),
        getAdminQueue(),
      ]);
      setStats(s);
      setQueue(a.slice(0, 8));
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoadingStats(false);
      setLoadingAntrian(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCall = async (id: number) => {
    setActionLoading(id);
    try {
      const updated = await callPatient(id);
      setQueue((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: updated.status } : a))
      );
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (id: number) => {
    setActionLoading(id);
    try {
      const updated = await skipPatient(id);
      setQueue((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: updated.status } : a))
      );
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const now = new Date();
  const todayStr = now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">{todayStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/"
            target="_blank"
            className="px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
          >
            Lihat Portal Publik →
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error} —{" "}
          <button onClick={() => fetchData()} className="underline font-semibold">Coba lagi</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pasien Hari Ini"
          value={stats?.patients_today ?? "—"}
          subtitle="Total kunjungan hari ini"
          icon={<Users className="w-5 h-5" />}
          color="green"
          loading={loadingStats}
        />
        <StatCard
          title="Antrian Aktif"
          value={stats?.total_queue ?? "—"}
          subtitle="Masih menunggu dipanggil"
          icon={<ListOrdered className="w-5 h-5" />}
          color="blue"
          loading={loadingStats}
        />
        <StatCard
          title="Waktu Tunggu"
          value={stats ? `${stats.avg_wait_time} mnt` : "—"}
          subtitle="Rata-rata per pasien"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          loading={loadingStats}
        />
        <StatCard
          title="DOKTER AKTIF"
          value={stats?.active_doctors?.toString() ?? "—"}
          subtitle="Total dokter jaga hari ini"
          icon={<User className="w-5 h-5" />}
          color="slate"
          loading={loadingStats}
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/admin/antrian", label: "Kelola Antrian", icon: <ClipboardList className="w-5 h-5" /> },
          { href: "/admin/mcu", label: "MCU Booking", icon: <Hospital className="w-5 h-5" /> },
          { href: "/admin/jadwal-dokter", label: "Jadwal Dokter", icon: <CalendarDays className="w-5 h-5" /> },
          { href: "/admin/layanan-kesehatan", label: "Layanan Kesehatan", icon: <FlaskConical className="w-5 h-5" /> },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all text-sm font-semibold text-slate-700 hover:text-emerald-700"
          >
            <span className="text-emerald-600">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Antrian Terkini */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Antrian Hari Ini</h2>
          <Link
            href="/admin/antrian"
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            Lihat Semua →
          </Link>
        </div>

        {loadingQueue ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Inbox className="w-10 h-10 mx-auto mb-2" />
            Belum ada antrian hari ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-semibold">No. Antrian</th>
                  <th className="px-6 py-3 text-left font-semibold">Nama Pasien</th>
                  <th className="px-6 py-3 text-left font-semibold hidden md:table-cell">Poli</th>
                  <th className="px-6 py-3 text-left font-semibold hidden lg:table-cell">Dokter</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((item) => {
                  const badge = STATUS_BADGE[item.status] ?? { label: item.status, cls: "bg-slate-100 text-slate-600" };
                  const isLoading = actionLoading === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-emerald-700">{item.number}</td>
                      <td className="px-6 py-3.5 font-medium text-slate-800">{item.patient_name}</td>
                      <td className="px-6 py-3.5 text-slate-600 hidden md:table-cell">{item.poli}</td>
                      <td className="px-6 py-3.5 text-slate-500 text-xs hidden lg:table-cell">{item.doctor_name}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === "Waiting" && (
                            <button
                              onClick={() => handleCall(item.id)}
                              disabled={isLoading}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors disabled:opacity-50"
                            >
                              {isLoading ? "..." : "Panggil"}
                            </button>
                          )}
                          {item.status === "Waiting" && (
                            <button
                              onClick={() => handleSkip(item.id)}
                              disabled={isLoading}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-400 rounded transition-colors disabled:opacity-50"
                            >
                              Skip
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
    </div>
  );
}