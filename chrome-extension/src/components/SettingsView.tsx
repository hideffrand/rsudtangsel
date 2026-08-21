// SettingsView.tsx
import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, Settings } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/settings";
import { logout } from "@/lib/auth";

export function SettingsView() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  async function handleSave() {
    setStatus(null);
    let baseUrl: string;
    try {
      const u = new URL(settings.baseUrl);
      baseUrl = u.origin;
    } catch {
      setStatus("URL tidak valid.");
      return;
    }
    try {
      await saveSettings({ baseUrl });
      setStatus("Tersimpan.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleLogout() {
    await logout();
  }

  if (!loaded) return null;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>URL server</div>
      <input
        value={settings.baseUrl}
        onChange={(e) => setSettings((s) => ({ ...s, baseUrl: e.target.value }))}
        className="field-underline"
      />
      <div className="mono" style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 6 }}>
        Origin API Go tanpa trailing slash, mis. http://localhost:8080
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <button onClick={handleSave} className="btn-primary" style={{ padding: "0 16px" }}>
          Simpan
        </button>
        {status && (
          <span className="mono" style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            {status}
          </span>
        )}
      </div>

      <div className="tear" style={{ margin: "24px 0" }} />

      <button
        onClick={handleLogout}
        className="btn-outline"
        style={{ width: "100%", borderColor: "var(--destructive)", color: "var(--destructive)" }}
      >
        Keluar
      </button>

      <details style={{ marginTop: 22 }}>
        <summary className="eyebrow" style={{ cursor: "pointer" }}>
          Troubleshooting
        </summary>
        <p style={{ color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>
          Pastikan server Go berjalan (<code className="mono">go run ./cmd/api</code>) dan
          microservice OCR aktif (<code className="mono">uvicorn main:app --port 8000</code>).
          Jika permintaan gagal dengan error jaringan/origin, tambahkan origin{" "}
          <code className="mono">chrome-extension://&lt;id-extension&gt;</code> ke{" "}
          <code className="mono">ALLOWED_ORIGINS</code> di server.
        </p>
      </details>
    </div>
  );
}