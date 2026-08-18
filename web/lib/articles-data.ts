export interface Article {
  id: number;
  slug: string;
  title: string;
  date: string;
  category: string;
  author: string;
  readTime: string;
  summary: string;
  content: string[];
}

export const ARTICLES: Article[] = [
  {
    id: 1,
    slug: "rsu-tangsel-care-resmikan-poliklinik-eksekutif-malam-hari",
    title: "RSU Tangsel Care Resmikan Poliklinik Eksekutif Malam Hari",
    date: "14 Agustus 2026",
    category: "Layanan Baru",
    author: "Humas RSU Tangsel",
    readTime: "3 menit baca",
    summary:
      "Memudahkan masyarakat dan pekerja kantoran untuk mendapatkan layanan kesehatan spesialis tanpa harus mengganggu jam kerja siang.",
    content: [
      "RSU Tangsel Care resmi meluncurkan layanan Poliklinik Eksekutif Malam Hari mulai Agustus 2026. Layanan ini dihadirkan khusus untuk menjawab kebutuhan masyarakat perkotaan dan pekerja kantoran di wilayah Tangerang Selatan yang sering kesulitan meluangkan waktu berobat pada jam kerja reguler.",
      "Poliklinik Eksekutif Malam beroperasi mulai pukul 17.00 hingga 21.00 WIB setiap hari kerja (Senin–Jumat). Dokter spesialis yang bertugas mencakup Spesialis Penyakit Dalam, Spesialis Anak, Spesialis Kandungan (Kebidanan), serta Spesialis Jantung & Pembuluh Darah.",
      "Selain kenyamanan waktu, pasien Poliklinik Eksekutif juga mendapatkan fasilitas jalur antrian terpisah, ruang tunggu ber-AC dengan Wi-Fi gratis, serta akses konsultasi yang lebih personal dengan dokter spesialis senior.",
      "Pendaftaran antrian dapat dilakukan secara online hingga H-1 melalui aplikasi web RSU Tangsel Care pada menu Antrian Pendaftaran.",
    ],
  },
  {
    id: 2,
    slug: "tips-menjaga-kesehatan-jantung-pola-makan-sehat",
    title: "Tips Menjaga Kesehatan Jantung & Pola Makan Sehat",
    date: "10 Agustus 2026",
    category: "Edukasi Kesehatan",
    author: "dr. Bagas Pratama, Sp.JP",
    readTime: "4 menit baca",
    summary:
      "Simak ulasan lengkap dr. Bagas Pratama, Sp.JP mengenai 5 kebiasaan harian yang ampuh menjaga kebugaran otot jantung Anda.",
    content: [
      "Penyakit jantung dan pembuluh darah masih menjadi salah satu penyebab kematian tertinggi di Indonesia. Namun, sebagian besar kasus serangan jantung sebenarnya dapat dicegah dengan modifikasi gaya hidup sehat.",
      "Pertama, batasi konsumsi garam dan makanan olahan ber-natrium tinggi. Konsumsi sodium berlebih dapat memicu hipertensi yang memperberat kerja otot jantung.",
      "Kedua, rutin melakukan aktivitas fisik aerobik sedang minimal 30 menit sehari, seperti jalan cepat, bersepeda, atau berenang.",
      "Ketiga, perbanyak asupan serat alami dari buah-buahan segar, sayuran hijau, dan kacang-kacangan. Serat membantu mengikat kolesterol jahat (LDL) di usus sebelum diserap pembuluh darah.",
      "Terakhir, lakukan pemeriksaan berkala (Medical Check-Up) seperti cek tekanan darah, kadar gula darah, dan profil lipid kolesterol di Poliklinik Jantung RSU Tangsel Care.",
    ],
  },
  {
    id: 3,
    slug: "fasilitas-radiologi-mri-terbaru-rsu-tangsel-care",
    title: "Fasilitas Radiologi & MRI Terbaru RSU Tangsel Care Berteknologi Rendah Radiasi",
    date: "05 Agustus 2026",
    category: "Fasilitas Medis",
    author: "Tim Medis Radiologi",
    readTime: "3 menit baca",
    summary:
      "Peningkatan kualitas diagnostik medis cepat dan akurat dengan teknologi radiologi canggih dan kenyamanan ekstra untuk pasien.",
    content: [
      "RSU Tangsel Care kembali memperkuat mutu pelayanan kesehatan dengan menghadirkan perangkat Radiologi Digital X-Ray dan MRI 1.5 Tesla generasi terbaru.",
      "Fasilitas baru ini dirancang khusus dengan dosis radiasi minimal namun menghasilkan citra pencitraan medis dengan resolusi ultra-tinggi. Hal ini sangat membantu dokter spesialis dalam mendeteksi kelainan organ dalam, saraf, maupun jaringan lunak secara presisi.",
      "Pemeriksaan radiologi beroperasi 24 Jam untuk melayani kebutuhan pasien IGD, Rawat Inap, maupun rujukan poliklinik rawat jalan.",
      "Bagi pasien yang memerlukan pemeriksaan pencitraan medis, silakan berkonsultasi dengan dokter spesialis di Poliklinik RSU Tangsel Care untuk mendapatkan pengantar rujukan radiologi.",
    ],
  },
  {
    id: 4,
    slug: "pentingnya-imunisasi-rutin-untuk-tumbuh-kembang-anak",
    title: "Pentingnya Imunisasi Rutin untuk Tumbuh Kembang Anak",
    date: "28 Juli 2026",
    category: "Edukasi Kesehatan",
    author: "dr. Mega Andini, Sp.A",
    readTime: "4 menit baca",
    summary:
      "Panduan lengkap jadwal vaksinasi dan imunisasi dasar anak untuk membangun daya tahan tubuh optimal melawan infeksi berbahaya.",
    content: [
      "Imunisasi merupakan investasi kesehatan terbaik yang dapat diberikan orang tua kepada anak sejak dini. Vaksin bekerja melatih sistem kekebalan tubuh anak agar kebal terhadap ancaman penyakit menular.",
      "Jadwal imunisasi dasar nasional meliputi vaksin Hepatitis B, BCG, Polio, DPT-HB-Hib, serta Campak-Rubella (MR).",
      "Poliklinik Anak RSU Tangsel Care melayani konsultasi tumbuh kembang anak serta pemberian imunisasi lengkap yang ditangani langsung oleh dokter spesialis anak.",
    ],
  },
];
