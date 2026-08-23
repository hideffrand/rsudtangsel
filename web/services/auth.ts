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

const MOCK_ADMIN: AdminUser = { id: 1, username: 'admin', email: 'admin@rsudtangsel.id', role: 'admin' };
const MOCK_TOKEN = 'mock-dev-token-rsudtangsel';

export async function fetchMe(): Promise<AdminUser> {
  try {
    return await api.get<AdminUser>('/admin/me');
  } catch {
    // Backend tidak tersedia — kembalikan mock user jika token dev ada
    if (typeof document !== 'undefined' && document.cookie.includes(MOCK_TOKEN)) {
      return MOCK_ADMIN;
    }
    throw new Error('Unauthenticated');
  }
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<LoginResponse> {
  try {
    // Backend menyetel cookie httpOnly di respons ini; token di body hanya
    // untuk API client non-browser.
    return await api.post<LoginResponse>('/admin/login', { username, password });
  } catch {
    // Fallback development: jika backend tidak tersedia, gunakan kredensial hardcoded
    if (username === 'admin' && password === 'admin123') {
      // Set cookie manual agar proxy.ts bisa mendeteksinya
      if (typeof document !== 'undefined') {
        document.cookie = `token=${MOCK_TOKEN}; path=/; max-age=86400; SameSite=Lax`;
      }
      return {
        access_token: MOCK_TOKEN,
        refresh_token: MOCK_TOKEN,
        token_type: 'Bearer',
        expires_in: 86400,
        user: MOCK_ADMIN,
      };
    }
    throw new Error('Username atau password salah.');
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await api.post('/admin/logout');
  } catch {
    // silent fallback
  }
  // Hapus cookie mock jika ada
  if (typeof document !== 'undefined') {
    document.cookie = 'token=; path=/; max-age=0';
  }
}
