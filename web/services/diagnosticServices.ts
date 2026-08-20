import { api } from './api';

export interface DiagnosticServiceItem {
  id: number;
  name: string;
  description: string;
}

export interface DiagnosticService {
  id: number;
  category: 'lab' | 'radiologi';
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  items: DiagnosticServiceItem[];
}

export interface DiagnosticServiceItemPayload {
  name: string;
  description?: string;
}

export interface DiagnosticServicePayload {
  category: 'lab' | 'radiologi';
  name: string;
  description?: string;
  price: number;
  is_active?: boolean;
  items?: DiagnosticServiceItemPayload[];
}

export const diagnosticServicesApi = {
  getAll: (category?: 'lab' | 'radiologi') =>
    api.get<DiagnosticService[]>(
      `/diagnostic-services${category ? `?category=${category}` : ''}`,
    ),
  getOne: (id: number) => api.get<DiagnosticService>(`/diagnostic-services/${id}`),
  create: (payload: DiagnosticServicePayload) =>
    api.post<DiagnosticService>('/diagnostic-services', payload),
  update: (id: number, payload: DiagnosticServicePayload) =>
    api.put<DiagnosticService>(`/diagnostic-services/${id}`, payload),
  remove: (id: number) => api.delete<void>(`/diagnostic-services/${id}`),
};
