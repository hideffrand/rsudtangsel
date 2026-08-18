/**
 * Admin API Client — RSU Tangsel Care
 * Semua request ke backend admin dilakukan lewat helper ini.
 * Jika backend offline / error, otomatis menggunakan Mock Data (Frontend Standalone).
 * Token JWT/Session disimpan di localStorage (client-side only).
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ─── Token Management ─────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_refresh_token");
}

export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("admin_access_token", accessToken);
  localStorage.setItem("admin_refresh_token", refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem("admin_access_token");
  localStorage.removeItem("admin_refresh_token");
  localStorage.removeItem("admin_user");
}

export function saveUser(user: AdminUser): void {
  localStorage.setItem("admin_user", JSON.stringify(user));
}

export function getUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("admin_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface DashboardStats {
  pasien_hari_ini: number;
  rata_waktu_tunggu: number;
  dokter_aktif: number;
  keluhan_baru: number;
  total_antrian: number;
  update_time: string;
}

export interface AntrianItem {
  id: number;
  nomor: string;
  nama: string;
  poli: string;
  dokter: string;
  status: "Waiting" | "Processing" | "Done" | "Cancelled";
  created_at: string;
}

export interface McuBookingItem {
  id: number;
  package_name: string;
  full_name: string;
  nik: string;
  phone_number: string;
  booking_date: string;
  booking_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  payment_status: "unpaid" | "awaiting_confirmation" | "paid" | "cancelled";
  total_price: number;
  payment_method: string;
  notes: string;
  created_at: string;
}

// ─── Mock Data Standalone ─────────────────────────────────────────────────────

const MOCK_ANTRIAN: AntrianItem[] = [
  { id: 1, nomor: "J001", nama: "Budi Santoso", poli: "Jantung", dokter: "dr. Ahmad Sp.JP", status: "Waiting", created_at: "08:15:00" },
  { id: 2, nomor: "J002", nama: "Siti Rahma", poli: "Jantung", dokter: "dr. Ahmad Sp.JP", status: "Waiting", created_at: "08:30:00" },
  { id: 3, nomor: "A001", nama: "Ahmad Fauzi", poli: "Anak", dokter: "dr. Siti Sp.A", status: "Processing", created_at: "08:45:00" },
  { id: 4, nomor: "K001", nama: "Dewi Lestari", poli: "Kandungan", dokter: "dr. Budi Sp.OG", status: "Done", created_at: "09:00:00" },
  { id: 5, nomor: "M001", nama: "Rini Astuti", poli: "Mata", dokter: "dr. Maya Sp.M", status: "Waiting", created_at: "09:15:00" },
  { id: 6, nomor: "B001", nama: "Hendra Wijaya", poli: "Bedah", dokter: "dr. Irwan Sp.B", status: "Cancelled", created_at: "09:30:00" },
];

const MOCK_MCU: McuBookingItem[] = [
  { id: 1, package_name: "MCU Gold", full_name: "Budi Santoso", nik: "3674011204890001", phone_number: "08123456789", booking_date: "2026-08-25", booking_time: "09:00:00", status: "pending", payment_status: "awaiting_confirmation", total_price: 1350000, payment_method: "transfer", notes: "Puasa 8 jam sebelum tes", created_at: "2026-08-17 14:00" },
  { id: 2, package_name: "MCU Pelajar", full_name: "Siti Aminah", nik: "3674015509050002", phone_number: "085711223344", booking_date: "2026-08-20", booking_time: "10:00:00", status: "confirmed", payment_status: "paid", total_price: 300000, payment_method: "qris", notes: "Syarat masuk universitas", created_at: "2026-08-16 10:30" },
  { id: 3, package_name: "MCU Platinum", full_name: "Hendra Wijaya", nik: "3674012011780003", phone_number: "081399887766", booking_date: "2026-08-22", booking_time: "08:30:00", status: "completed", payment_status: "paid", total_price: 2100000, payment_method: "cash", notes: "Pemeriksaan tahunan kantor", created_at: "2026-08-15 09:15" },
];

// ─── Base Fetcher ─────────────────────────────────────────────────────────────

async function adminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }

  return json.data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginAdmin(
  username: string,
  password: string
): Promise<LoginResponse> {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (res.ok && json.data) {
      return json.data as LoginResponse;
    }
  } catch {
    // Backend offline / error → Fallback Mock Login
  }

  if (!username || !password) {
    throw new Error("Username dan password wajib diisi");
  }

  return {
    access_token: `mock_access_token_${Date.now()}`,
    refresh_token: `mock_refresh_token_${Date.now()}`,
    token_type: "Bearer",
    expires_in: 3600,
    user: {
      id: 1,
      username: username || "admin",
      email: `${username || "admin"}@rsudtangsel.go.id`,
      role: "admin",
    },
  };
}

export async function logoutAdmin(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await adminFetch("/api/admin/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // silent fallback
    }
  }
  clearTokens();
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    return await adminFetch<DashboardStats>("/api/admin/dashboard/stats");
  } catch {
    const now = new Date();
    return {
      pasien_hari_ini: 38,
      rata_waktu_tunggu: 14.2,
      dokter_aktif: 14,
      keluhan_baru: 5,
      total_antrian: 12,
      update_time: now.toLocaleTimeString("id-ID"),
    };
  }
}

// ─── Antrian (Queue) ─────────────────────────────────────────────────────────

export async function getAntrianAdmin(params?: {
  poli?: string;
  tanggal?: string;
}): Promise<AntrianItem[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.poli) qs.set("poli", params.poli);
    if (params?.tanggal) qs.set("tanggal", params.tanggal);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return await adminFetch<AntrianItem[]>(`/api/admin/antrian${query}`);
  } catch {
    let result = [...MOCK_ANTRIAN];
    if (params?.poli) {
      result = result.filter((a) => a.poli.toLowerCase() === params.poli?.toLowerCase());
    }
    return result;
  }
}

export async function callPatient(id: number): Promise<AntrianItem> {
  try {
    return await adminFetch<AntrianItem>(`/api/admin/antrian/${id}/call`, { method: "PATCH" });
  } catch {
    const item = MOCK_ANTRIAN.find((a) => a.id === id) ?? MOCK_ANTRIAN[0];
    return { ...item, status: "Processing" };
  }
}

export async function skipPatient(id: number): Promise<AntrianItem> {
  try {
    return await adminFetch<AntrianItem>(`/api/admin/antrian/${id}/skip`, { method: "PATCH" });
  } catch {
    const item = MOCK_ANTRIAN.find((a) => a.id === id) ?? MOCK_ANTRIAN[0];
    return { ...item, status: "Cancelled" };
  }
}

// ─── MCU Booking ──────────────────────────────────────────────────────────────

export async function getMcuBookings(params?: {
  status?: string;
  tanggal?: string;
}): Promise<McuBookingItem[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.tanggal) qs.set("tanggal", params.tanggal);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return await adminFetch<McuBookingItem[]>(`/api/admin/mcu/bookings${query}`);
  } catch {
    let result = [...MOCK_MCU];
    if (params?.status) {
      result = result.filter((b) => b.status === params.status);
    }
    return result;
  }
}

export async function confirmMcuBooking(id: number): Promise<McuBookingItem> {
  try {
    return await adminFetch<McuBookingItem>(`/api/admin/mcu/bookings/${id}/confirm`, { method: "PATCH" });
  } catch {
    const item = MOCK_MCU.find((b) => b.id === id) ?? MOCK_MCU[0];
    return { ...item, status: "confirmed" };
  }
}

export async function cancelMcuBooking(id: number): Promise<McuBookingItem> {
  try {
    return await adminFetch<McuBookingItem>(`/api/admin/mcu/bookings/${id}/cancel`, { method: "PATCH" });
  } catch {
    const item = MOCK_MCU.find((b) => b.id === id) ?? MOCK_MCU[0];
    return { ...item, status: "cancelled", payment_status: "cancelled" };
  }
}

export async function confirmMcuPayment(id: number): Promise<McuBookingItem> {
  try {
    return await adminFetch<McuBookingItem>(`/api/admin/mcu/bookings/${id}/payment/confirm`, { method: "PATCH" });
  } catch {
    const item = MOCK_MCU.find((b) => b.id === id) ?? MOCK_MCU[0];
    return { ...item, payment_status: "paid" };
  }
}
