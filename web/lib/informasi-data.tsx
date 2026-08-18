import { ReactNode } from "react";

export interface InfoTopic {
  slug: string;
  title: string;
  summary: string;
  icon: ReactNode;
  lastUpdated: string;
  overview: string;
  sections: {
    heading: string;
    points: string[];
  }[];
}

export const INFO_TOPICS: InfoTopic[] = [
  {
    slug: "standar-pelayanan",
    title: "Standar Pelayanan Publik",
    summary: "Maklumat pelayanan & jaminan kepastian layanan publik di RSU Tangsel Care.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
    lastUpdated: "15 Agustus 2026",
    overview:
      "RSU Tangsel Care berkomitmen memberikan jaminan kepastian dan standar mutu pelayanan kesehatan terbaik bagi seluruh masyarakat Kota Tangerang Selatan secara profesional, transparan, dan akuntabel.",
    sections: [
      {
        heading: "1. Maklumat Pelayanan Publik",
        points: [
          "Dengan ini kami menyatakan sanggup menyelenggarakan pelayanan kesehatan sesuai standar pelayanan yang telah ditetapkan.",
          "Apabila tidak memenuhi janji layanan, kami siap menerima sanksi sesuai ketentuan peraturan perundang-undangan yang berlaku.",
        ],
      },
      {
        heading: "2. Kepastian Waktu & Respons Layanan",
        points: [
          "Waktu tunggu pendaftaran poliklinik rawat jalan maksimal 15 menit.",
          "Waktu tunggu pelayanan pemeriksaan oleh dokter spesialis maksimal 30 menit setelah dipanggil.",
          "Pelayanan gawat darurat (IGD) melayani 24 Jam nonstop dengan masa penanganan triase medis kurang dari 5 menit.",
        ],
      },
      {
        heading: "3. Transparansi Tarif & Hak Pasien",
        points: [
          "Seluruh tarif pelayanan non-BPJS mengacu pada Perda Retribusi Daerah Kota Tangerang Selatan.",
          "Pasien berhak mendapatkan penjelasan medis yang lengkap mengenai diagnosa, tindakan, dan obat dari dokter yang merawat.",
        ],
      },
    ],
  },
  {
    slug: "persyaratan-poli",
    title: "Persyaratan Daftar Poliklinik",
    summary: "Dokumen rujukan BPJS, KTP, dan prosedur pendaftaran fisik di rumah sakit.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    lastUpdated: "12 Agustus 2026",
    overview:
      "Berikut adalah kelengkapan dokumen administratif yang wajib dibawa oleh pasien saat melakukan verifikasi pendaftaran di Poliklinik Rawat Jalan RSU Tangsel Care.",
    sections: [
      {
        heading: "1. Pasien BPJS Kesehatan / KIS",
        points: [
          "e-KTP atau Kartu Keluarga (KK) asli calon pasien.",
          "Kartu BPJS Kesehatan / KIS yang berstatus aktif.",
          "Surat Rujukan asli yang masih berlaku dari Faskes Tingkat 1 (Puskesmas / Klinik).",
          "Surat Kontrol Ulang asli dari dokter spesialis (apabila kunjungan ulang/kontrol).",
        ],
      },
      {
        heading: "2. Pasien Umum / Mandiri",
        points: [
          "e-KTP atau KK asli (atau Kartu Identitas Anak bagi pasien anak).",
          "Kartu Berobat RSU Tangsel Care (apabila sudah pernah berkunjung sebelumnya).",
        ],
      },
      {
        heading: "3. Pasien Asuransi Swasta / Kerjasama Perusahaan",
        points: [
          "Kartu fisik / digital Asuransi Kesehatan yang masih aktif.",
          "Formulir klaim rawat jalan khusus dari perusahaan asuransi terkait.",
          "Surat jaminan / rujukan dari bagian HRD perusahaan mitra (jika dipersyaratkan).",
        ],
      },
    ],
  },
  {
    slug: "persyaratan-akta",
    title: "Persyaratan Akta Kelahiran",
    summary: "Panduan kelengkapan berkas pembuatan akta lahir bayi bagi ibu bersalin di RSU Tangsel Care.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
      </svg>
    ),
    lastUpdated: "10 Agustus 2026",
    overview:
      "Layanan kemudahan penerbitan Akta Kelahiran Bayi bekerja sama dengan Disdukcapil Kota Tangerang Selatan bagi ibu yang melahirkan di RSU Tangsel Care.",
    sections: [
      {
        heading: "1. Kelengkapan Berkas Administrasi Orang Tua",
        points: [
          "Surat Keterangan Lahir (SKL) asli yang dikeluarkan oleh dokter/bidan penolong di RSU Tangsel Care.",
          "Fotokopi KTP elektronik Suami dan Istri (Orang Tua Bayi).",
          "Fotokopi Kartu Keluarga (KK) Kota Tangerang Selatan yang sudah terdaftar.",
          "Fotokopi Buku Nikah / Akta Perkawinan Orang Tua (legalisir KUA/Disdukcapil).",
        ],
      },
      {
        heading: "2. Saksi Kelahiran",
        points: [
          "Fotokopi KTP 2 (dua) orang saksi persalinan (anggota keluarga atau kerabat).",
          "Formulir permohonan penerbitan Akta Kelahiran yang disisi lengkap dan ditandatangani pemohon.",
        ],
      },
    ],
  },
  {
    slug: "alur-pelayanan",
    title: "Alur Pelayanan Kesehatan",
    summary: "Bagan langkah pelayanan dari pendaftaran online hingga pengambilan obat di apotik.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
      </svg>
    ),
    lastUpdated: "08 Agustus 2026",
    overview:
      "Alur langkah pelayanan pasien di RSU Tangsel Care dirancang untuk kecepatan, kemudahan, dan kenyamanan perjalanan medis pasien.",
    sections: [
      {
        heading: "Tahap 1: Pendaftaran & Ambil Nomor Antrian",
        points: [
          "Lakukan pendaftaran online melalui web/aplikasi RSU Tangsel Care atau ambil tiket antrian fisik di mesin Anjungan Mandiri RS.",
          "Petugas verifikasi loket akan mencetak Kartu Antrian Poliklinik.",
        ],
      },
      {
        heading: "Tahap 2: Pemeriksaan Tanda Vital di Poli",
        points: [
          "Pasien menuju ruang tunggu Poliklinik Spesialis sesuai nomor poli.",
          "Perawat melakukan cek tekanan darah, suhu tubuh, dan berat badan sebelum masuk ruang dokter.",
        ],
      },
      {
        heading: "Tahap 3: Konsultasi Medis & Tindakan Dokter",
        points: [
          "Pasien masuk ke ruang dokter spesialis untuk pemeriksaan diagnosa dan pemberian resep obat atau pengantar laboratorium.",
        ],
      },
      {
        heading: "Tahap 4: Pembayaran & Pengambilan Obat Farmasi",
        points: [
          "Kasir mengonfirmasi pembiayaan (BPJS / Umum / Asuransi).",
          "Pasien mengambil resep obat racikan / obat jadi di Depo Farmasi RS.",
        ],
      },
    ],
  },
];
