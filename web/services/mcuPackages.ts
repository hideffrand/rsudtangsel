import { api } from './api';

export interface McuPackageItem {
  id: number;
  name: string;
  description: string;
}

export interface McuPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  items: McuPackageItem[];
}

export interface McuPackageItemPayload {
  name: string;
  description?: string;
}

export interface McuPackagePayload {
  name: string;
  description?: string;
  price: number;
  is_active?: boolean;
  items?: McuPackageItemPayload[];
}

export const mcuPackagesApi = {
  getAll: () => api.get<McuPackage[]>('/mcu-packages'),
  getOne: (id: number) => api.get<McuPackage>(`/mcu-packages/${id}`),
  create: (payload: McuPackagePayload) =>
    api.post<McuPackage>('/mcu-packages', payload),
  update: (id: number, payload: McuPackagePayload) =>
    api.put<McuPackage>(`/mcu-packages/${id}`, payload),
  remove: (id: number) => api.delete<void>(`/mcu-packages/${id}`),
};
