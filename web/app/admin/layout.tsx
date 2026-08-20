"use client";

/**
 * Admin Layout — RSU Tangsel Care
 * Layout terpisah dari frontend publik.
 * Guard auth via AdminAuthContext: redirect ke /admin/login jika tidak ada token.
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth-context";
import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </AdminAuthProvider>
  );
}

function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, isAuthenticated } = useAdminAuth();

  const isLoginPage = pathname === "/admin/login";

  // Redirect jika belum login
  useEffect(() => {
    if (isLoginPage) return;
    if (!isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [pathname, isLoginPage, isAuthenticated, router]);

  // Tampilkan halaman login langsung tanpa sidebar
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        {children}
      </div>
    );
  }

  // Tunggu pengecekan auth (atau redirect login berjalan)
  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Memverifikasi sesi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
