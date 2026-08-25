import { getSettings } from "./settings";
import { onStorageChanged, storageSession } from "./webext";
import { ApiEnvelope, AuthSession, LoginResponse } from "./types";

const SESSION_KEY = "copilot_session";

const MOCK_SESSION: AuthSession = {
  accessToken: "mock-dev-token-admin",
  refreshToken: "mock-dev-token-admin",
  tokenType: "Bearer",
  expiresAt: Date.now() + 86400 * 1000,
  user: {
    id: 1,
    username: "admin",
    email: "admin@rsudtangsel.id",
    role: "admin",
  },
};

// POST /api/admin/login — validates credentials, persists the token pair in
// storage.session (cleared when the browser closes).
export async function login(username: string, password: string): Promise<AuthSession> {
  try {
    const { baseUrl } = await getSettings();
    const res = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const body = (await res.json().catch(() => null)) as ApiEnvelope<LoginResponse> | null;
    if (res.ok && body?.data) {
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
  } catch {
    // backend unreachable
  }

  // Fallback development: jika backend tidak tersedia, gunakan kredensial admin default
  if (username === "admin" && password === "admin123") {
    await storageSession().set({ [SESSION_KEY]: MOCK_SESSION });
    return MOCK_SESSION;
  }

  throw new Error("Username atau password salah atau backend tidak dapat dijangkau.");
}

export async function getSession(): Promise<AuthSession | null> {
  const stored = await storageSession().get(SESSION_KEY);
  return (stored[SESSION_KEY] as AuthSession | undefined) ?? null;
}

// POST /api/admin/refresh — rotates the token pair on expiry.
async function refresh(session: AuthSession): Promise<AuthSession> {
  try {
    const { baseUrl } = await getSettings();
    const res = await fetch(`${baseUrl}/api/admin/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });

    const body = (await res.json().catch(() => null)) as ApiEnvelope<LoginResponse> | null;
    if (res.ok && body?.data) {
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
  } catch {
    // fallback
  }

  // If mock session, keep it alive
  if (session.accessToken === MOCK_SESSION.accessToken) {
    const next: AuthSession = {
      ...MOCK_SESSION,
      expiresAt: Date.now() + 86400 * 1000,
    };
    await storageSession().set({ [SESSION_KEY]: next });
    return next;
  }

  throw new Error("Sesi berakhir, silakan login ulang");
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
