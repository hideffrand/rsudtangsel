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
  last_login: string;
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
  password?: string;
  role?: UserRole;
  is_active?: boolean;
}

const MOCK_USERS: AdminUser[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@rsudtangsel.id",
    role: "admin",
    is_active: true,
    last_login: new Date().toISOString(),
    last_login_ip: "127.0.0.1",
    last_login_browser: "Chrome",
    created_at: "2026-01-01T00:00:00Z",
  },
];

export const usersApi = {
  getAll: async (): Promise<AdminUser[]> => {
    try {
      return await api.get<AdminUser[]>('/admin/users');
    } catch {
      return MOCK_USERS;
    }
  },
  getOne: async (id: number): Promise<AdminUser> => {
    try {
      return await api.get<AdminUser>(`/admin/users/${id}`);
    } catch {
      const user = MOCK_USERS.find((u) => u.id === id);
      if (user) return user;
      throw new Error('User tidak ditemukan');
    }
  },
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
