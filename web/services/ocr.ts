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

export const ocrDocumentTypesApi = {
  getAll: () => api.get<OCRDocumentType[]>('/admin/ocr-document-types'),
  getOne: (id: string) => api.get<OCRDocumentType>(`/admin/ocr-document-types/${id}`),
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
