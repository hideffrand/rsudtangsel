import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n-context";
import { ToastProvider } from "@/components/ui/toast";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsappFloat } from "@/components/ui/whatsapp-float";

// Inter — font utama sesuai Design.md §2.2
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RSU Tangsel Care — Layanan Kesehatan Kota Tangerang Selatan",
  description:
    "Daftar online, cek status antrian, dan informasi layanan kesehatan RSU Tangsel Care. Tersedia dalam Bahasa Indonesia dan Inggris.",
  keywords: ["RSU Tangsel", "Rumah Sakit Tangerang Selatan", "daftar online", "antrian RS"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <I18nProvider>
          <ToastProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsappFloat />
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}


