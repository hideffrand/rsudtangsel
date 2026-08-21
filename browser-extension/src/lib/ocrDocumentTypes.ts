import { getValidToken } from "./auth";
import { getSettings } from "./settings";
import { ApiEnvelope, OCRDocumentType } from "./types";

// GET /api/admin/ocr-document-types — memuat master data jenis dokumen OCR dari backend.
// Opsi selector di MainView kini dikelola end-to-end oleh backend.
export async function getOCRDocumentTypes(): Promise<OCRDocumentType[]> {
  const token = await getValidToken();
  const { baseUrl } = await getSettings();

  const res = await fetch(`${baseUrl}/api/admin/ocr-document-types`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<OCRDocumentType[]> | null;
  if (!res.ok || !body?.data) {
    throw new Error(body?.message || `Gagal memuat jenis dokumen OCR (${res.status})`);
  }
  return body.data;
}
