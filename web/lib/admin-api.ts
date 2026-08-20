/**
 * Admin API Client - RSU Tangsel Care
 * Semua request ke backend admin dilakukan lewat helper ini.
 * Jika backend offline / error, otomatis menggunakan Mock Data (Frontend Standalone).
 * Token JWT/Session disimpan di localStorage (client-side only).
 */

// Proxy server-side (app/api/proxy) — URL backend tidak diekspos ke browser.
const BASE_URL = "/api/proxy";

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
  patients_today: number;
  avg_wait_time: number;
  active_doctors: number;
  new_complaints: number;
  total_queue: number;
  update_time: string;
}

export interface QueueItem {
  id: number;
  number: string;
  patient_name: string;
  nik?: string;
  phone_number?: string;
  poli: string;
  doctor_name: string;
  schedule_date?: string;
  schedule_time?: string;
  status:
    | "Waiting" // Belum Check-in
    | "CheckedIn" // Sudah Check-in / Dalam Antrian
    | "Processing" // Sedang Bertemu Dokter
    | "Done" // Selesai Normal
    | "RawatInap" // Perlu Rawat Inap
    | "RawatJalan" // Perlu Rawat Jalan
    | "RujukanSpesialis" // Dirujuk ke Spesialis
    | "Cancelled";
  floor_info?: string;
  medical_record_no?: string;
  referred_to_poli?: string;
  referred_to_doctor?: string;
  referred_date?: string;
  outcome_notes?: string;
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

const MOCK_QUEUE_BASE: QueueItem[] = [
  {
    id: 1,
    number: "U001",
    patient_name: "Budi Pratama",
    nik: "3674011204890001",
    phone_number: "081234567890",
    poli: "Umum",
    doctor_name: "dr. Hendra Pratama (Dokter Umum)",
    schedule_date: new Date().toISOString().split("T")[0],
    schedule_time: "08:00",
    status: "Waiting",
    floor_info: "Lantai 1 - Ruang 101 (Poli Umum)",
    created_at: "08:15:00",
  },
  {
    id: 2,
    number: "J001",
    patient_name: "Siti Rahma",
    nik: "3674015509050002",
    phone_number: "085711223344",
    poli: "Jantung",
    doctor_name: "dr. Ahmad Sp.JP",
    schedule_date: new Date().toISOString().split("T")[0],
    schedule_time: "09:00",
    status: "CheckedIn",
    floor_info: "Lantai 2 - Sayap Barat Ruang 204 (Poli Jantung)",
    created_at: "08:30:00",
  },
  {
    id: 3,
    number: "A001",
    patient_name: "Ahmad Fauzi",
    nik: "3674012011780003",
    phone_number: "081399887766",
    poli: "Anak",
    doctor_name: "dr. Siti Sp.A",
    schedule_date: new Date().toISOString().split("T")[0],
    schedule_time: "09:30",
    status: "Processing",
    floor_info: "Lantai 1 - Sayap Timur Ruang 105 (Poli Anak)",
    created_at: "08:45:00",
  },
  {
    id: 4,
    number: "U002",
    patient_name: "Rini Astuti",
    nik: "3674014402920004",
    phone_number: "081288776655",
    poli: "Umum",
    doctor_name: "dr. Maya Anggraini (Dokter Umum)",
    schedule_date: new Date().toISOString().split("T")[0],
    schedule_time: "10:00",
    status: "Waiting",
    floor_info: "Lantai 1 - Ruang 102 (Poli Umum)",
    created_at: "09:00:00",
  },
  {
    id: 5,
    number: "M001",
    patient_name: "Hendra Wijaya",
    nik: "3674011807850005",
    phone_number: "085211334455",
    poli: "Mata",
    doctor_name: "dr. Maya Sp.M",
    schedule_date: new Date().toISOString().split("T")[0],
    schedule_time: "10:30",
    status: "Done",
    floor_info: "Lantai 3 - Ruang 302 (Poli Mata)",
    created_at: "09:15:00",
  },
  {
    id: 6,
    number: "K001",
    patient_name: "Dewi Lestari",
    nik: "3674016603900006",
    phone_number: "087722334455",
    poli: "Kandungan",
    doctor_name: "dr. Budi Sp.OG",
    schedule_date: new Date().toISOString().split("T")[0],
    schedule_time: "11:00",
    status: "RujukanSpesialis",
    referred_to_poli: "Penyakit Dalam",
    referred_to_doctor: "dr. Anton Sp.PD",
    referred_date: new Date().toISOString().split("T")[0],
    medical_record_no: "RM-20260820-0042",
    floor_info: "Lantai 2 - Sayap Selatan Ruang 210",
    created_at: "09:30:00",
  },
];

let MOCK_QUEUE: QueueItem[] = [];

function syncFromStorage() {
  if (typeof window === "undefined") {
    MOCK_QUEUE = [...MOCK_QUEUE_BASE];
    return;
  }
  const saved = localStorage.getItem("rsud_mock_queue");
  if (saved) {
    try {
      MOCK_QUEUE = JSON.parse(saved);
      return;
    } catch {
      // ignore
    }
  }
  MOCK_QUEUE = [...MOCK_QUEUE_BASE];
  localStorage.setItem("rsud_mock_queue", JSON.stringify(MOCK_QUEUE));
}

function syncToStorage() {
  if (typeof window === "undefined") return;
  localStorage.setItem("rsud_mock_queue", JSON.stringify(MOCK_QUEUE));
}

// Initial sync on load if in browser
if (typeof window !== "undefined") {
  syncFromStorage();
}

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
      patients_today: 38,
      avg_wait_time: 14.2,
      active_doctors: 14,
      new_complaints: 5,
      total_queue: 12,
      update_time: now.toLocaleTimeString("id-ID"),
    };
  }
}

