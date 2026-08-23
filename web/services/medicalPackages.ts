import { api } from './api';

/**
 * Medical Packages API - RSU Tangsel Care
 * Katalog layanan terpadu (satu tabel medical_packages): paket MCU,
 * tes laboratorium (lab), dan radiologi. Dipakai sisi publik maupun admin.
 */

export type MedicalPackageType = 'mcu' | 'lab' | 'radiologi';

export interface MedicalPackageItem {
  id: number;
  name: string;
  description: string;
}

export interface MedicalPackage {
  id: number;
  type: MedicalPackageType;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  items: MedicalPackageItem[];
}

export interface MedicalPackageItemPayload {
  name: string;
  description?: string;
}

export interface MedicalPackagePayload {
  type: MedicalPackageType;
  name: string;
  description?: string;
  price: number;
  is_active?: boolean;
  items?: MedicalPackageItemPayload[];
}

export const medicalPackagesApi = {
  getAll: (type?: MedicalPackageType) =>
    api.get<MedicalPackage[]>(
      `/medical-packages${type ? `?type=${type}` : ''}`,
    ),
  getOne: (id: number) => api.get<MedicalPackage>(`/medical-packages/${id}`),
  create: (payload: MedicalPackagePayload) =>
    api.post<MedicalPackage>('/medical-packages', payload),
  update: (id: number, payload: MedicalPackagePayload) =>
    api.put<MedicalPackage>(`/medical-packages/${id}`, payload),
  remove: (id: number) => api.delete<void>(`/medical-packages/${id}`),
};
