"use client";

/**
 * Header — RSU Tangsel Care
 * Sticky, putih, border-bottom tipis (Design.md §6.1)
 * Informasi: Link Langsung ke /informasi (Tanpa Dropdown Overlay)
 * Layanan Kesehatan: Mega Dropdown Menu (MCU 10 Paket & Diagnostik)
 * Toggle bahasa ID/EN (Design.md §4) & Kontrol font A-/A+ (Design.md §5.1)
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";

export function Header() {
  const { t, locale, toggleLocale } = useI18n();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fontSizeLg, setFontSizeLg] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"layanan" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Kontrol A-/A+ — set data-font-size di <html>
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-font-size",
      fontSizeLg ? "lg" : "base"
    );
  }, [fontSizeLg]);

  // Tutup dropdown & mobile menu saat navigate
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);

  const mcuPackages = [
    "MCU Hemat",
    "MCU Pelajar",
    "MCU Pegawai",
    "MCU Calon Pengantin",
    "MCU ROHAJJ (Haji/Umroh)",
    "MCU Silver",
    "MCU Gold",
    "MCU Platinum",
    "MCU Titanium",
    "MCU Jantung",
  ];

  return (
    <header
      ref={dropdownRef}
      className="sticky top-0 z-30 bg-background/95 backdrop-blur-xs border-b border-border shadow-xs"
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <div
        className="mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 gap-4"
        style={{ maxWidth: "var(--container-max)" }}
      >
        {/* Logo | RSU Tangsel Care */}
        <Link
          href="/"
          className="flex items-center gap-3 text-foreground font-semibold text-base group shrink-0"
          aria-label="RSU Tangsel Care — Kembali ke beranda"
        >
          <img
            src="/logo-icon.png"
            alt="Logo RSU Tangsel Care"
            className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-foreground text-base tracking-tight">RSU Tangsel Care</span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-normal mt-0.5">Merawat Sepenuh Hati</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-1" aria-label="Navigasi utama">
          {/* Jadwal Dokter */}
          <Link
            href="/jadwal-dokter"
            className={`
              px-3 py-2 text-sm rounded-sm transition-colors whitespace-nowrap
              ${isActive("/jadwal-dokter") ? "text-primary font-semibold bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"}
            `}
          >
            {t("nav.doctor_schedule")}
          </Link>

          {/* Antrian Pendaftaran */}
          <Link
            href="/daftar-online"
            className={`
              px-3 py-2 text-sm rounded-sm transition-colors whitespace-nowrap
              ${isActive("/daftar-online") ? "text-primary font-semibold bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"}
            `}
          >
            {t("nav.registration")}
          </Link>

          {/* Informasi (LANGSUNG LINK KE /informasi — TANPA DROPDOWN) */}
          <Link
            href="/informasi"
            className={`
              px-3 py-2 text-sm rounded-sm transition-colors whitespace-nowrap
              ${isActive("/informasi") ? "text-primary font-semibold bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"}
            `}
          >
            {t("nav.info")}
          </Link>

          {/* Dropdown: Layanan Kesehatan */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "layanan" ? null : "layanan")}
              onMouseEnter={() => setActiveDropdown("layanan")}
              className={`
                flex items-center gap-1 px-3 py-2 text-sm rounded-sm transition-colors whitespace-nowrap cursor-pointer
                ${isActive("/layanan-kesehatan") || isActive("/cari-layanan") || activeDropdown === "layanan" ? "text-primary font-semibold bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"}
              `}
              aria-expanded={activeDropdown === "layanan"}
            >
              <span>{t("nav.health_services")}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === "layanan" ? "rotate-180 text-primary" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Right Section: Search bar | Profile icon | A-/A+ | ID/EN */}
        <div className="flex items-center gap-2.5">
          {/* Search bar */}
          <div className="relative hidden md:block w-44 lg:w-52">
            <input
              type="search"
              placeholder="Cari dokter, poli..."
              className="w-full h-9 pl-8 pr-3 text-xs bg-muted/60 border border-border rounded-full focus:outline-none focus:border-primary focus:bg-background transition-all"
            />
            <svg
              className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.75 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          {/* Profile Pasien */}
          <Link
            href="/profil"
            className={`
              flex items-center justify-center w-9 h-9 rounded-full transition-all shadow-2xs border
              ${pathname === "/profil"
                ? "bg-primary text-white border-primary"
                : "bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white"
              }
            `}
            aria-label={t("nav.profile")}
            title={t("nav.profile")}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </Link>

          {/* A- / A+ font control */}
          <div className="hidden sm:flex items-center gap-0.5 border border-border rounded-sm overflow-hidden bg-background shadow-2xs">
            <button
              onClick={() => setFontSizeLg(false)}
              className={`
                px-2 py-1 text-xs font-medium transition-colors
                ${!fontSizeLg ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:bg-muted"}
              `}
              aria-label={t("header.font_smaller")}
              aria-pressed={!fontSizeLg}
            >
              A−
            </button>
            <button
              onClick={() => setFontSizeLg(true)}
              className={`
                px-2 py-1 text-xs font-medium transition-colors
                ${fontSizeLg ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:bg-muted"}
              `}
              aria-label={t("header.font_larger")}
              aria-pressed={fontSizeLg}
            >
              A+
            </button>
          </div>

          {/* Language toggle (ID/EN) */}
          <button
            onClick={toggleLocale}
            className="
              flex items-center gap-1 px-2.5 py-1 h-9
              text-xs font-semibold text-muted-foreground
              border border-border rounded-sm bg-background shadow-2xs
              hover:text-foreground hover:bg-muted
              transition-colors cursor-pointer
            "
            aria-label={`Ganti bahasa ke ${locale === "id" ? "English" : "Indonesia"}`}
          >
            <svg
              className="w-3.5 h-3.5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253"
              />
            </svg>
            <span>{locale.toUpperCase()}</span>
          </button>

          {/* Mobile menu button */}
          <button
            className="xl:hidden flex items-center justify-center w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm border border-border transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── MEGA DROPDOWN MENU PANEL HANYA UNTUK LAYANAN KESEHATAN ─────────────────── */}
      {activeDropdown === "layanan" && (
        <div
          className="
            absolute left-0 right-0 top-16 bg-background border-b border-border shadow-xl
            p-6 animate-[fadeIn_0.15s_ease-out] z-40 hidden xl:block
          "
          onMouseEnter={() => setActiveDropdown("layanan")}
        >
          <div
            className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8"
            style={{ maxWidth: "var(--container-max)" }}
          >
            {/* Column 1 & 2: Medical Check Up (MCU) Header & Packages */}
            <div className="lg:col-span-2 space-y-3 border-r border-border/60 pr-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <h3 className="font-bold text-base text-foreground tracking-tight uppercase">
                  Medical Check Up (MCU)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground pb-1">
                Paket pemeriksaan kesehatan menyeluruh RSU Tangsel Care untuk kebutuhan individu, pendidikan, dan pekerjaan.
              </p>

              {/* Grid 10 Paket MCU */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {mcuPackages.map((pkg, idx) => (
                  <Link
                    key={idx}
                    href={`/cari-layanan?tipe=mcu&paket=${encodeURIComponent(pkg)}`}
                    onClick={() => setActiveDropdown(null)}
                    className="
                      flex items-center gap-2 p-2.5 rounded-sm border border-border/70 bg-muted/40
                      hover:bg-primary/10 hover:border-primary/40 text-xs font-semibold text-foreground hover:text-primary
                      transition-all
                    "
                  >
                    <span className="truncate">{pkg}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 3: Diagnostik Medis Utama */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <h3 className="font-bold text-base text-foreground tracking-tight uppercase">
                  Diagnostik
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: "Cek Laboratorium", href: "/cari-layanan?tipe=lab" },
                  { name: "Cek Radiologi", href: "/cari-layanan?tipe=radiologi" },
                ].map((serv, idx) => (
                  <Link
                    key={idx}
                    href={serv.href}
                    onClick={() => setActiveDropdown(null)}
                    className="
                      flex items-center justify-between p-2.5 rounded-sm border border-border/70
                      hover:bg-muted font-medium text-foreground hover:text-primary transition-all
                    "
                  >
                    <span>{serv.name}</span>
                    <span className="text-primary font-bold">&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE MENU ─────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <nav
          id="mobile-menu"
          className="xl:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-3 shadow-md max-h-[85vh] overflow-y-auto"
          aria-label="Navigasi mobile"
        >
          {/* Search Bar Mobile */}
          <div className="relative w-full">
            <input
              type="search"
              placeholder="Cari dokter, poli..."
              className="w-full h-9 pl-8 pr-3 text-xs bg-muted/60 border border-border rounded-full focus:outline-none focus:border-primary"
            />
            <svg
              className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.75 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          <Link href="/jadwal-dokter" className="px-3 py-2 text-base font-semibold text-foreground hover:bg-muted rounded">
            {t("nav.doctor_schedule")}
          </Link>

          <Link href="/daftar-online" className="px-3 py-2 text-base font-semibold text-foreground hover:bg-muted rounded">
            {t("nav.registration")}
          </Link>

          <Link href="/informasi" className="px-3 py-2 text-base font-semibold text-foreground hover:bg-muted rounded">
            {t("nav.info")}
          </Link>

          {/* Layanan Kesehatan Accordion in Mobile */}
          <div className="border border-border rounded-md p-3 space-y-2 bg-muted/30">
            <div className="font-bold text-sm text-primary uppercase">Medical Check Up (MCU)</div>
            <div className="grid grid-cols-2 gap-1 text-xs text-foreground/90 pl-2">
              {mcuPackages.map((pkg, idx) => (
                <Link key={idx} href={`/cari-layanan?tipe=mcu&paket=${encodeURIComponent(pkg)}`} className="py-1 hover:text-primary">
                  • {pkg}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/profil"
            className="flex items-center gap-2 px-3 py-2.5 text-base font-semibold text-primary rounded-sm bg-primary/10 mt-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span>{t("nav.profile")}</span>
          </Link>
        </nav>
      )}
    </header>
  );
}
