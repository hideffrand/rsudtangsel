// SidePanel.tsx
import { useEffect, useState } from "react";
import { AuthSession } from "@/lib/types";
import { getSession, onSessionChanged } from "@/lib/auth";
import { LoginView } from "@/components/LoginView";
import { MainView } from "@/components/MainView";
import { SettingsView } from "@/components/SettingsView";

export default function SidePanel() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"app" | "settings">("app");

  useEffect(() => {
    getSession().then((s) => {
      setSession(s);
      setLoaded(true);
    });
    onSessionChanged(setSession);
  }, []);

  if (!loaded) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "var(--primary)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Webform Copilot</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                className="dot"
                style={{ background: session ? "var(--success)" : "var(--muted-foreground)" }}
              />
              <span className="mono" style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                {session ? `@${session.user.username}` : "belum masuk"}
              </span>
            </div>
          </div>
        </div>
        <button
          aria-label={view === "app" ? "Pengaturan" : "Kembali"}
          onClick={() => setView(view === "app" ? "settings" : "app")}
          className="btn-outline"
          style={{ padding: "0 10px", fontSize: 14 }}
        >
          {view === "app" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          )}
        </button>
      </header>

      <div className="tear" />

      {view === "settings" ? (
        <SettingsView />
      ) : session ? (
        <MainView />
      ) : (
        <LoginView />
      )}
    </div>
  );
}