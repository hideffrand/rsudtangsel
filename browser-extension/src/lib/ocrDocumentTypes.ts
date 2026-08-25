import { getValidToken } from "./auth";
import { getSettings } from "./settings";
import { ApiEnvelope, OCRDocumentType } from "./types";

const FALLBACK_DOC_TYPES: OCRDocumentType[] = [
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

// GET /api/admin/ocr-document-types — memuat master data jenis dokumen OCR dari backend.
// Opsi selector di MainView kini dikelola end-to-end oleh backend.
export async function getOCRDocumentTypes(): Promise<OCRDocumentType[]> {
  try {
    const token = await getValidToken();
    const { baseUrl } = await getSettings();

    const res = await fetch(`${baseUrl}/api/admin/ocr-document-types`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const body = (await res.json().catch(() => null)) as ApiEnvelope<OCRDocumentType[]> | null;
    if (res.ok && body?.data && body.data.length > 0) {
      return body.data;
    }
  } catch {
    // backend offline fallback
  }

  return FALLBACK_DOC_TYPES;
}
