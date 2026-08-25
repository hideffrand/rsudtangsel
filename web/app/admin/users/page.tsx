"use client";

/**
 * Manajemen User & Role Admin - RSU Tangsel Care (/admin/users)
 * CRUD akun staff via API backend (tanpa mock data).
 * Fitur: daftar + filter, tambah, edit, hapus, aktif/nonaktif,
 * dan metadata login terakhir (waktu, IP, browser).
 */

import { useState, useEffect, useCallback } from "react";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type AdminUser,
  type UserRole,
} from "@/services/users";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin System" },
  { value: "staff", label: "Staff" },
  { value: "dokter", label: "Dokter Spesialis" },
  { value: "backoffice", label: "Backoffice / Frontdesk" },
  { value: "hr", label: "HR / Kepegawaian" },
];

const ROLE_BADGE: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700",
  staff: "bg-slate-100 text-slate-700",
  dokter: "bg-blue-100 text-blue-700",
  backoffice: "bg-teal-100 text-teal-700",
  hr: "bg-amber-100 text-amber-700",
};

function roleLabel(role: string) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

function formatDateTime(value: string) {
  if (!value) return "Belum pernah";
  const [date, time] = value.split(" ");
  const [y, m, d] = date.split("-");
  return `${d}-${m}-${y}, ${time?.slice(0, 5)}`;
}

