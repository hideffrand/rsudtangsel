"use client";

import Link from "next/link";
import Image from "next/image";

export default function JumlahPenangananPengaduanPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* ─── Breadcrumb ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-8">
          <Link href="/" className="hover:text-teal-700">Beranda</Link>
          <span>/</span>
          <Link href="/informasi" className="hover:text-teal-700">Informasi Publik</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Jumlah Penanganan Pengaduan</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
          Jumlah Penanganan Pengaduan
        </h1>
        <div className="w-16 h-1 rounded-full bg-teal-600 mt-3 mb-10" />
      </div>

      {/* ─── Konten Gambar ──────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Image
          src="/laporan-aduan.png"
          alt="Jumlah Penanganan Pengaduan RSU Kota Tangerang Selatan"
          width={1200}
          height={1600}
          className="w-full h-auto rounded-lg shadow-sm border border-gray-100"
          priority
        />
      </div>

      {/* ─── Tombol Kembali ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-t border-gray-100 pt-8">
        <Link
          href="/informasi"
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900 transition-colors"
        >
          ← Kembali ke Informasi Publik
        </Link>
      </div>
    </div>
  );
}
