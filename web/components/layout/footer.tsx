"use client";

/**
 * Footer — RSU Tangsel Care
 * Info singkat: jam, kontak, copyright (Design.md §6.1)
 */

import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-muted/60 mt-auto">
      <div
        className="mx-auto px-4 sm:px-6 lg:px-8 py-10"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-muted-foreground">
          {/* Kolom 1 — Brand */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3 text-foreground font-bold text-base">
              <img
                src="/logo-icon.png"
                alt="Logo RSU Tangsel Care"
                className="w-8 h-8 object-contain"
              />
              <span className="tracking-tight">RSU Tangsel Care</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{t("footer.tagline")}</p>
          </div>

          {/* Kolom 2 — Jam Layanan */}
          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              {t("home.info.hours")}
            </h3>
            <p className="text-xs leading-relaxed">{t("home.info.hours_value")}</p>
          </div>

          {/* Kolom 3 — Kontak Darurat */}
          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              {t("home.info.emergency")}
            </h3>
            <p className="text-xs leading-relaxed font-medium text-destructive">{t("home.info.emergency_value")}</p>
            <p className="text-xs leading-relaxed">{t("home.info.location_value")}</p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border/80 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>{t("footer.copyright")}</span>
          <span className="text-[11px] opacity-75">RSU Kota Tangerang Selatan</span>
        </div>
      </div>
    </footer>
  );
}
