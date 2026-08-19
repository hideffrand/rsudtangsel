"use client";

/**
 * HRIS — Absensi & Kehadiran Staff — RSU Tangsel Care (/admin/hris)
 * Fitur:
 * 1. Rekap kehadiran harian/mingguan/bulanan per staff
 * 2. Approval cuti / izin
 * 3. Dashboard telat / alpha untuk atasan HR
 */

import { useState } from "react";

interface AttendanceRecord {
  id: number;
  staffName: string;
  role: "Dokter" | "Perawat" | "Staff Admin" | "Apoteker";
  checkIn: string;
  checkOut: string;
  status: "Hadir Tepat Waktu" | "Terlambat" | "Izin / Cuti" | "Alpha";
  workHours: string;
}

interface LeaveRequest {
  id: number;
  staffName: string;
  role: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "Menunggu Approval" | "Disetujui" | "Ditolak";
}

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 1, staffName: "dr. Ahmad Sp.JP", role: "Dokter", checkIn: "07:45", checkOut: "16:00", status: "Hadir Tepat Waktu", workHours: "8j 15m" },
  { id: 2, staffName: "Siti Rahma A.Md.Kep", role: "Perawat", checkIn: "08:15", checkOut: "16:00", status: "Terlambat", workHours: "7j 45m" },
  { id: 3, staffName: "Budi Kurniawan", role: "Staff Admin", checkIn: "07:55", checkOut: "16:10", status: "Hadir Tepat Waktu", workHours: "8j 15m" },
  { id: 4, staffName: "Apt. Rina S.Farm", role: "Apoteker", checkIn: "-", checkOut: "-", status: "Izin / Cuti", workHours: "0j" },
  { id: 5, staffName: "Hendra Wijaya", role: "Staff Admin", checkIn: "-", checkOut: "-", status: "Alpha", workHours: "0j" },
];

const INITIAL_LEAVES: LeaveRequest[] = [
  { id: 101, staffName: "Apt. Rina S.Farm", role: "Apoteker", startDate: "2026-08-17", endDate: "2026-08-19", reason: "Cuti Tahunan (Acara Keluarga)", status: "Menunggu Approval" },
  { id: 102, staffName: "dr. Budi Sp.OG", role: "Dokter", startDate: "2026-08-20", endDate: "2026-08-22", reason: "Simposium Obstetri & Ginekologi", status: "Menunggu Approval" },
  { id: 103, staffName: "Dewi Lestari", role: "Perawat", startDate: "2026-08-10", endDate: "2026-08-11", reason: "Sakit (Surat Dokter Terlampir)", status: "Disetujui" },
];

export default function AdminHrisPage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_LEAVES);

  const [activeTab, setActiveTab] = useState<"absensi" | "cuti">("absensi");
  const [filterRole, setFilterRole] = useState("");

  const handleApproveLeave = (id: number) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "Disetujui" } : l))
    );
  };

  const handleRejectLeave = (id: number) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "Ditolak" } : l))
    );
  };

  const totalHadir = attendance.filter((a) => a.status === "Hadir Tepat Waktu").length;
  const totalTelat = attendance.filter((a) => a.status === "Terlambat").length;
  const totalCuti = attendance.filter((a) => a.status === "Izin / Cuti").length;
  const totalAlpha = attendance.filter((a) => a.status === "Alpha").length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">HRIS — Absensi &amp; Manajemen Kehadiran Staff</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Rekap absensi harian staff RS, verifikasi keterlambatan/alpha, dan persetujuan pengajuan cuti.
        </p>
      </div>

      {/* Overview Stat Chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-xs font-semibold text-emerald-800 uppercase">Hadir Tepat Waktu</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{totalHadir} Staff</p>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-semibold text-amber-800 uppercase">Terlambat Masuk</p>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{totalTelat} Staff</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs font-semibold text-blue-800 uppercase">Cuti / Izin Resmi</p>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{totalCuti} Staff</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs font-semibold text-red-800 uppercase">Tanpa Keterangan (Alpha)</p>
          <p className="text-2xl font-extrabold text-red-700 mt-1">{totalAlpha} Staff</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("absensi")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "absensi"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          📋 Rekap Kehadiran Hari Ini
        </button>
        <button
          onClick={() => setActiveTab("cuti")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "cuti"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>📝 Approval Pengajuan Cuti / Izin</span>
          <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full font-extrabold">
            {leaves.filter((l) => l.status === "Menunggu Approval").length}
          </span>
        </button>
      </div>

      {/* TAB 1: ABSENSI HARIAN */}
      {activeTab === "absensi" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Absensi Staff Hari Ini</h3>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-3 py-1.5"
            >
              <option value="">Semua Peran / Role</option>
              <option value="Dokter">Dokter</option>
              <option value="Perawat">Perawat</option>
              <option value="Staff Admin">Staff Admin</option>
              <option value="Apoteker">Apoteker</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-semibold">Nama Staff</th>
                  <th className="px-4 py-3 text-left font-semibold">Peran / Jabatan</th>
                  <th className="px-4 py-3 text-left font-semibold">Jam Masuk</th>
                  <th className="px-4 py-3 text-left font-semibold">Jam Pulang</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Jam Kerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance
                  .filter((a) => !filterRole || a.role === filterRole)
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{item.staffName}</td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">{item.role}</td>
                      <td className="px-4 py-3.5 text-slate-700 font-mono text-xs">{item.checkIn}</td>
                      <td className="px-4 py-3.5 text-slate-700 font-mono text-xs">{item.checkOut}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            item.status === "Hadir Tepat Waktu"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "Terlambat"
                              ? "bg-amber-100 text-amber-700"
                              : item.status === "Izin / Cuti"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-800">{item.workHours}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: APPROVAL CUTI */}
      {activeTab === "cuti" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-4 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Pengajuan Cuti &amp; Izin Staff</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-semibold">Pemohon</th>
                  <th className="px-4 py-3 text-left font-semibold">Peran</th>
                  <th className="px-4 py-3 text-left font-semibold">Periode Cuti</th>
                  <th className="px-4 py-3 text-left font-semibold">Alasan / Keterangan</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{l.staffName}</td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs">{l.role}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">
                      {l.startDate} s/d {l.endDate}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">{l.reason}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          l.status === "Disetujui"
                            ? "bg-emerald-100 text-emerald-700"
                            : l.status === "Ditolak"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {l.status === "Menunggu Approval" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveLeave(l.id)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleRejectLeave(l.id)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-400 rounded transition-colors"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Telah diproses</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
