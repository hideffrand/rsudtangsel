import { api } from './api';

export interface RegistrationResult {
  queue_number: string;
  qr_code: string;
  message: string;
}

export interface RegistrationPayload {
  nik: string;
  name: string;
  birth_date?: string;
  address?: string;
  phone_number: string;
  doctor_id: number;
  schedule_date: string;
  time?: string;
  payment_type?: string;
}

export const registrationApi = {
  register: (payload: RegistrationPayload) =>
    api.post<RegistrationResult>('/daftar-online', payload),
};
