"use client";

/**
 * Manajemen User & Role Admin — RSU Tangsel Care (/admin/users)
 * Fitur:
 * 1. Kelola akun staff
 * 2. Role (admin, dokter, backoffice, HR)
 * 3. Aktifkan / Nonaktifkan akun
 */

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";

interface UserAccount {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: "admin" | "dokter" | "backoffice" | "HR";
  status: "Aktif" | "Nonaktif";
  lastLogin: string;
}

const INITIAL_USERS: UserAccount[] = [
  { id: 1, username: "admin", fullName: "Administrator Utama", email: "admin@rsudtangsel.go.id", role: "admin", status: "Aktif", lastLogin: "Hari ini, 14:26" },
  { id: 2, username: "dr_ahmad", fullName: "dr. Ahmad Sp.JP", email: "ahmad@rsudtangsel.go.id", role: "dokter", status: "Aktif", lastLogin: "Kemarin, 16:45" },
  { id: 3, username: "staff_budi", fullName: "Budi Kurniawan", email: "budi@rsudtangsel.go.id", role: "backoffice", status: "Aktif", lastLogin: "Hari ini, 08:10" },
  { id: 4, username: "hr_sarah", fullName: "Sarah Nurul S.Psi", email: "sarah@rsudtangsel.go.id", role: "HR", status: "Aktif", lastLogin: "15-08-2026" },
  { id: 5, username: "dr_budi_ex", fullName: "dr. Budi (Nonaktif)", email: "budi_old@rsudtangsel.go.id", role: "dokter", status: "Nonaktif", lastLogin: "01-07-2026" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "dokter" | "backoffice" | "HR">("backoffice");

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleToggleStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "Aktif" ? "Nonaktif" : "Aktif" } : u
      )
    );
  };

  const handleAddUser = () => {
    if (!newUsername || !newFullName || !newEmail) return;
    const newUser: UserAccount = {
      id: Date.now(),
      username: newUsername,
      fullName: newFullName,
      email: newEmail,
      role: newRole,
      status: "Aktif",
      lastLogin: "Belum pernah",
    };
    setUsers([newUser, ...users]);
    setIsAddOpen(false);
    setNewUsername("");
    setNewFullName("");
    setNewEmail("");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen User &amp; Peran (Role)</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola akun pengguna staff, tentukan hak akses role (Admin, Dokter, Backoffice, HR), dan status akun.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
        >
          + Tambah Akun Staff Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cari Username / Nama / Email</label>
          <input
            type="search"
            placeholder="Ketik kata kunci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="w-full sm:w-60 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role / Hak Akses</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Role</option>
            <option value="admin">Admin System</option>
            <option value="dokter">Dokter Spesialis</option>
            <option value="backoffice">Backoffice / Frontdesk</option>
            <option value="HR">HR / Kepegawaian</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">
            Daftar Pengguna <span className="text-emerald-600">({filteredUsers.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3 text-left font-semibold">User &amp; Nama Lengkap</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Role</th>
                <th className="px-6 py-3 text-left font-semibold">Login Terakhir</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-right font-semibold">Aksi Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{user.fullName}</p>
                    <p className="text-xs text-slate-400 font-mono">@{user.username}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "dokter"
                          ? "bg-blue-100 text-blue-700"
                          : user.role === "HR"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">{user.lastLogin}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        user.status === "Aktif"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        user.status === "Aktif"
                          ? "text-red-600 bg-red-50 hover:bg-red-100 border border-red-200"
                          : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                      }`}
                    >
                      {user.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Buat Akun Staff Baru"
        confirmLabel="Simpan Akun"
        cancelLabel="Batal"
        onConfirm={handleAddUser}
      >
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Username</label>
            <input
              type="text"
              placeholder="contoh: staff_rina"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Nama beserta gelar"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Email Resmi RS</label>
            <input
              type="email"
              placeholder="nama@rsudtangsel.go.id"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Role / Hak Akses</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserAccount["role"])}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
            >
              <option value="admin">Admin System</option>
              <option value="dokter">Dokter Spesialis</option>
              <option value="backoffice">Backoffice / Frontdesk</option>
              <option value="HR">HR / Kepegawaian</option>
            </select>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
