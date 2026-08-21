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
          padding: "10px 12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <div style={{ fontWeight: 600 }}>Webform Copilot</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            {session ? `@${session.user.username}` : "belum masuk"}
          </div>
        </div>
        <button
          aria-label={view === "app" ? "Pengaturan" : "Kembali"}
          onClick={() => setView(view === "app" ? "settings" : "app")}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            background: "transparent",
            padding: "4px 8px",
          }}
        >
          {view === "app" ? "⚙" : "←"}
        </button>
      </header>

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
