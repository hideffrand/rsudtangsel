"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import {
  LayoutDashboard,
  ListOrdered,
  Stethoscope,
  CalendarDays,
  HeartPulse,
  MessageSquare,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/antrian", label: "Manajemen Antrian", icon: <ListOrdered size={18} /> },
  { href: "/admin/mcu", label: "MCU Booking", icon: <Stethoscope size={18} /> },
  { href: "/admin/jadwal-dokter", label: "Jadwal Dokter", icon: <CalendarDays size={18} /> },
  { href: "/admin/layanan-kesehatan", label: "Layanan Kesehatan", icon: <HeartPulse size={18} /> },
  { href: "/admin/chatbot", label: "Chatbot Internal", icon: <MessageSquare size={18} /> },
  { href: "/admin/users", label: "Manajemen User", icon: <Users size={18} /> },
  { href: "/admin/audit-log", label: "Audit Log", icon: <ShieldCheck size={18} /> },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sidebar dianggap "expanded" kalau: mobile drawer terbuka, ATAU desktop tidak collapsed
  const isExpanded = mobileOpen || !isCollapsed;
  const showLabel = isExpanded;

  // Tutup drawer mobile setiap kali pindah halaman
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  return (
    <>
      {/* Mobile topbar */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="RSU Tangsel" className="w-7 h-7 object-contain" />
          <span className="text-slate-800 font-bold text-sm">Admin Dashboard</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-50 transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Overlay khusus mobile, muncul saat drawer terbuka */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:relative bg-white/95 backdrop-blur-xl h-screen z-50
          border-r border-slate-100
          transition-all duration-300 ease-in-out
          flex flex-col top-0
          w-64
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${isCollapsed ? "lg:w-[72px]" : "lg:w-64"}
        `}
      >
        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="
            hidden lg:flex
            absolute -right-[14px] top-[52px]
            w-7 h-7 items-center justify-center
            bg-white border border-slate-200 rounded-full
            text-slate-400 hover:text-emerald-600 hover:border-emerald-600
            transition-all duration-200 z-50
          "
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Logo / Branding */}
        <div
          className={`
            flex items-center gap-3 h-[72px] px-5 shrink-0 border-b border-slate-100
            ${isCollapsed && !mobileOpen ? "lg:justify-center lg:px-0" : ""}
          `}
        >
          <img src="/logo-icon.png" alt="RSU Tangsel" className="w-8 h-8 object-contain shrink-0" />
          {showLabel && (
            <div className="leading-none">
              <p className="text-slate-800 font-bold text-sm">RSU Tangsel Care</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Admin Dashboard</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!showLabel ? item.label : ""}
                className={`
                  relative flex items-center w-full px-3 py-2.5 rounded-lg
                  transition-all duration-150 group
                  ${showLabel ? "gap-3 justify-start" : "justify-center"}
                  ${active
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }
                `}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-600 rounded-r-full" />
                )}

                <span
                  className={`shrink-0 transition-colors duration-150 ${
                    active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-700"
                  }`}
                >
                  {item.icon}
                </span>

                {showLabel && (
                  <span
                    className={`flex-1 text-sm whitespace-nowrap transition-colors duration-150 ${
                      active ? "font-semibold text-emerald-600" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                )}

                {showLabel && item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500 text-white rounded font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 h-px bg-slate-100 shrink-0" />

        {/* User Footer */}
        <div className="p-3 shrink-0 space-y-2">
          <div
            className={`
              flex items-center rounded-lg bg-slate-50
              ${showLabel ? "gap-3 px-3 py-2.5" : "justify-center p-2.5"}
            `}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.username?.[0]?.toUpperCase() ?? "A"}
            </div>
            {showLabel && (
              <div className="leading-none overflow-hidden">
                <p className="text-slate-800 text-xs font-semibold truncate">{user?.username ?? "Admin"}</p>
                <p className="text-slate-400 text-[10px] mt-0.5 capitalize">{user?.role ?? "admin"}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title={!showLabel ? "Logout" : ""}
            className={`
              w-full flex items-center rounded-lg border border-red-100 bg-red-50
              text-red-600 hover:bg-red-100 transition-colors
              ${showLabel ? "gap-3 px-3 py-2.5" : "justify-center p-2.5"}
            `}
          >
            <LogOut size={18} className="shrink-0" />
            {showLabel && <span className="text-sm font-semibold whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}