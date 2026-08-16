"use client";

/**
 * Chat Dokter — RSU Tangsel Care
 * Design.md §6.4:
 * - Disclaimer wajib Dialog (butuh klik "Saya Mengerti", bukan auto-dismiss)
 * - Redirect ke WhatsApp RS
 */

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

// Nomor WhatsApp RS (ganti dengan nomor aktual)
const WHATSAPP_NUMBER = "6282100000000";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Halo, saya ingin berkonsultasi dengan dokter RSU Tangsel Care."
)}`;

export default function ChatDokterPage() {
  const { t } = useI18n();
  const [disclaimerShown, setDisclaimerShown] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const handleStartChat = () => {
    if (!disclaimerAccepted) {
      setDisclaimerShown(true);
    } else {
      window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
    }
  };

  const handleAcceptDisclaimer = () => {
    setDisclaimerAccepted(true);
    setDisclaimerShown(false);
    // Buka WhatsApp setelah terima disclaimer
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-12"
      style={{ maxWidth: "560px" }}
    >
      {/* Heading */}
      <h1 className="text-2xl font-semibold text-foreground">
        {t("chat.title")}
      </h1>

      {/* Info card */}
      <div className="mt-6 border border-border rounded-md p-6 space-y-5 bg-background shadow-xs">
        {/* Ikon chat */}
        <div
          className="w-12 h-12 flex items-center justify-center rounded-md bg-primary/10 border border-primary/20"
          aria-hidden="true"
        >
          <svg
            className="w-6 h-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Layanan konsultasi dokter via WhatsApp tersedia pada:
          </p>
          <ul className="text-sm space-y-1.5 pt-1">
            <li className="flex gap-2 items-center">
              <span className="text-primary font-semibold w-28">Senin–Jumat</span>
              <span className="text-muted-foreground">08:00 – 17:00 WIB</span>
            </li>
            <li className="flex gap-2 items-center">
              <span className="text-primary font-semibold w-28">Sabtu</span>
              <span className="text-muted-foreground">08:00 – 12:00 WIB</span>
            </li>
          </ul>
        </div>

        {/* Warning box darurat */}
        <div
          className="flex gap-3 p-3.5 bg-red-50 border border-red-200 rounded-sm"
          role="note"
        >
          <svg
            className="w-5 h-5 text-accent shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm text-red-700 leading-relaxed">
            <strong>Kondisi darurat?</strong> Jangan gunakan chat — segera hubungi IGD (Instalasi Gawat Darurat) di <a href="tel:02155551234" className="underline font-semibold text-red-800">(021) 5555-1234</a> atau datang langsung.
          </p>
        </div>

        {/* CTA button */}
        <Button
          id="btn-mulai-chat"
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleStartChat}
        >
          {/* WhatsApp icon */}
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {t("chat.btn_start")}
        </Button>
      </div>

      {/* Disclaimer Dialog — wajib klik, tidak auto-dismiss (Design.md §6.4) */}
      <Dialog
        isOpen={disclaimerShown}
        onClose={() => setDisclaimerShown(false)}
        title={t("chat.disclaimer_title")}
        confirmLabel={t("chat.disclaimer_confirm")}
        onConfirm={handleAcceptDisclaimer}
        disableEscapeClose={false}
      >
        <p className="leading-relaxed">{t("chat.disclaimer_body")}</p>
      </Dialog>
    </div>
  );
}
