import { api } from './api';

export interface Poli {
  id: number;
  name: string;
  description: string;
}

export const poliApi = {
  getAll: () => api.get<Poli[]>('/poli'),
  getOne: (id: number) => api.get<Poli>(`/poli/${id}`),
};