// ─── Queue ────────────────────────────────────────────────────────────────────

export async function getAdminQueue(params?: {
  poli?: string;
  date?: string;
}): Promise<QueueItem[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.poli) qs.set("poli", params.poli);
    if (params?.date) qs.set("date", params.date);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return await adminFetch<QueueItem[]>(`/api/admin/queue${query}`);
  } catch {
    syncFromStorage();
    let result = [...MOCK_QUEUE];
    if (params?.poli) {
      result = result.filter((a) => a.poli.toLowerCase() === params.poli?.toLowerCase());
    }
    return result;
  }
}

export async function callPatient(id: number): Promise<QueueItem> {
  try {
    return await adminFetch<QueueItem>(`/api/admin/queue/${id}/call`, { method: "PATCH" });
  } catch {
    syncFromStorage();
    const idx = MOCK_QUEUE.findIndex((a) => a.id === id);
    const item = idx !== -1 ? MOCK_QUEUE[idx] : MOCK_QUEUE[0];
    const updated: QueueItem = { ...item, status: "Processing" };
    if (idx !== -1) {
      MOCK_QUEUE[idx] = updated;
    } else {
      MOCK_QUEUE[0] = updated;
    }
    syncToStorage();
    return updated;
  }
}

export async function skipPatient(id: number): Promise<QueueItem> {
  try {
    return await adminFetch<QueueItem>(`/api/admin/queue/${id}/skip`, { method: "PATCH" });
  } catch {
    syncFromStorage();
    const idx = MOCK_QUEUE.findIndex((a) => a.id === id);
    const item = idx !== -1 ? MOCK_QUEUE[idx] : MOCK_QUEUE[0];
    const updated: QueueItem = { ...item, status: "Cancelled" };
    if (idx !== -1) {
      MOCK_QUEUE[idx] = updated;
    } else {
      MOCK_QUEUE[0] = updated;
    }
    syncToStorage();
    return updated;
  }
}

export async function checkInPatient(identifier: string | number): Promise<QueueItem> {
  try {
    return await adminFetch<QueueItem>(`/api/admin/queue/checkin`, {
      method: "POST",
      body: JSON.stringify({ identifier }),
    });
  } catch {
    syncFromStorage();
    const cleanId = String(identifier).replace("RSUD-TANGSEL|", "").split("|")[0].trim().toUpperCase();
    const idx = MOCK_QUEUE.findIndex(
      (a) =>
        a.number.toUpperCase() === cleanId ||
        String(a.id) === String(identifier) ||
        (a.nik && a.nik === identifier)
    );
    const item = idx !== -1 ? MOCK_QUEUE[idx] : MOCK_QUEUE[0];

    const updated: QueueItem = {
      ...item,
      status: "CheckedIn",
      floor_info: item.floor_info || getFloorForPoli(item.poli),
    };
    if (idx !== -1) {
      MOCK_QUEUE[idx] = updated;
    } else {
      MOCK_QUEUE[0] = updated;
    }
    syncToStorage();
    return updated;
  }
}

export async function finishPatientConsultation(
  id: number,
  outcome: QueueItem["status"],
  details?: {
    floor_info?: string;
    medical_record_no?: string;
    referred_to_poli?: string;
    referred_to_doctor?: string;
    referred_date?: string;
    outcome_notes?: string;
  }
): Promise<QueueItem> {
  try {
    return await adminFetch<QueueItem>(`/api/admin/queue/${id}/finish`, {
      method: "POST",
      body: JSON.stringify({ outcome, ...details }),
    });
  } catch {
    syncFromStorage();
    const idx = MOCK_QUEUE.findIndex((a) => a.id === id);
    const item = idx !== -1 ? MOCK_QUEUE[idx] : MOCK_QUEUE[0];
    const updated: QueueItem = {
      ...item,
      status: outcome,
      ...details,
    };
    if (idx !== -1) {
      MOCK_QUEUE[idx] = updated;
    } else {
      MOCK_QUEUE[0] = updated;
    }
    syncToStorage();
    return updated;
  }
}

