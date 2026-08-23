import { api } from './api';

/**
 * User Management API - RSU Tangsel Care (admin-only)
 * CRUD akun staff + metadata login terakhir (waktu, IP, browser).
 */

export type UserRole = "admin" | "staff" | "dokter" | "backoffice" | "hr";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  last_login: string; // "YYYY-MM-DD HH24:MI:SS", string kosong jika belum pernah login
  last_login_ip: string;
  last_login_browser: string;
  created_at: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  is_active?: boolean;
}

export interface UpdateUserPayload {
  email?: string;
  password?: string; // kosongkan untuk mempertahankan password lama
  role?: UserRole;
  is_active?: boolean;
}

export const usersApi = {
  getAll: () => api.get<AdminUser[]>('/admin/users'),
  getOne: (id: number) => api.get<AdminUser>(`/admin/users/${id}`),
  create: (data: CreateUserPayload) => api.post<AdminUser>('/admin/users', data),
  update: (id: number, data: UpdateUserPayload) =>
    api.put<AdminUser>(`/admin/users/${id}`, data),
  remove: (id: number) => api.delete<void>(`/admin/users/${id}`),
};

// Named helpers — dipakai halaman admin manajemen user.
export const getUsers = usersApi.getAll;
export const createUser = usersApi.create;
export const updateUser = usersApi.update;
export const deleteUser = usersApi.remove;
