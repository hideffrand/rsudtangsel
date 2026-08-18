"use client";

/**
 * Audit Log System — RSU Tangsel Care (/admin/audit-log)
 * Fitur:
 * 1. Log jejak aktivitas staf/admin
 * 2. Siapa akses data apa, kapan, alamat IP
 * 3. Kepatuhan kepatuhan keamanan SIMRS (Compliance)
 */

import { useState } from "react";

interface AuditEntry {
  id: number;
  timestamp: string;
  username: string;
  role: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: "Success" | "Failed" | "Warning";
  details: string;
}

const INITIAL_LOGS: AuditEntry[] = [
  { id: 1001, timestamp: "2026-08-17 15:42:10", username: "admin", role: "admin", action: "CALL_PATIENT", resource: "Antrian J001 (Poli Jantung)", ipAddress: "192.168.1.105", status: "Success", details: "Memanggil antrian J001 untuk Budi Santoso" },
  { id: 1002, timestamp: "2026-08-17 15:38:05", username: "staff_budi", role: "backoffice", action: "CONFIRM_MCU", resource: "MCU Booking #3 (MCU Gold)", ipAddress: "192.168.1.112", status: "Success", details: "Konfirmasi pendaftaran MCU Budi Santoso" },
  { id: 1003, timestamp: "2026-08-17 15:15:22", username: "dr_ahmad", role: "dokter", action: "ACCESS_REKAM_MEDIS", resource: "Pasien NIK: 3674011204890001", ipAddress: "192.168.1.88", status: "Success", details: "Membaca riwayat rekam medis pasien" },
  { id: 1004, timestamp: "2026-08-17 14:02:11", username: "unknown", role: "guest", action: "LOGIN_ATTEMPT", resource: "/api/admin/login", ipAddress: "180.252.12.90", status: "Failed", details: "Password salah 3 kali berturut-turut" },
  { id: 1005, timestamp: "2026-08-17 12:30:45", username: "hr_sarah", role: "HR", action: "APPROVE_LEAVE", resource: "Pengajuan Cuti #103", ipAddress: "192.168.1.120", status: "Success", details: "Setujui cuti Dewi Lestari" },
];

export default function AdminAuditLogPage() {
  const [logs] = useState<AuditEntry[]>(INITIAL_LOGS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredLogs = logs.filter((l) => {
    const matchSearch =
      !search ||
      l.username.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase()) ||
      l.ipAddress.includes(search);
    const matchStatus = !filterStatus || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Audit Log &amp; Compliance Audit</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Catatan riwayat aktivitas keamanan — melacak siapa mengakses data apa, kapan, dan dari alamat IP mana.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cari Username / Aksi / IP</label>
          <input
            type="search"
            placeholder="Contoh: admin, CALL_PATIENT, 192.168..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="w-full sm:w-60 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Akses</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Status Log</option>
            <option value="Success">Success (Berhasil)</option>
            <option value="Failed">Failed (Gagal / Ditolak)</option>
            <option value="Warning">Warning (Peringatan)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">
            Riwayat Log Kejadian <span className="text-emerald-600">({filteredLogs.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Sinkronisasi Realtime</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3 text-left font-semibold">Waktu (UTC+7)</th>
                <th className="px-6 py-3 text-left font-semibold">User &amp; Role</th>
                <th className="px-6 py-3 text-left font-semibold">Aksi</th>
                <th className="px-6 py-3 text-left font-semibold">Resource / Target</th>
                <th className="px-6 py-3 text-left font-semibold">Alamat IP</th>
                <th className="px-6 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-6 py-4 font-sans font-semibold text-slate-800">
                    {log.username} <span className="text-[10px] text-slate-400 font-normal">({log.role})</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-700">{log.action}</td>
                  <td className="px-6 py-4 font-sans text-slate-700">{log.resource}</td>
                  <td className="px-6 py-4 text-slate-500">{log.ipAddress}</td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        log.status === "Success"
                          ? "bg-emerald-100 text-emerald-700"
                          : log.status === "Failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
