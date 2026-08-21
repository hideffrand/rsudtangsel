import { getValidToken } from "./auth";
import { getSettings } from "./settings";
import { ApiEnvelope, OcrResult } from "./types";

// POST /api/admin/ocr/extract — uploads the document image to the Go server
// (which proxies to the Python OCR microservice) with a Bearer token.
export async function extractOcr(file: File, docType: string): Promise<OcrResult> {
  const token = await getValidToken();
  const { baseUrl } = await getSettings();

  const form = new FormData();
  form.append("file", file, file.name);
  form.append("doc_type", docType);

  const res = await fetch(`${baseUrl}/api/admin/ocr/extract`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<OcrResult> | null;
  if (!res.ok || !body?.data) {
    throw new Error(body?.message || `Gagal memproses OCR (${res.status})`);
  }
  return body.data;
}
