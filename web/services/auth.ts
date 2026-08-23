import { api } from './api';

/**
 * Auth API - RSU Tangsel Care (admin)
 * Sesi sepenuhnya berbasis cookie httpOnly `token` + `refresh_token` yang
 * diset backend (POST /admin/login). Tidak ada token/profil yang disimpan di
 * localStorage/sessionStorage — profil diambil dari GET /admin/me, dan retry
 * refresh otomatis ditangani interceptor di api.ts.
 */

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AdminUser;
}

export async function fetchMe(): Promise<AdminUser> {
  return api.get<AdminUser>('/admin/me');
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<LoginResponse> {
  // Backend menyetel cookie httpOnly di respons ini; token di body hanya
  // untuk API client non-browser. Jangan fallback ke mock — session nyata
  // hanya ada jika login benar-benar sukses.
  return api.post<LoginResponse>('/admin/login', { username, password });
}

export async function logoutAdmin(): Promise<void> {
  try {
    await api.post('/admin/logout');
  } catch {
    // silent fallback
  }
}
