"use client";

/**
 * AdminAuthContext — RSU Tangsel Care
 * State sesi admin + operasi auth (login/logout) terpusat.
 *
 * Sepenuhnya berbasis cookie httpOnly dari backend — tidak ada token/profil
 * di localStorage atau sessionStorage. Saat provider ter-mount, profil
 * diambil dari GET /api/admin/me (fetchMe) untuk memverifikasi sesi.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMe,
  loginAdmin,
  logoutAdmin,
  type AdminUser,
  type LoginResponse,
} from "@/services/auth";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

interface AdminAuthContextValue {
  status: AuthStatus;
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AdminUser | null>(null);

  // Verifikasi sesi saat load: /me sukses = authenticated (cookie valid).
  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginAdmin(username, password);
    // Backend menyetel cookie httpOnly; profil hanya di memory state.
    setUser(data.user);
    setStatus("authenticated");
    return data;
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({
      status,
      isAuthenticated: status === "authenticated",
      user,
      login,
      logout,
    }),
    [status, user, login, logout]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth harus digunakan di dalam <AdminAuthProvider>");
  }
  return ctx;
}