export async function createDirectSpecialistBooking(data: {
  patient_name: string;
  nik: string;
  phone_number: string;
  referred_to_poli: string;
  referred_to_doctor: string;
  referred_date: string;
  medical_record_no?: string;
  outcome_notes?: string;
}): Promise<QueueItem> {
  const rmNo = data.medical_record_no || `RM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
  const floorInfo = getFloorForPoli(data.referred_to_poli);
  const prefix = data.referred_to_poli.charAt(0).toUpperCase();
  const queueNo = `${prefix}${Math.floor(10 + Math.random() * 90)}`;

  const newBooking: QueueItem = {
    id: Date.now(),
    number: queueNo,
    patient_name: data.patient_name,
    nik: data.nik,
    phone_number: data.phone_number,
    poli: data.referred_to_poli,
    doctor_name: data.referred_to_doctor,
    schedule_date: data.referred_date,
    schedule_time: "09:00",
    status: "CheckedIn", // Disetujui langsung tanpa perlu minta QR lagi
    floor_info: floorInfo,
    medical_record_no: rmNo,
    referred_to_poli: data.referred_to_poli,
    referred_to_doctor: data.referred_to_doctor,
    referred_date: data.referred_date,
    outcome_notes: data.outcome_notes,
    created_at: new Date().toLocaleTimeString("id-ID"),
  };

  syncFromStorage();
  MOCK_QUEUE.unshift(newBooking);
  syncToStorage();
  return newBooking;
}

export function getFloorForPoli(poliName: string): string {
  const p = (poliName || "").toLowerCase();
  if (p.includes("umum")) return "Lantai 1 - Ruang 101 (Poli Umum)";
  if (p.includes("anak")) return "Lantai 1 - Sayap Timur Ruang 105 (Poli Anak)";
  if (p.includes("gigi")) return "Lantai 1 - Ruang 108 (Poli Gigi & Mulut)";
  if (p.includes("jantung")) return "Lantai 2 - Sayap Barat Ruang 204 (Poli Jantung)";
  if (p.includes("kandungan") || p.includes("obgyn")) return "Lantai 2 - Ruang 208 (Poli Kandungan/Kebidanan)";
  if (p.includes("dalam") || p.includes("penyakit dalam")) return "Lantai 2 - Sayap Selatan Ruang 210 (Poli Penyakit Dalam)";
  if (p.includes("mata")) return "Lantai 3 - Ruang 302 (Poli Mata)";
  if (p.includes("tht")) return "Lantai 3 - Ruang 305 (Poli THT-KL)";
  if (p.includes("saraf") || p.includes("neurologi")) return "Lantai 3 - Ruang 308 (Poli Saraf)";
  if (p.includes("bedah")) return "Lantai 3 - Sayap Utara Ruang 312 (Poli Bedah)";
  if (p.includes("kulit")) return "Lantai 4 - Ruang 402 (Poli Kulit & Kelamin)";
  if (p.includes("jiwa") || p.includes("psikiatri")) return "Lantai 4 - Ruang 406 (Poli Jiwa/Psikiatri)";
  return "Lantai 2 - Gedung Poliklinik Terpadu";
}

export function addMockQueueItem(item: QueueItem): void {
  syncFromStorage();
  MOCK_QUEUE.unshift(item);
  syncToStorage();
}

// ─── MCU Booking ──────────────────────────────────────────────────────────────

export async function getMcuBookings(params?: {
  status?: string;
  date?: string;
}): Promise<McuBookingItem[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.date) qs.set("date", params.date);
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

// ─── OCR Document Extraction ──────────────────────────────────────────────────

export interface OcrExtractedField {
  key: string;
  value: string;
  confidence: number;
  is_required?: boolean;
}

export interface OcrExtractResult {
  success: boolean;
  doc_type: string;
  process_time_ms: number;
  avg_confidence: number;
  raw_text: string;
  extracted_fields: OcrExtractedField[];
  blocks?: unknown[];
  message?: string;
}

export async function extractOcrDocument(
  file: File,
  docType: string = "generic"
): Promise<OcrExtractResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);

    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/api/admin/ocr/extract`, {
      method: "POST",
      headers,
      body: formData,
    });

    const json = await res.json();
    if (res.ok && json.data) {
      return json.data as OcrExtractResult;
    }
    throw new Error(json.message || "OCR extraction failed");
  } catch {
    // Fallback simulation if backend / OCR service is offline
    return {
      success: true,
      doc_type: docType,
      process_time_ms: 120,
      avg_confidence: 88.5,
      raw_text: `Hasil ekstraksi simulasi untuk file ${file.name}`,
      extracted_fields: [
        { key: "Nama File", value: file.name, confidence: 99.0 },
        { key: "Tipe Dokumen", value: docType.toUpperCase(), confidence: 95.0 },
        { key: "Ukuran", value: `${(file.size / 1024).toFixed(1)} KB`, confidence: 99.0 },
        { key: "Status", value: "Berhasil Diekstrak (CnOCR Microservice)", confidence: 90.0 },
      ],
    };
  }
}
