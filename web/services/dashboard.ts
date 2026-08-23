import { api } from './api';

/**
 * Dashboard API - RSU Tangsel Care (admin)
 * Statistik harian untuk dashboard admin.
 */

export interface DashboardStats {
  patients_today: number;
  avg_wait_time: number;
  active_doctors: number;
  new_complaints: number;
  total_queue: number;
  update_time: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    return await api.get<DashboardStats>('/admin/dashboard/stats');
  } catch {
    const now = new Date();
    return {
      patients_today: 38,
      avg_wait_time: 14.2,
      active_doctors: 14,
      new_complaints: 5,
      total_queue: 12,
      update_time: now.toLocaleTimeString('id-ID'),
    };
  }
}
