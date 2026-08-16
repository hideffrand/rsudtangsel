"use client";

/**
 * i18n Context — RSU Tangsel Care
 * Toggle bahasa ID/EN via Context API (Design.md §4)
 * Simpel tanpa library eksternal — cukup untuk kebutuhan saat ini.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { translations, type Locale } from "./translations";

interface I18nContextType {
  locale: Locale;
  toggleLocale: () => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("id");

  const toggleLocale = useCallback(() => {
    setLocale((prev) => (prev === "id" ? "en" : "id"));
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[locale][key] ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook untuk pakai terjemahan di komponen manapun.
 * Contoh: const { t, locale, toggleLocale } = useI18n();
 */
export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n harus dipakai di dalam <I18nProvider>");
  }
  return ctx;
}
