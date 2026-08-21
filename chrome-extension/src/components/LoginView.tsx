import { useState } from "react";
import { login } from "@/lib/auth";

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "8px",
  marginTop: 4,
};

export function LoginView() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "8px 0 4px" }}>Webform Copilot</h1>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 24 }}>
        Masuk untuk mengunggah dokumen dan mengisi form web secara otomatis.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={busy || !username.trim() || !password}
          style={{
            border: "none",
            borderRadius: "var(--radius)",
            background: "var(--accent)",
            color: "white",
            padding: "10px 16px",
            fontWeight: 600,
            opacity: busy || !username.trim() || !password ? 0.5 : 1,
          }}
        >
          {busy ? "Memproses…" : "Masuk"}
        </button>
      </form>

      {error && (
        <div
          className="mono"
          style={{
            marginTop: 16,
            color: "var(--danger)",
            fontSize: 12,
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius)",
            padding: "8px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
