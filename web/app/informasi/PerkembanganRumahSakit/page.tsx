"use client";

/**
 * Halaman Perkembangan Rumah Sakit (/informasi/PerkembanganRumahSakit)
 * Menampilkan timeline visual bergantian kiri-kanan sejarah perkembangan RSU Tangsel.
 */

import Link from "next/link";

const TIMELINE = [
  {
    tahun: "2010",
    tanggal: "7 April 2010",
    judul: "Pendirian RSUD As-Sholihin",
    deskripsi:
      "Melalui Dinas Kesehatan mendirikan Rumah Sakit Umum di Jalan Surya Kencana No.1 Pamulang, diresmikan oleh Hj. Ratu Atut Chosiyah dengan nama RSUD As-Sholihin.",
    color: "#0E7D80",
  },
  {
    tahun: "2010",
    tanggal: "30 Desember 2010",
    judul: "Menjadi SKPD RSU Kota Tangerang Selatan",
    deskripsi:
      "Berdasarkan Peraturan Daerah SOTK No. 06 Tahun 2010 menjadi SKPD dengan nama RSU Kota Tangerang Selatan.",
    color: "#1a9ea2",
  },
  {
    tahun: "2012",
    tanggal: "29 Maret 2012",
    judul: "Pindah ke Gedung Baru",
    deskripsi:
      "Pindah dari Puskesmas Pamulang dan menempati gedung baru di Jl. Pajajaran No. 101 Pamulang.",
    color: "#2563eb",
  },
  {
    tahun: "2015",
    tanggal: "25 Juni 2015",
    judul: "Peluncuran SIMRASEL (SMS Gateway)",
    deskripsi:
      "Meluncurkan Sistem SMS Gateway Tangsel (SIMRASEL), dengan tujuan agar masyarakat dapat melakukan booking pendaftaran rawat jalan melalui SMS Gateway.",
    color: "#7c3aed",
  },
  {
    tahun: "2015",
    tanggal: "2015",
    judul: "Penetapan Pola BLUD",
    deskripsi:
      "Keputusan Walikota Tangerang Selatan Nomor 445.1/Kep.112-Huk/2015 Tentang Penerapan Pola Pengelolaan Keuangan Badan Layanan Umum Daerah (BLUD) pada RSU Kota Tangerang Selatan.",
    color: "#db2777",
  },
  {
    tahun: "2017",
    tanggal: "2017",
    judul: "Sistem Antrian Apotik",
    deskripsi:
      "Diluncurkan Sistem Antrian Apotik, sistem untuk pemanggil antrian apotik untuk resep racik dan non racik.",
    color: "#d97706",
  },
  {
    tahun: "2017",
    tanggal: "25 Juli 2017",
    judul: "Peluncuran SIPOLIN (Pendaftaran Online)",
    deskripsi:
      "Meluncurkan Sistem Pendaftaran Online (SIPOLIN) yaitu Sistem untuk melakukan Booking Online yang dapat diakses pada Website RSU Kota Tangerang Selatan.",
    color: "#059669",
  },
  {
    tahun: "2017",
    tanggal: "27 November 2017",
    judul: "Peluncuran SIMRS",
    deskripsi:
      "Meluncurkan Sistem Manajemen Rumah Sakit (SIMRS) yaitu Sistem yang memproses dan mengintegrasikan seluruh alur proses pelayanan Rumah Sakit.",
    color: "#dc2626",
  },
  {
    tahun: "2018",
    tanggal: "2018",
    judul: "Permendagri No. 79 Tahun 2018 tentang BLUD",
    deskripsi:
      "Peraturan Menteri Dalam Negeri Nomor 79 Tahun 2018 Tentang Badan Layanan Umum Daerah.",
    color: "#0E7D80",
  },
  {
    tahun: "2019",
    tanggal: "4 Oktober 2019",
    judul: "Informasi Antrian Live Pendaftaran",
    deskripsi:
      "Meluncurkan Informasi Antrian Live Pendaftaran yaitu informasi digital untuk menampilkan suara pemanggil dan data nomor urut antrian yang sedang berlangsung pada Pendaftaran Rawat Jalan RSU Kota Tangerang Selatan secara Live/online melalui website serta telah terintegrasi dengan modul pemanggil pendaftaran pada SIMRS RSU Kota Tangerang Selatan.",
    color: "#7c3aed",
  },
  {
    tahun: "2019",
    tanggal: "2019",
    judul: "Unit Organisasi Bersifat Khusus",
    deskripsi:
      "RSU Kota Tangerang Selatan menjadi Unit Organisasi Yang Bersifat Khusus, sesuai dengan Peraturan Walikota Tangerang Selatan Nomor 60 Tahun 2019 Tentang Pembentukan, Kedudukan, Susunan Organisasi, Tugas, Fungsi dan Tata Kerja RSU Kota Tangerang Selatan.",
    color: "#2563eb",
  },
  {
    tahun: "2020",
    tanggal: "23 Juni 2020",
    judul: "Aplikasi ADA JANJI",
    deskripsi:
      "Meluncurkan Aplikasi Daftar Perjanjian (ADA JANJI) yaitu Aplikasi untuk melakukan booking pendaftaran rawat jalan melalui perjanjian (local).",
    color: "#059669",
  },
  {
    tahun: "2020",
    tanggal: "25 September 2020",
    judul: "Pendaftaran via WhatsApp",
    deskripsi:
      "Meluncurkan Pendaftaran melalui WhatsApp yaitu Aplikasi untuk melakukan booking Pendaftaran Rawat Jalan melalui Whatsapp.",
    color: "#d97706",
  },
  {
    tahun: "2020",
    tanggal: "8 Desember 2020",
    judul: "Peluncuran SIBLUD",
    deskripsi:
      "Meluncurkan Sistem Informasi Badan Layanan Umum Daerah (SIBLUD) yaitu Sistem untuk pengelolaan data perencanaan anggaran BLUD, proses pengajuan belanja BLUD, proses Berita Acara Pemeriksaan, proses pengadaan BLUD, proses pencairan hingga pelaporan Akuntansi BLUD RSU Kota Tangerang Selatan yang saling terintegrasi.",
    color: "#dc2626",
  },
  {
    tahun: "2021",
    tanggal: "1 Maret 2021",
    judul: "LIS (Laboratorium Information System)",
    deskripsi:
      "Meluncurkan LIS (Laboratorium Information System) yaitu Aplikasi yang menangani penerimaan, pemrosesan dan penyimpanan informasi yang dihasilkan oleh proses hasil pemeriksaan dari alat kesehatan laboratorium dan telah terintegrasi dengan sistem informasi Manajemen Rumah Sakit.",
    color: "#0E7D80",
  },
  {
    tahun: "2021",
    tanggal: "1 Oktober 2021",
    judul: "SIMPEG NON PNS",
    deskripsi:
      "Meluncurkan SIMPEG NON PNS (Sistem Informasi Kepegawaian Non PNS) yaitu Aplikasi untuk mengelola absensi pegawai dan juga data pegawai Non PNS di RSU Kota Tangerang Selatan.",
    color: "#db2777",
  },
];

export default function PerkembanganRumahSakitPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* ─── Breadcrumb ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-8">
          <Link href="/" className="hover:text-teal-700">Beranda</Link>
          <span>/</span>
          <Link href="/informasi" className="hover:text-teal-700">Informasi Publik</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Perkembangan Rumah Sakit</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
          Perkembangan RSU Kota Tangerang Selatan
        </h1>
        <p className="text-gray-500 text-sm mb-1">2010 s/d Sekarang</p>
        <div className="w-16 h-1 rounded-full bg-teal-600 mt-3 mb-12" />
      </div>

      {/* ─── Timeline ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 relative">
        {/* Garis tengah */}
        <div
          className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
          style={{ background: "linear-gradient(to bottom, #0E7D80, #e5e7eb)" }}
        />

        {/* Garis tengah mobile */}
        <div
          className="md:hidden absolute left-5 top-0 bottom-0 w-0.5"
          style={{ background: "linear-gradient(to bottom, #0E7D80, #e5e7eb)" }}
        />

        <div className="space-y-10 md:space-y-0">
          {TIMELINE.map((item, i) => {
            const isLeft = i % 2 === 0;

            return (
              <div
                key={i}
                className="relative flex md:items-start"
                style={{ marginBottom: "3.5rem" }}
              >
                {/* ── Desktop Layout (alternating) ── */}
                <div className="hidden md:flex w-full items-start gap-0">
                  {/* Sisi Kiri */}
                  <div className={`w-5/12 ${isLeft ? "pr-10 text-right" : ""}`}>
                    {isLeft && (
                      <div
                        className="inline-block rounded-lg p-4 shadow-md border border-gray-100 text-left"
                        style={{ background: "#f8fafc" }}
                      >
                        <p className="text-xs font-semibold text-gray-400 mb-1">{item.tanggal}</p>
                        <h3 className="text-base font-bold text-gray-900 leading-snug mb-2">
                          {item.judul}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.deskripsi}</p>
                      </div>
                    )}
                  </div>

                  {/* Titik tengah + badge tahun */}
                  <div className="w-2/12 flex flex-col items-center pt-3 relative shrink-0">
                    {/* Dot */}
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-md z-10 shrink-0"
                      style={{ background: item.color }}
                    />
                    {/* Badge Tahun (banner miring seperti referensi) */}
                    <div
                      className="mt-2 px-4 py-1.5 rounded-sm text-white font-bold text-base shadow-lg"
                      style={{
                        background: item.color,
                        clipPath: isLeft
                          ? "polygon(0 0, 100% 0, 88% 100%, 0 100%)"
                          : "polygon(12% 0, 100% 0, 100% 100%, 0 100%)",
                        minWidth: "72px",
                        textAlign: "center",
                      }}
                    >
                      {item.tahun}
                    </div>
                  </div>

                  {/* Sisi Kanan */}
                  <div className={`w-5/12 ${!isLeft ? "pl-10" : ""}`}>
                    {!isLeft && (
                      <div
                        className="inline-block rounded-lg p-4 shadow-md border border-gray-100 w-full"
                        style={{ background: "#f8fafc" }}
                      >
                        <p className="text-xs font-semibold text-gray-400 mb-1">{item.tanggal}</p>
                        <h3 className="text-base font-bold text-gray-900 leading-snug mb-2">
                          {item.judul}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.deskripsi}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Mobile Layout (linear, left-aligned) ── */}
                <div className="md:hidden flex items-start gap-4 pl-10 w-full">
                  {/* Dot on the left line */}
                  <div
                    className="absolute left-[15px] top-3 w-4 h-4 rounded-full border-2 border-white shadow-md z-10 shrink-0"
                    style={{ background: item.color }}
                  />
                  <div className="flex-1">
                    {/* Badge tahun mobile */}
                    <div
                      className="inline-block px-3 py-0.5 rounded text-white font-bold text-xs mb-2 shadow"
                      style={{ background: item.color }}
                    >
                      {item.tahun}
                    </div>
                    <div
                      className="rounded-lg p-4 shadow-sm border border-gray-100"
                      style={{ background: "#f8fafc" }}
                    >
                      <p className="text-xs font-semibold text-gray-400 mb-1">{item.tanggal}</p>
                      <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1.5">
                        {item.judul}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.deskripsi}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
