"use client";

/**
 * Header — RSU Tangsel Care
 * Sticky, putih, border-bottom tipis (Design.md §6.1)
 * Toggle bahasa ID/EN selalu terlihat (Design.md §4)
 * Kontrol A-/A+ untuk font size (Design.md §5.1)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";

export function Header() {
  const { t, locale, toggleLocale } = useI18n();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fontSizeLg, setFontSizeLg] = useState(false);

  // Kontrol A-/A+ (Design.md §5.1) — set data-font-size di <html>
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-font-size",
      fontSizeLg ? "lg" : "base"
    );
  }, [fontSizeLg]);

  // Tutup mobile menu saat navigate
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/jadwal-dokter", label: t("nav.doctor_schedule") },
    { href: "/daftar-online", label: t("nav.registration") },
    { href: "/informasi", label: t("nav.info") },
    { href: "/layanan-kesehatan", label: t("nav.health_services") },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xs border-b border-border shadow-xs">
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`
                px-3 py-2 text-sm rounded-sm transition-colors whitespace-nowrap
                ${
                  isActive(link.href)
                    ? "text-primary font-semibold bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }
              `}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
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

          {/* Profile Pasien (Logo Profile Icon) */}
          <Link
            href="/profil"
            className={`
              flex items-center justify-center w-9 h-9 rounded-full transition-all shadow-2xs border
              ${
                pathname === "/profil"
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

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <nav
          id="mobile-menu"
          className="xl:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-2 shadow-md"
          aria-label="Navigasi mobile"
        >
          {/* Search Bar in Mobile */}
          <div className="relative w-full mb-1">
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

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`
                px-3 py-2.5 text-base rounded-sm transition-colors
                ${
                  isActive(link.href)
                    ? "text-primary font-semibold bg-muted"
                    : "text-foreground hover:bg-muted"
                }
              `}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}

          {/* Profile link in mobile */}
          <Link
            href="/profil"
            className="flex items-center gap-2 px-3 py-2.5 text-base font-semibold text-primary rounded-sm bg-primary/10"
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
