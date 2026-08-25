// MainView.tsx
import { useEffect, useRef, useState } from "react";
import { OCRDocumentType, OcrResult } from "@/lib/types";
import { extractOcr } from "@/lib/ocr";
import { getOCRDocumentTypes } from "@/lib/ocrDocumentTypes";
import { autofillActiveTab, AutofillOutcome } from "@/lib/autofill";

const ACCEPT = "image/jpeg,image/png,image/webp,image/bmp";

export function MainView() {
  const [docTypes, setDocTypes] = useState<OCRDocumentType[]>([]);
  const [docTypesLoading, setDocTypesLoading] = useState(true);
  const [docTypesError, setDocTypesError] = useState<string | null>(null);
  const [docType, setDocType] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autofillStatus, setAutofillStatus] = useState<string | null>(null);
  const [autofillDetails, setAutofillDetails] = useState<AutofillOutcome[] | null>(null);

  // Kamera in-panel (getUserMedia) untuk desktop.
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Jenis dokumen dikelola backend — muat saat panel terbuka.
  useEffect(() => {
    let cancelled = false;
    setDocTypesLoading(true);
    setDocTypesError(null);
    getOCRDocumentTypes()
      .then((list) => {
        if (cancelled) return;
        setDocTypes(list);
        setDocType((prev) => prev || list[0]?.id || "");
      })
      .catch((err) => {
        if (cancelled) return;
        setDocTypesError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setDocTypesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (cameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen, stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  function onPick(f: File | null) {
    setError(null);
    setResult(null);
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  // Perangkat sentuh (HP/tablet) membuka kamera native via capture input;
  // desktop memakai getUserMedia dengan pratinjau langsung di panel.
  async function openCamera() {
    setCameraError(null);
    const prefersNativeCapture =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (
      prefersNativeCapture ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof window === "undefined" ||
      !window.isSecureContext
    ) {
      cameraRef.current?.click();
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(s);
      setCameraOpen(true);
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : String(err));
      cameraRef.current?.click();
    }
  }

  function closeCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOpen(false);
    setCameraError(null);
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" });
      onPick(f);
      closeCamera();
    }, "image/jpeg", 0.92);
  }

  async function handleProcess() {
    if (!file || !docType) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setAutofillStatus(null);
    setAutofillDetails(null);
    try {
      const res = await extractOcr(file, docType);
      setResult(res);
      // Isi form di tab aktif (mis. /admin/pasien) dari hasil ekstraksi.
      // Kegagalan autofill tidak menggagalkan hasil OCR — cukup dilaporkan.
      try {
        const outcomes = await autofillActiveTab(
          res.extracted_fields.map(({ key, value }) => ({ key, value })),
        );
        setAutofillDetails(outcomes);
        const filled = outcomes.filter((o) => o.filled).length;
        setAutofillStatus(
          filled > 0
            ? `${filled} kolom form terisi otomatis`
            : "Tidak ada kolom data-copilot yang cocok di halaman aktif",
        );
      } catch (fillErr) {
        setAutofillStatus(
          fillErr instanceof Error ? `Autofill gagal: ${fillErr.message}` : "Autofill gagal",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
      {/* Jenis dokumen — dimuat dari backend */}
      <div className="eyebrow" style={{ marginBottom: 8 }}>Jenis dokumen</div>
      {docTypesLoading ? (
        <div className="mono" style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 20 }}>
          Memuat jenis dokumen OCR…
        </div>
      ) : docTypesError ? (
        <div className="alert" role="alert" style={{ marginBottom: 20 }}>
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
          <span>{docTypesError}</span>
        </div>
      ) : docTypes.length === 0 ? (
        <div className="mono" style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 20 }}>
          Belum ada jenis dokumen OCR terdaftar.
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 20 }}>
          {docTypes.map((opt) => (
            <button
              key={opt.id}
              className="tab"
              data-active={docType === opt.id}
              onClick={() => setDocType(opt.id)}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}

      {/* Ambil / unggah */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button className="tile" onClick={openCamera}>
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

      {cameraError && (
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
          <span>{cameraError}</span>
        </div>
      )}

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
          disabled={busy || !docType}
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

          {autofillStatus && (
            <div className="mono" role="status" style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "6px 0" }}>
              {autofillStatus}
            </div>
          )}

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
              Debug: pasangan key → form (autofill)
            </summary>
            {autofillDetails ? (
              <table
                className="mono"
                style={{ width: "100%", fontSize: 11, marginTop: 8, borderCollapse: "collapse" }}
              >
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--muted-foreground)" }}>
                    <th style={{ padding: "4px 6px" }}>key</th>
                    <th style={{ padding: "4px 6px" }}>value</th>
                    <th style={{ padding: "4px 6px" }}>data-copilot / label</th>
                    <th style={{ padding: "4px 6px" }}>status</th>
                  </tr>
                </thead>
                <tbody>
                  {autofillDetails.map((o) => (
                    <tr key={o.target} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "4px 6px", wordBreak: "break-word" }}>{o.key}</td>
                      <td style={{ padding: "4px 6px", wordBreak: "break-word" }}>{o.value}</td>
                      <td style={{ padding: "4px 6px" }}>{o.target}</td>
                      <td
                        style={{
                          padding: "4px 6px",
                          color: o.filled ? "#15803d" : o.match ? "#b45309" : "#b91c1c",
                        }}
                      >
                        {o.filled
                          ? `terisi (${o.match})`
                          : o.match
                            ? "ditemukan, tidak terisi"
                            : "tidak ada di halaman"}
                      </td>
                    </tr>
                  ))}
                  {autofillDetails.length === 0 && (
                    <tr style={{ borderTop: "1px solid var(--border)" }}>
                      <td colSpan={4} style={{ padding: "4px 6px", color: "var(--muted-foreground)" }}>
                        Tidak ada field bernilai dari hasil OCR.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="mono" style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 8 }}>
                Autofill belum dicoba pada hasil ini.
              </div>
            )}
          </details>

          <details style={{ marginTop: 10 }}>
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

      {/* Kamera in-panel (desktop) */}
      {cameraOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 20,
            background: "#000",
            display: "flex",
            flexDirection: "column",
          }}
          role="dialog"
          aria-label="Kamera"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ flex: 1, width: "100%", minHeight: 0, objectFit: "cover" }}
          />
          <div style={{ display: "flex", gap: 8, padding: 12, background: "#111" }}>
            <button
              className="btn-outline"
              onClick={closeCamera}
              style={{ flex: 1, background: "#222", borderColor: "#333", color: "#eee" }}
            >
              Batal
            </button>
            <button className="btn-primary" onClick={captureFrame} style={{ flex: 1 }}>
              Tangkap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
