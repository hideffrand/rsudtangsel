"use client";

/**
 * AdminAuthContext — RSU Tangsel Care
 * State sesi admin + operasi auth (login/logout) terpusat.
 * Data bersumber dari localStorage via lib/admin-api.
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
  getUser,
  isAuthenticated,
  loginAdmin,
  logoutAdmin,
  saveTokens,
  saveUser,
  type AdminUser,
  type LoginResponse,
} from "./admin-api";

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

  const syncFromStorage = useCallback(() => {
    setStatus(isAuthenticated() ? "authenticated" : "unauthenticated");
    setUser(getUser());
  }, []);

  // Sinkronkan state dari localStorage saat mount + perubahan storage lain tab
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, [syncFromStorage]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginAdmin(username, password);
    saveTokens(data.access_token, data.refresh_token);
    saveUser(data.user);
    setStatus("authenticated");
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setStatus("unauthenticated");
    setUser(null);
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
