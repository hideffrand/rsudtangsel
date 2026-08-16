export interface InfoTopic {
  slug: string;
  title: string;
  summary: string;
  icon: string;
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
    icon: "📋",
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
    icon: "🏥",
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
    icon: "👶",
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
    icon: "🔄",
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
