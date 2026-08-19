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

export const diagnosticServicesApi = {
  getAll: (category?: 'lab' | 'radiologi') =>
    api.get<DiagnosticService[]>(
      `/diagnostic-services${category ? `?category=${category}` : ''}`,
    ),
  getOne: (id: number) => api.get<DiagnosticService>(`/diagnostic-services/${id}`),
};
