"use client";

/**
 * Dashboard Ringkasan Admin — RSU Tangsel Care
 * Koneksi ke GET /api/admin/dashboard/stats dan GET /api/admin/queue
 * Auto-refresh tiap 30 detik.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getDashboardStats,
  getAdminQueue,
  callPatient,
  skipPatient,
  type DashboardStats,
  type QueueItem,
} from "@/lib/admin-api";
import { StatCard } from "@/components/admin/stat-card";

function IconUsers() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
}
function IconClock() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function IconDoctor() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
}
function IconQueue() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
}
function IconRefresh({ spinning }: { spinning?: boolean }) {
  return <svg className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
}

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
            <IconRefresh spinning={refreshing} />
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
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.75 1.301-.734 2.874-2.113 2.874H4.81c-1.38 0-2.862-1.573-2.113-2.874L10.688 3.876c.688-1.196 2.623-1.196 3.312 0l7.303 12.624z" /></svg>
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
          icon={<IconUsers />}
          color="green"
          loading={loadingStats}
        />
        <StatCard
          title="Antrian Aktif"
          value={stats?.total_queue ?? "—"}
          subtitle="Masih menunggu dipanggil"
          icon={<IconQueue />}
          color="blue"
          loading={loadingStats}
        />
        <StatCard
          title="Waktu Tunggu"
          value={stats ? `${stats.avg_wait_time} mnt` : "—"}
          subtitle="Rata-rata per pasien"
          icon={<IconClock />}
          color="amber"
          loading={loadingStats}
        />
        <StatCard
          title="DOKTER AKTIF"
          value={stats?.active_doctors.toString() ?? "—"}
          subtitle="Total dokter jaga hari ini"
          icon={<IconDoctor />}
          color="slate"
          loading={loadingStats}
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/admin/antrian", label: "Kelola Antrian", emoji: "📋" },
          { href: "/admin/mcu", label: "MCU Booking", emoji: "🏥" },
          { href: "/admin/jadwal-dokter", label: "Jadwal Dokter", emoji: "📅" },
          { href: "/admin/hris", label: "HRIS Absensi", emoji: "👥" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all text-sm font-semibold text-slate-700 hover:text-emerald-700"
          >
            <span className="text-xl">{item.emoji}</span>
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
            <p className="text-3xl mb-2">📭</p>
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
