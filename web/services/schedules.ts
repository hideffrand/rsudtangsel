import { api } from './api';

export interface DoctorSchedule {
  id: number;
  doctor_id: number;
  doctor_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string | null;
  quota: number;
}

export interface SchedulePayload {
  doctor_id: number;
  day_of_week: string;
  start_time: string;
  end_time?: string | null;
  quota?: number;
}

export const schedulesApi = {
  getAll: (doctorId?: number) =>
    api.get<DoctorSchedule[]>(`/schedules${doctorId ? `?doctor_id=${doctorId}` : ''}`),
  getOne: (id: number) => api.get<DoctorSchedule>(`/schedules/${id}`),
  create: (payload: SchedulePayload) => api.post<DoctorSchedule>('/schedules', payload),
  update: (id: number, payload: SchedulePayload) =>
    api.put<DoctorSchedule>(`/schedules/${id}`, payload),
  remove: (id: number) => api.delete<void>(`/schedules/${id}`),
};
