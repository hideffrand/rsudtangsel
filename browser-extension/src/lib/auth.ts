import { getSettings } from "./settings";
import { onStorageChanged, storageSession } from "./webext";
import { ApiEnvelope, AuthSession, LoginResponse } from "./types";

const SESSION_KEY = "copilot_session";

// POST /api/admin/login — validates credentials, persists the token pair in
// storage.session (cleared when the browser closes).
export async function login(username: string, password: string): Promise<AuthSession> {
  const { baseUrl } = await getSettings();
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<LoginResponse> | null;
  if (!res.ok || !body?.data) {
    throw new Error(body?.message || `Login gagal (${res.status})`);
  }

  const d = body.data;
  const session: AuthSession = {
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    tokenType: d.token_type,
    expiresAt: Date.now() + d.expires_in * 1000,
    user: d.user,
  };
  await storageSession().set({ [SESSION_KEY]: session });
  return session;
}

export async function getSession(): Promise<AuthSession | null> {
  const stored = await storageSession().get(SESSION_KEY);
  return (stored[SESSION_KEY] as AuthSession | undefined) ?? null;
}

// POST /api/admin/refresh — rotates the token pair on expiry.
async function refresh(session: AuthSession): Promise<AuthSession> {
  const { baseUrl } = await getSettings();
  const res = await fetch(`${baseUrl}/api/admin/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<LoginResponse> | null;
  if (!res.ok || !body?.data) {
    throw new Error(body?.message || "Sesi berakhir, silakan login ulang");
  }

  const d = body.data;
  const next: AuthSession = {
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    tokenType: d.token_type,
    expiresAt: Date.now() + d.expires_in * 1000,
    user: d.user,
  };
  await storageSession().set({ [SESSION_KEY]: next });
  return next;
}

// Returns a valid access token, transparently refreshing when near expiry.
export async function getValidToken(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("Belum login");

  if (session.expiresAt <= Date.now() + 30_000) {
    return (await refresh(session)).accessToken;
  }
  return session.accessToken;
}

// POST /api/admin/logout then clear local session state. Idempotent.
export async function logout(): Promise<void> {
  const session = await getSession();
  if (session) {
    try {
      const { baseUrl } = await getSettings();
      await fetch(`${baseUrl}/api/admin/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });
    } catch {
      // best-effort; local session is cleared regardless
    }
  }
  await storageSession().remove(SESSION_KEY);
}

export function onSessionChanged(cb: (session: AuthSession | null) => void): void {
  onStorageChanged((changes, area) => {
    if (area === "session" && changes[SESSION_KEY]) {
      cb((changes[SESSION_KEY].newValue as AuthSession | undefined) ?? null);
    }
  });
}
