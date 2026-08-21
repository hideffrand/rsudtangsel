import { useEffect, useRef, useState } from "react";
import { DOC_TYPE_OPTIONS, OcrResult } from "@/lib/types";
import { extractOcr } from "@/lib/ocr";

const ACCEPT = "image/jpeg,image/png,image/webp,image/bmp";

export function MainView() {
  const [docType, setDocType] = useState<string>(DOC_TYPE_OPTIONS[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onPick(f: File | null) {
    setError(null);
    setResult(null);
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function handleProcess() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await extractOcr(file, docType));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
      {/* Jenis dokumen */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Jenis dokumen</div>
        <div style={{ display: "flex", gap: 8 }}>
          {DOC_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDocType(opt.value)}
              style={{
                flex: 1,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                background: docType === opt.value ? "var(--accent)" : "transparent",
                color: docType === opt.value ? "white" : "var(--fg)",
                padding: "10px 8px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ambil / unggah */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => cameraRef.current?.click()}
          style={actionButtonStyle}
        >
          📷 Ambil Foto
        </button>
        <button
          onClick={() => uploadRef.current?.click()}
          style={actionButtonStyle}
        >
          Unggah Gambar
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      <input
        ref={uploadRef}
        type="file"
        accept={ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />

      {/* Pratinjau */}
      {previewUrl && (
        <div style={{ marginBottom: 16 }}>
          <img
            src={previewUrl}
            alt="Pratinjau dokumen"
            style={{ width: "100%", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
          />
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            {file?.name}
          </div>
        </div>
      )}

      {file && (
        <button
          onClick={handleProcess}
          disabled={busy}
          style={{
            width: "100%",
            border: "none",
            borderRadius: "var(--radius)",
            background: "var(--accent)",
            color: "white",
            padding: "10px 16px",
            fontWeight: 600,
            opacity: busy ? 0.5 : 1,
            marginBottom: 16,
          }}
        >
          {busy ? "Memproses…" : "Proses OCR"}
        </button>
      )}

      {error && (
        <div
          className="mono"
          style={{
            color: "var(--danger)",
            fontSize: 12,
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius)",
            padding: "8px",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Hasil ekstraksi</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              confidence {result.avg_confidence.toFixed(1)}% · {Math.round(result.process_time_ms)} ms
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
            <tbody>
              {result.extracted_fields.map((f) => (
                <tr key={f.key} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "6px 8px 6px 0", color: "var(--muted)", fontSize: 12, verticalAlign: "top" }}>
                    {f.key}
                  </td>
                  <td style={{ padding: "6px 0", fontSize: 13, wordBreak: "break-word" }}>
                    {f.value || <span style={{ color: "var(--muted)" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: 12 }}>
              Teks mentah
            </summary>
            <pre
              className="mono"
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 11,
                background: "#f4f4f5",
                borderRadius: "var(--radius)",
                padding: 8,
              }}
            >
              {result.raw_text || "—"}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

const actionButtonStyle: React.CSSProperties = {
  flex: 1,
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  background: "#f4f4f5",
  color: "var(--fg)",
  padding: "10px 8px",
  fontSize: 13,
  fontWeight: 600,
};
