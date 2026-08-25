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

const MOCK_PACKAGES: MedicalPackage[] = [
  {
    id: 1,
    type: 'mcu',
    name: 'MCU Basic',
    description: 'Pemeriksaan kesehatan dasar untuk umum',
    price: 350000,
    is_active: true,
    items: [
      { id: 1, name: 'Pemeriksaan Fisik Dokter', description: 'Cek tanda vital dan fisik' },
      { id: 2, name: 'Darah Lengkap', description: 'Hematologi dasar' },
    ],
  },
  {
    id: 2,
    type: 'lab',
    name: 'Tes Kolesterol Lengkap',
    description: 'Pemeriksaan profil lipid darah lengkap',
    price: 180000,
    is_active: true,
    items: [
      { id: 3, name: 'Kolesterol Total', description: 'Cek kolesterol total' },
      { id: 4, name: 'HDL & LDL', description: 'Cek lemak baik dan jahat' },
    ],
  },
  {
    id: 3,
    type: 'radiologi',
    name: 'Rontgen Thorax',
    description: 'Foto rontgen dada dan paru-paru',
    price: 150000,
    is_active: true,
    items: [
      { id: 5, name: 'Rontgen Dada PA', description: 'Foto rontgen dada standar' },
    ],
  },
];

export const medicalPackagesApi = {
  getAll: async (type?: MedicalPackageType): Promise<MedicalPackage[]> => {
    try {
      return await api.get<MedicalPackage[]>(
        `/medical-packages${type ? `?type=${type}` : ''}`,
      );
    } catch {
      if (type) {
        return MOCK_PACKAGES.filter((p) => p.type === type);
      }
      return MOCK_PACKAGES;
    }
  },
  getOne: async (id: number): Promise<MedicalPackage> => {
    try {
      return await api.get<MedicalPackage>(`/medical-packages/${id}`);
    } catch {
      const pkg = MOCK_PACKAGES.find((p) => p.id === id);
      if (pkg) return pkg;
      throw new Error('Paket tidak ditemukan');
    }
  },
  create: (payload: MedicalPackagePayload) =>
    api.post<MedicalPackage>('/medical-packages', payload),
  update: (id: number, payload: MedicalPackagePayload) =>
    api.put<MedicalPackage>(`/medical-packages/${id}`, payload),
  remove: (id: number) => api.delete<void>(`/medical-packages/${id}`),
};
