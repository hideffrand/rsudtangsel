import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, Settings } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/settings";
import { logout } from "@/lib/auth";

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "8px",
  marginTop: 4,
};

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
    <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>URL server</div>
      <input
        value={settings.baseUrl}
        onChange={(e) => setSettings((s) => ({ ...s, baseUrl: e.target.value }))}
        style={inputStyle}
      />
      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
        Origin API Go tanpa trailing slash, mis. http://localhost:8080
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <button
          onClick={handleSave}
          style={{
            border: "none",
            borderRadius: "var(--radius)",
            background: "var(--accent)",
            color: "white",
            padding: "8px 16px",
          }}
        >
          Simpan
        </button>
        {status && (
          <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
            {status}
          </span>
        )}
      </div>

      <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid var(--border)" }} />

      <button
        onClick={handleLogout}
        style={{
          width: "100%",
          border: "1px solid var(--danger)",
          borderRadius: "var(--radius)",
          background: "transparent",
          color: "var(--danger)",
          padding: "10px 16px",
          fontWeight: 600,
        }}
      >
        Keluar
      </button>

      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: 13 }}>
          Troubleshooting
        </summary>
        <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.5 }}>
          Pastikan server Go berjalan (<code className="mono">go run ./cmd/api</code>) dan
          microservice OCR aktif (<code className="mono">uvicorn main:app --port 8000</code>).
          Jika permintaan gagal dengan error jaringan/origin, tambahkan origin
          <code className="mono"> chrome-extension://&lt;id-extension&gt;</code> ke{" "}
          <code className="mono">ALLOWED_ORIGINS</code> di server.
        </p>
      </details>
    </div>
  );
}
