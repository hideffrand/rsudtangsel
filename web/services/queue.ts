import { api } from './api';

/**
 * Queue API - RSU Tangsel Care
 * Satu modul untuk sisi publik (lihat antrian per poli) dan sisi admin
 * (manajemen antrian: panggil, skip, check-in, selesai, rujukan).
 * Jika backend offline, fallback admin ke mock data (frontend standalone).
 */

// ─── Publik ───────────────────────────────────────────────────────────────────

export interface PublicQueueItem {
  number: string;
  name: string;
  status: string;
}

export const queueApi = {
  getByDepartment: (department: string, date?: string) =>
    api.get<PublicQueueItem[]>(
      `/queue?department=${encodeURIComponent(department)}${date ? `&date=${encodeURIComponent(date)}` : ''}`,
    ),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface QueueItem {
  id: number;
  number: string;
  patient_name: string;
  nik?: string;
  phone_number?: string;
  poli: string;
  doctor_name: string;
  doctor_phone?: string;
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
  family_phone_number?: string;
  family_name?: string;
  whatsapp_url?: string;
  doctor_whatsapp_url?: string;
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

export async function getAdminQueue(params?: {
  poli?: string;
  date?: string;
}): Promise<QueueItem[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.poli) qs.set("poli", params.poli);
    if (params?.date) qs.set("date", params.date);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return await api.get<QueueItem[]>(`/admin/queue${query}`);
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
    return await api.patch<QueueItem>(`/admin/queue/${id}/call`);
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
    return await api.patch<QueueItem>(`/admin/queue/${id}/skip`);
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
    return await api.post<QueueItem>(`/admin/queue/checkin`, { identifier });
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
    family_phone_number?: string;
    family_name?: string;
  }
): Promise<QueueItem> {
  try {
    const result = await api.post<QueueItem>(`/admin/queue/${id}/finish`, {
      outcome,
      family_phone_number: details?.family_phone_number || '',
      family_name: details?.family_name || '',
      outcome_notes: details?.outcome_notes || '',
      medical_record_no: details?.medical_record_no || '',
      referred_to_poli: details?.referred_to_poli || '',
      referred_to_doctor: details?.referred_to_doctor || '',
      referred_date: details?.referred_date || '',
      floor_info: details?.floor_info || '',
    });
    return result;
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
