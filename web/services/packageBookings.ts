import { api } from './api';

/**
 * Package Booking API - RSU Tangsel Care (admin)
 * Manajemen booking paket layanan MCU/Lab/Radiologi (konfirmasi, pembatalan, pembayaran).
 * Katalog paket ada di medicalPackages.ts.
 * Jika backend offline, fallback admin ke mock data.
 */

// ─── Booking MCU (admin) ──────────────────────────────────────────────────────

export interface PackageBookingItem {
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

const MOCK_BOOKINGS: PackageBookingItem[] = [
  { id: 1, package_name: "MCU Gold", full_name: "Budi Santoso", nik: "3674011204890001", phone_number: "08123456789", booking_date: "2026-08-25", booking_time: "09:00:00", status: "pending", payment_status: "awaiting_confirmation", total_price: 1350000, payment_method: "transfer", notes: "Puasa 8 jam sebelum tes", created_at: "2026-08-17 14:00" },
  { id: 2, package_name: "MCU Pelajar", full_name: "Siti Aminah", nik: "3674015509050002", phone_number: "085711223344", booking_date: "2026-08-20", booking_time: "10:00:00", status: "confirmed", payment_status: "paid", total_price: 300000, payment_method: "qris", notes: "Syarat masuk universitas", created_at: "2026-08-16 10:30" },
  { id: 3, package_name: "MCU Platinum", full_name: "Hendra Wijaya", nik: "3674012011780003", phone_number: "081399887766", booking_date: "2026-08-22", booking_time: "08:30:00", status: "completed", payment_status: "paid", total_price: 2100000, payment_method: "cash", notes: "Pemeriksaan tahunan kantor", created_at: "2026-08-15 09:15" },
];

export async function getPackageBookings(params?: {
  status?: string;
  date?: string;
}): Promise<PackageBookingItem[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.date) qs.set("date", params.date);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return await api.get<PackageBookingItem[]>(`/admin/package-bookings${query}`);
  } catch {
    let result = [...MOCK_BOOKINGS];
    if (params?.status) {
      result = result.filter((b) => b.status === params.status);
    }
    return result;
  }
}

export async function confirmPackageBooking(id: number): Promise<PackageBookingItem> {
  try {
    return await api.patch<PackageBookingItem>(`/admin/package-bookings/${id}/confirm`);
  } catch {
    const item = MOCK_BOOKINGS.find((b) => b.id === id) ?? MOCK_BOOKINGS[0];
    return { ...item, status: "confirmed" };
  }
}

export async function cancelPackageBooking(id: number): Promise<PackageBookingItem> {
  try {
    return await api.patch<PackageBookingItem>(`/admin/package-bookings/${id}/cancel`);
  } catch {
    const item = MOCK_BOOKINGS.find((b) => b.id === id) ?? MOCK_BOOKINGS[0];
    return { ...item, status: "cancelled", payment_status: "cancelled" };
  }
}

export async function confirmPackagePayment(id: number): Promise<PackageBookingItem> {
  try {
    return await api.patch<PackageBookingItem>(`/admin/package-bookings/${id}/payment/confirm`);
  } catch {
    const item = MOCK_BOOKINGS.find((b) => b.id === id) ?? MOCK_BOOKINGS[0];
    return { ...item, payment_status: "paid" };
  }
}
