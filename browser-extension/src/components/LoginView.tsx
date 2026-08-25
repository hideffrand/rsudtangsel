// LoginView.tsx
import { useState } from "react";
import { login } from "@/lib/auth";

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
    <div style={{ padding: "28px 20px", flex: 1, overflowY: "auto" }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Masuk</div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 6px" }}>
        Isi kredensial Anda
      </h1>
      <p style={{ color: "var(--muted-foreground)", marginTop: 0, marginBottom: 28, fontSize: 14 }}>
        Untuk mengunggah dokumen dan mengisi form web secara otomatis.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <label className="eyebrow">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            className="field-underline"
            style={{ display: "block", marginTop: 6 }}
          />
        </label>

        <label className="eyebrow">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="field-underline"
            style={{ display: "block", marginTop: 6 }}
          />
        </label>

        <button
          type="submit"
          disabled={busy || !username.trim() || !password}
          className="btn-primary"
          style={{ marginTop: 8 }}
        >
          {busy ? "Memproses…" : "Masuk"}
        </button>
      </form>

      {error && (
        <div className="alert" role="alert">
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
    </div>
  );
}