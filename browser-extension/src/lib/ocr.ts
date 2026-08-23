import { getValidToken } from "./auth";
import { getSettings } from "./settings";
import { ApiEnvelope, OcrResult } from "./types";

// POST /api/admin/ocr/extract — uploads the document image to the Go server
// (which proxies to the Python OCR microservice) with a Bearer token.
export async function extractOcr(file: File, docType: string): Promise<OcrResult> {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("doc_type", docType);

  try {
    const token = await getValidToken();
    const { baseUrl } = await getSettings();

    const res = await fetch(`${baseUrl}/api/admin/ocr/extract`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const body = (await res.json().catch(() => null)) as ApiEnvelope<OcrResult> | null;
    if (res.ok && body?.data) {
      return body.data;
    }
  } catch {
    // Go backend tidak aktif — coba direct call ke Python OCR microservice di port 8000
  }

  // Direct call fallback ke OCR Microservice Python (FastAPI di port 8000)
  const directForm = new FormData();
  directForm.append("file", file, file.name);
  directForm.append("doc_type", docType);

  const directRes = await fetch("http://localhost:8000/ocr/extract", {
    method: "POST",
    body: directForm,
  });

  if (!directRes.ok) {
    throw new Error(`Gagal memproses OCR (${directRes.status})`);
  }

  const directData = await directRes.json();
  return {
    success: directData.success,
    doc_type: directData.doc_type,
    process_time_ms: directData.process_time_ms,
    avg_confidence: directData.avg_confidence,
    raw_text: directData.raw_text,
    extracted_fields: directData.extracted_fields || [],
    blocks: directData.blocks || [],
    message: directData.message || "Ekstraksi OCR berhasil diproses.",
  };
}
