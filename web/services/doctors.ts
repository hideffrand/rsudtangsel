import { api } from './api';
import type { DoctorSchedule } from './schedules';

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  license_number: string | null;
  email: string;
  phone_number: string;
  bio: string;
  status: string;
}

export interface DoctorPayload {
  name: string;
  specialty: string;
  license_number?: string | null;
  email?: string;
  phone_number?: string;
  bio?: string;
  status?: string;
}

export const doctorsApi = {
  getAll: () => api.get<Doctor[]>('/doctors'),
  getOne: (id: number) => api.get<Doctor>(`/doctors/${id}`),
  create: (payload: DoctorPayload) => api.post<Doctor>('/doctors', payload),
  update: (id: number, payload: DoctorPayload) =>
    api.put<Doctor>(`/doctors/${id}`, payload),
  remove: (id: number) => api.delete<void>(`/doctors/${id}`),
  getSchedules: (id: number) => api.get<DoctorSchedule[]>(`/doctors/${id}/schedules`),
};
