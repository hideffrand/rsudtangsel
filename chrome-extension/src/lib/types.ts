// Settings for the extension, stored in chrome.storage.local.
export interface Settings {
  // Go API origin, without a trailing slash. e.g. http://localhost:8080
  baseUrl: string;
}

export const DEFAULT_SETTINGS: Settings = {
  baseUrl: "http://localhost:8080",
};

// Authenticated session, stored in chrome.storage.session (ephemeral).
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: number; // epoch ms
  user: AuthUser;
}

// Envelope for every Go API response (internal/utils SuccessResponse/ErrorResponse).
export interface ApiEnvelope<T> {
  success: boolean;
  status_code: number;
  data: T | null;
  message: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number; // seconds
  user: AuthUser;
}

// Mirrors service.OcrExtractedField from the Go server.
export interface OcrExtractedField {
  key: string;
  value: string;
  confidence: number;
  is_required: boolean;
}

export interface OcrResult {
  success: boolean;
  doc_type: string;
  process_time_ms: number;
  avg_confidence: number;
  raw_text: string;
  extracted_fields: OcrExtractedField[];
  blocks: unknown[];
  message: string;
}

// Mock selector for the main view. doc_type values are slugs; the OCR
// service falls back to its generic parser for unknown types.
export const DOC_TYPE_OPTIONS = [
  { label: "Registrasi Pasien", value: "registrasi-pasien" },
  { label: "Inventory", value: "inventory" },
] as const;