type ActionType = "delete" | "toggle";
interface ConfirmAction {
  id: number;
  action: ActionType;
  username: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // Dialog tambah user
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "backoffice" as UserRole,
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Dialog edit user
  const [editItem, setEditItem] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    email: "",
    password: "",
    role: "backoffice" as UserRole,
  });
  const [editError, setEditError] = useState("");

  // Dialog konfirmasi (hapus / toggle status)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [detailItem, setDetailItem] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await getUsers());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data pengguna.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleAddUser = async () => {
    setFormError("");
    if (!form.username || !form.email || !form.password) {
      setFormError("Semua field wajib diisi.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Password minimal 8 karakter.");
      return;
    }
    setSaving(true);
    try {
      const created = await createUser({ ...form });
      setUsers((prev) => [created, ...prev]);
      setIsAddOpen(false);
      setForm({ username: "", email: "", password: "", role: "backoffice" });
      toast.success(`Akun ${created.username} berhasil dibuat.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal membuat akun.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user: AdminUser) => {
    setEditItem(user);
    setEditForm({ email: user.email, password: "", role: user.role });
    setEditError("");
  };

  const handleUpdateUser = async () => {
    if (!editItem) return;
    setEditError("");
    if (!editForm.email) {
      setEditError("Email wajib diisi.");
      return;
    }
    if (editForm.password && editForm.password.length < 8) {
      setEditError("Password baru minimal 8 karakter.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateUser(editItem.id, {
        email: editForm.email,
        role: editForm.role,
        ...(editForm.password ? { password: editForm.password } : {}),
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditItem(null);
      toast.success(`Akun ${updated.username} berhasil diperbarui.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui akun.";
      setEditError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirm) return;
    setError("");
    try {
      let updated: AdminUser | undefined;
      if (confirm.action === "delete") {
        await deleteUser(confirm.id);
        setUsers((prev) => prev.filter((u) => u.id !== confirm.id));
        toast.success(`Akun ${confirm.username} berhasil dihapus.`);
      } else {
        const target = users.find((u) => u.id === confirm.id);
        if (target) {
          updated = await updateUser(confirm.id, { is_active: !target.is_active });
          setUsers((prev) => prev.map((u) => (u.id === updated!.id ? updated! : u)));
          toast.success(
            `Akun ${updated!.username} berhasil ${updated!.is_active ? "diaktifkan" : "dinonaktifkan"}.`,
          );
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Aksi gagal. Coba lagi.";
      setError(msg);
      toast.error(msg);
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Manajemen User &amp; Peran (Role)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola akun pengguna staff, tentukan hak akses role, dan pantau login terakhir.
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ username: "", email: "", password: "", role: "backoffice" });
            setFormError("");
            setIsAddOpen(true);
          }}
          className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
        >
          + Tambah Akun Staff Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Cari Username / Email
          </label>
          <input
            type="search"
            placeholder="Ketik kata kunci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="w-full sm:w-60 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Role / Hak Akses
          </label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Role</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">
            Daftar Pengguna <span className="text-emerald-600">({filteredUsers.length})</span>
          </h2>
          <button
            onClick={fetchUsers}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-600"
          >
            Muat Ulang
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-400">Memuat data...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-400">
            Tidak ada pengguna yang cocok.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-semibold">User</th>
                  <th className="px-6 py-3 text-left font-semibold">Email</th>
                  <th className="px-6 py-3 text-left font-semibold">Role</th>
                  <th className="px-6 py-3 text-left font-semibold hidden lg:table-cell">
                    Login Terakhir
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setDetailItem(user)}
                        className="font-bold text-slate-800 hover:text-emerald-700"
                        title="Lihat detail"
                      >
                        @{user.username}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                          ROLE_BADGE[user.role] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 hidden lg:table-cell">
                      {user.last_login ? (
                        <>
                          {formatDateTime(user.last_login)}
                          {user.last_login_browser && (
                            <span className="block text-[11px]">
                              {user.last_login_browser}
                              {user.last_login_ip ? ` · ${user.last_login_ip}` : ""}
                            </span>
                          )}
                        </>
                      ) : (
                        "Belum pernah"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          user.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {user.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() =>
                          setConfirm({
                            id: user.id,
                            action: "toggle",
                            username: user.username,
                          })
                        }
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          user.is_active
                            ? "text-red-600 bg-red-50 hover:bg-red-100 border border-red-200"
                            : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {user.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => openEdit(user)}
                        className="ml-2 px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setConfirm({
                            id: user.id,
                            action: "delete",
                            username: user.username,
                          })
                        }
                        className="ml-2 px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah User */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Buat Akun Staff Baru"
        confirmLabel={saving ? "Menyimpan..." : "Simpan Akun"}
        cancelLabel="Batal"
        onConfirm={handleAddUser}
      >
        <div className="space-y-3 text-sm">
          {formError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </p>
          )}
          <Field label="Username">
            <input
              type="text"
              placeholder="contoh: staff_rina"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 mt-1"
            />
          </Field>
          <Field label="Email Resmi RS">
            <input
              type="email"
              placeholder="nama@rsudtangsel.go.id"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 mt-1"
            />
          </Field>
          <Field label="Password (min. 8 karakter)">
            <input
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 mt-1"
            />
          </Field>
          <Field label="Role / Hak Akses">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Dialog>

      {/* Modal Edit User */}
      <Dialog
        isOpen={editItem !== null}
        onClose={() => setEditItem(null)}
        title={editItem ? `Edit Akun @${editItem.username}` : ""}
        confirmLabel={saving ? "Menyimpan..." : "Simpan Perubahan"}
        cancelLabel="Batal"
        onConfirm={handleUpdateUser}
      >
        <div className="space-y-3 text-sm">
          {editError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {editError}
            </p>
          )}
          <Field label="Email">
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 mt-1"
            />
          </Field>
          <Field label="Password Baru (kosongkan jika tetap)">
            <input
              type="password"
              placeholder="********"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 mt-1"
            />
          </Field>
          <Field label="Role / Hak Akses">
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Dialog>

      {/* Dialog Konfirmasi Hapus / Toggle Status */}
      <Dialog
        isOpen={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "delete" ? "Hapus Akun" : "Ubah Status Akun"}
        confirmLabel={confirm?.action === "delete" ? "Ya, Hapus" : "Ya, Lanjutkan"}
        cancelLabel="Batal"
        confirmVariant={confirm?.action === "delete" ? "destructive" : "primary"}
        onConfirm={handleConfirmAction}
      >
        {confirm && (
          <p className="text-sm text-slate-600">
            {confirm.action === "delete" ? (
              <>
                Akun <strong>@{confirm.username}</strong> beserta sesi loginnya akan dihapus
                permanen.
              </>
            ) : (
              <>
                Status akun <strong>@{confirm.username}</strong> akan diubah. Pengguna nonaktif
                tidak bisa login.
              </>
            )}
          </p>
        )}
      </Dialog>

      {/* Dialog Detail (login terakhir) */}
      <Dialog
        isOpen={detailItem !== null}
        onClose={() => setDetailItem(null)}
        title={detailItem ? `Detail @${detailItem.username}` : ""}
        cancelLabel="Tutup"
      >
        {detailItem && (
          <div className="space-y-2 text-sm">
            {[
              { label: "Username", value: "@" + detailItem.username },
              { label: "Email", value: detailItem.email },
              { label: "Role", value: roleLabel(detailItem.role) },
              { label: "Status", value: detailItem.is_active ? "Aktif" : "Nonaktif" },
              {
                label: "Login Terakhir",
                value: detailItem.last_login ? formatDateTime(detailItem.last_login) : "Belum pernah",
              },
              { label: "IP Terakhir", value: detailItem.last_login_ip || "-" },
              { label: "Browser", value: detailItem.last_login_browser || "-" },
              { label: "Dibuat", value: formatDateTime(detailItem.created_at) },
            ].map((row) => (
              <div key={row.label} className="space-y-0.5">
                <p className="text-xs font-semibold uppercase text-slate-400">{row.label}</p>
                <p className="text-slate-800">{row.value}</p>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase block">{label}</label>
      {children}
    </div>
  );
}
