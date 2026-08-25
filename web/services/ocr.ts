import { api } from './api';

/**
 * OCR API - RSU Tangsel Care
 * Satu modul untuk master data jenis dokumen OCR (admin-only) dan ekstraksi
 * dokumen via microservice CnOCR (proxy dari backend Go).
 */

// ─── Jenis Dokumen OCR (master data) ──────────────────────────────────────────

export interface OCRDocumentType {
  id: string;
  name: string;
  fields: string;
}

const MOCK_DOC_TYPES: OCRDocumentType[] = [
  {
    id: "inventory",
    name: "Inventory",
    fields: "Nama Barang, Kode, Jumlah, Kondisi",
  },
  {
    id: "registrasi-pasien",
    name: "Registrasi Pasien",
    fields: "NIK, Nama, Umur, Jenis Kelamin, Alamat, No. Telepon",
  },
];

export const ocrDocumentTypesApi = {
  getAll: async (): Promise<OCRDocumentType[]> => {
    try {
      return await api.get<OCRDocumentType[]>('/admin/ocr-document-types');
    } catch {
      return MOCK_DOC_TYPES;
    }
  },
  getOne: async (id: string): Promise<OCRDocumentType> => {
    try {
      return await api.get<OCRDocumentType>(`/admin/ocr-document-types/${id}`);
    } catch {
      const found = MOCK_DOC_TYPES.find((d) => d.id === id);
      if (found) return found;
      throw new Error("Jenis dokumen tidak ditemukan");
    }
  },
  create: (data: { id: string; name: string; fields: string }) =>
    api.post<OCRDocumentType>('/admin/ocr-document-types', data),
  update: (id: string, data: { name: string; fields: string }) =>
    api.put<OCRDocumentType>(`/admin/ocr-document-types/${id}`, data),
  remove: (id: string) => api.delete<void>(`/admin/ocr-document-types/${id}`),
};

// Named helpers — dipakai halaman admin jenis-dokumen-ocr.
export const getOCRDocumentTypes = ocrDocumentTypesApi.getAll;
export const getOCRDocumentType = ocrDocumentTypesApi.getOne;
export const createOCRDocumentType = ocrDocumentTypesApi.create;
export const updateOCRDocumentType = ocrDocumentTypesApi.update;
export const deleteOCRDocumentType = ocrDocumentTypesApi.remove;

// ─── Ekstraksi Dokumen ────────────────────────────────────────────────────────
// Ekstraksi OCR hanya melalui browser-extension (POST /api/admin/ocr/extract);
// halaman admin web tidak lagi memanggil endpoint ini.

export interface OcrExtractedField {
  key: string;
  value: string;
  confidence: number;
  is_required?: boolean;
}
