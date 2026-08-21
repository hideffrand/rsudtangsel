// MainView.tsx
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
    <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
      {/* Jenis dokumen */}
      <div className="eyebrow" style={{ marginBottom: 8 }}>Jenis dokumen</div>
      <div style={{ display: "flex", marginBottom: 20 }}>
        {DOC_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className="tab"
            data-active={docType === opt.value}
            onClick={() => setDocType(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Ambil / unggah */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button className="tile" onClick={() => cameraRef.current?.click()}>
          <span className="tile-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </span>
          Ambil Foto
        </button>
        <button className="tile" onClick={() => uploadRef.current?.click()}>
          <span className="tile-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </span>
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
        <div style={{ marginBottom: 18 }}>
          <div style={{ border: "1.5px dashed var(--border)", borderRadius: "var(--radius-sm)", padding: 6 }}>
            <img
              src={previewUrl}
              alt="Pratinjau dokumen"
              style={{ width: "100%", display: "block", borderRadius: "var(--radius-sm)" }}
            />
          </div>
          <div className="mono" style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 6 }}>
            {file?.name}
          </div>
        </div>
      )}

      {file && (
        <button
          onClick={handleProcess}
          disabled={busy}
          className="btn-primary"
          style={{ width: "100%", marginBottom: 18 }}
        >
          {busy ? "Memproses…" : "Proses OCR"}
        </button>
      )}

      {error && (
        <div className="alert" role="alert" style={{ marginBottom: 18 }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div className="eyebrow">Hasil ekstraksi</div>
            <div style={{ display: "flex", gap: 6 }}>
              <span className="chip">{result.avg_confidence.toFixed(1)}%</span>
              <span className="chip" style={{ background: "transparent", color: "var(--muted-foreground)" }}>
                {Math.round(result.process_time_ms)} ms
              </span>
            </div>
          </div>

          <div className="tear" style={{ margin: "8px 0" }} />

          <div>
            {result.extracted_fields.map((f) => (
              <div key={f.key} className="field-row">
                <span className="f-label">{f.key}</span>
                <span className="f-leader" />
                <span className="f-value">
                  {f.value || <span style={{ color: "var(--muted-foreground)" }}>—</span>}
                </span>
              </div>
            ))}
          </div>

          <details style={{ marginTop: 14 }}>
            <summary className="eyebrow" style={{ cursor: "pointer" }}>
              Teks mentah
            </summary>
            <pre
              className="mono"
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 12,
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: 10,
                marginTop: 8,
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