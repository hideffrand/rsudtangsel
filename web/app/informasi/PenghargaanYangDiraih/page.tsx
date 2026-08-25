"use client";

/**
 * Halaman Penghargaan Yang Diraih (/informasi/PenghargaanYangDiraih)
 * Menampilkan timeline visual penghargaan menggunakan pola yang sama dengan Perkembangan RS.
 */

import Link from "next/link";

const PENGHARGAAN = [
  {
    tahun: "2017",
    tanggal: "27 Desember 2017",
    judul: "Predikat SAKIP Kategori Baik",
    deskripsi:
      "Mendapatkan penghargaan yang diberikan oleh Wakil Walikota Tangerang Selatan atas \"Predikat Sistem Akuntabilitas Kinerja Instansi Pemerintah\" pada Tahun 2016 dengan kategori \"Baik\".",
    color: "#0E7D80",
  },
  {
    tahun: "2018",
    tanggal: "26 Juli 2018",
    judul: "Akreditasi Tingkat Paripurna (KARS)",
    deskripsi:
      "Mendapatkan Sertifikat Akreditasi Rumah Sakit oleh KARS (Komisi Akreditasi Rumah Sakit) dalam memenuhi \"Standar Akreditasi Tingkat Paripurna\".",
    color: "#1a9ea2",
  },
  {
    tahun: "2018",
    tanggal: "26 November 2018",
    judul: "Peringkat II E-Government",
    deskripsi:
      "Mendapatkan penghargaan dan sertifikat peringkat II oleh Walikota Tangerang Selatan, diberikan atas \"Penilaian Peringkat E-Government Tingkat OPD Kota Tangerang Selatan\".",
    color: "#2563eb",
  },
  {
    tahun: "2018",
    tanggal: "27 November 2018",
    judul: "Unit Penyelenggara Pelayanan Publik Baik",
    deskripsi:
      "Mendapatkan penghargaan yang diberikan oleh Kementrian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi sebagai \"Unit Penyelenggara Pelayanan Publik Kategori\" dengan kategori \"Baik\".",
    color: "#7c3aed",
  },
  {
    tahun: "2019",
    tanggal: "7 November 2019",
    judul: "Apresiasi Administrasi Data Terbaik",
    deskripsi:
      "Mendapatkan penghargaan yang diberikan oleh Badan Penyelenggara Jaminan Sosial Tenaga Kerja / BP Jamsostek Kota Tangerang Selatan sebagai \"Apresiasi Administrasi Data Terbaik\".",
    color: "#db2777",
  },
  {
    tahun: "2019",
    tanggal: "16 November 2019",
    judul: "Role Model Pelayanan Publik Baik",
    deskripsi:
      "Mendapatkan penghargaan yang diberikan oleh Kementrian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi sebagai \"Role Model Penyelenggara Pelayanan Publik\" kategori \"Baik\".",
    color: "#d97706",
  },
  {
    tahun: "2019",
    tanggal: "16 November 2019",
    judul: "Respon SISRUTE Terbanyak",
    deskripsi:
      "Mendapatkan penghargaan yang diberikan oleh Dinas Kesehatan Tangerang Selatan sebagai \"Penyelenggara Pelayanan Kesehatan Berbasis Sistem Rujukan (SISRUTE)\" kategori respon terbanyak.",
    color: "#059669",
  },
  {
    tahun: "2019",
    tanggal: "21 November 2019",
    judul: "Pemberian Informasi & Pengaduan Terbaik JKN-KIS",
    deskripsi:
      "Mendapatkan penghargaan yang diberikan oleh BPJS Kesehatan sebagai \"Pemberian Informasi dan Penanganan Pengaduan Peserta JKN-KIS\".",
    color: "#dc2626",
  },
  {
    tahun: "2019",
    tanggal: "28 November 2019",
    judul: "Peringkat I E-Government",
    deskripsi:
      "Mendapatkan penghargaan dan sertifikat peringkat I yang diberikan oleh Walikota Tangerang Selatan atas \"Penilaian Peringkat E-Government Tingkat OPD Kota Tangerang Selatan\".",
    color: "#0E7D80",
  },
  {
    tahun: "2020",
    tanggal: "Tahun 2020",
    judul: "Implementasi AKIP Predikat A Memuaskan",
    deskripsi:
      "Mendapatkan penghargaan yang diberikan oleh Walikota Tangerang Selatan atas prestasi dalam Implementasi Akuntabilitas Kinerja Instansi Pemerintah (AKIP) di Lingkungan Pemerintahan Kota Tangerang Selatan Provinsi Banten dengan predikat kategori A Memuaskan.",
    color: "#1a9ea2",
  },
  {
    tahun: "2021",
    tanggal: "12 November 2021",
    judul: "RS Rujukan TB MDR 2016-2021",
    deskripsi:
      "Mendapatkan penghargaan yang diberikan oleh Dinas Kesehatan Kota Tangerang Selatan sebagai \"Rumah Sakit Rujukan TB MDR di Kota Tangerang Selatan Sejak Tahun 2016-2021\".",
    color: "#2563eb",
  },
  {
    tahun: "2022",
    tanggal: "30 November 2022",
    judul: "Layanan Pengobatan HIV Terbaik 2022",
    deskripsi:
      "Mendapatkan penghargaan yang diberikan oleh Dinas Kesehatan Kota Tangerang Selatan sebagai \"Fasilitas Layanan Pengobatan HIV Terbaik Tahun 2022\".",
    color: "#7c3aed",
  },
  {
    tahun: "2022",
    tanggal: "30 November 2022",
    judul: "RS Mentor Penurunan AKI & AKB Terbaik",
    deskripsi:
      "Mendapatkan penghargaan yang diberikan oleh Dinas Kesehatan Kota Tangerang Selatan sebagai \"Rumah Sakit Mentor Terbaik Dalam Upaya Penurunan Angka Kematian Ibu dan Bayi\".",
    color: "#db2777",
  },
  {
    tahun: "2022",
    tanggal: "26 Desember 2022",
    judul: "AKIP Nilai 86,24 Predikat A Memuaskan",
    deskripsi:
      "Mendapatkan penghargaan yang diberikan oleh Walikota Tangerang Selatan atas prestasi dan implementasi Akuntabilitas Kinerja Instansi Pemerintah (AKIP) di Lingkungan Pemerintah Kota Tangerang Selatan Tahun 2021 dengan nilai 86,24 (A) Memuaskan.",
    color: "#d97706",
  },
  {
    tahun: "2023",
    tanggal: "6 Februari 2023",
    judul: "Akreditasi Paripurna (LARS DHP)",
    deskripsi:
      "Mendapatkan Sertifikat Akreditasi Rumah Sakit oleh Lembaga Akreditasi Rumah Sakit Damar Husada Paripurna (LARS DHP) dalam memenuhi \"Standar Akreditasi Tingkat Paripurna\".",
    color: "#059669",
  },
  {
    tahun: "2023",
    tanggal: "26 November 2023",
    judul: "Inovasi Perangkat Daerah Predikat Sangat Inovatif",
    deskripsi:
      "Mendapatkan penghargaan peringkat 2 (dua) dengan predikat \"Sangat Inovatif\" kategori inovasi perangkat daerah pada Pemerintahan Inovasi Perangkat Daerah ke-2 Kota Tangerang Selatan Tahun 2023.",
    color: "#dc2626",
  },
  {
    tahun: "2025",
    tanggal: "20 September 2025",
    judul: "Palang Merah Indonesia",
    deskripsi:
      "Mendapatkan Piagam Penghargaan Atas Kerja Sama Dalam Pelayanan Distribusi Darah Dari Palang Merah Indonesia Kota Tangerang Selatan.",
    color: "#0E7D80",
  },
  {
    tahun: "2025",
    tanggal: "9 Oktober 2025",
    judul: "Faskes Berkomitmen Terbaik 3 JKN",
    deskripsi:
      "Mendapatkan Piagam Penghargaan sebagai Faskes Berkomitmen Terbaik Ketiga Dalam Pelayanan Kesehatan Program JKN Wilayah Kantor Cabang Tangerang Tahun 2025 Kategori FKRTL Tipe C.",
    color: "#1a9ea2",
  },
  {
    tahun: "2025",
    tanggal: "27 November 2025",
    judul: "Kinerja SKDR Terbaik",
    deskripsi:
      "Mendapatkan Sertifikat Penghargaan RS Dengan Kinerja Sistem Kewaspadaan Dini Dan Respon (SKDR) Terbaik tingkat Kota Tangerang Selatan.",
    color: "#2563eb",
  },
  {
    tahun: "2025",
    tanggal: "27 November 2025",
    judul: "RS Rujukan Stunting",
    deskripsi:
      "Mendapatkan Sertifikat Penghargaan Rumah Sakit Rujukan Stunting tingkat Kota Tangerang Selatan.",
    color: "#7c3aed",
  },
  {
    tahun: "2025",
    tanggal: "November 2025",
    judul: "Inovasi Perangkat Daerah",
    deskripsi:
      "Mendapatkan Penghargaan peringkat 2 untuk Kategori Inovasi Perangkat Daerah Pada Pemeringkatan Inovasi Perangkat Daerah (PIPD) Ke-4 Kota Tangerang Selatan Tahun 2025.",
    color: "#db2777",
  },
  {
    tahun: "2025",
    tanggal: "17 Desember 2025",
    judul: "Terbaik Surveilans Rumah Sakit",
    deskripsi:
      "Mendapatkan Penghargaan TERBAIK Surveilans Rumah Sakit pada kegiatan Hari Kesehatan Nasional (HKN) Tingkat Provinsi Banten Tahun 2025.",
    color: "#d97706",
  },
  {
    tahun: "2025",
    tanggal: "Desember 2025",
    judul: "BPJS Ketenagakerjaan",
    deskripsi:
      "Mendapatkan Penghargaan dari BPJS Ketenagakerjaan sebagai \"Rumah Sakit dengan Integritas dan Sinergi Kelembagaan Terbaik di Tangerang Selatan Tahun 2025\".",
    color: "#059669",
  },
  {
    tahun: "2025",
    tanggal: "23 Desember 2025",
    judul: "RS Layanan Kesehatan Inovatif",
    deskripsi:
      "Mendapatkan Penghargaan Sebagai Rumah Sakit Layanan Kesehatan Inovatif (Temporal Mandibular Joint) Dalam Rangka Penganugerahan Tangsel Investment Forum 2025.",
    color: "#dc2626",
  },
];

export default function PenghargaanYangDiraihPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* ─── Breadcrumb ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-8">
          <Link href="/" className="hover:text-teal-700">Beranda</Link>
          <span>/</span>
          <Link href="/informasi" className="hover:text-teal-700">Informasi Publik</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Penghargaan Yang Diraih</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
          Penghargaan Yang Diraih RSU Kota Tangerang Selatan
        </h1>
        <p className="text-gray-500 text-sm mb-1">2017 s/d Sekarang</p>
        <div className="w-16 h-1 rounded-full bg-teal-600 mt-3 mb-12" />
      </div>

      {/* ─── Timeline ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 relative">
        <div
          className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
          style={{ background: "linear-gradient(to bottom, #0E7D80, #e5e7eb)" }}
        />
        <div
          className="md:hidden absolute left-5 top-0 bottom-0 w-0.5"
          style={{ background: "linear-gradient(to bottom, #0E7D80, #e5e7eb)" }}
        />

        <div className="space-y-10 md:space-y-0">
          {PENGHARGAAN.map((item, i) => {
            const isLeft = i % 2 === 0;

            return (
              <div
                key={i}
                className="relative flex md:items-start"
                style={{ marginBottom: "3.5rem" }}
              >
                {/* ── Desktop Layout ── */}
                <div className="hidden md:flex w-full items-start gap-0">
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

                  <div className="w-2/12 flex flex-col items-center pt-3 relative shrink-0">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-md z-10 shrink-0"
                      style={{ background: item.color }}
                    />
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

                {/* ── Mobile Layout ── */}
                <div className="md:hidden flex items-start gap-4 pl-10 w-full">
                  <div
                    className="absolute left-[15px] top-3 w-4 h-4 rounded-full border-2 border-white shadow-md z-10 shrink-0"
                    style={{ background: item.color }}
                  />
                  <div className="flex-1">
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
