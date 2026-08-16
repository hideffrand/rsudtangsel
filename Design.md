# Design.md
## UI/UX Design System — Sisi Pasien (Frontend)
### RSU Tangsel Care

**Ruang lingkup dokumen ini:** khusus sisi pasien (landing page/beranda + semua fitur pasien: daftar online, cek status, rawat jalan, chat dokter). Backoffice/staff di luar cakupan.

**Catatan asumsi teknis:** dokumen ini ditulis untuk **React (web)** — komponen, breakpoint, dan pola responsive di bawah berasumsi target rendering di browser (desktop + mobile web), bukan native mobile app. Kalau yang dimaksud memang React Native (aplikasi mobile terpisah dari web), sebagian bagian (breakpoint CSS, hover state, semantic HTML) perlu disesuaikan — konfirmasi dulu sebelum implementasi supaya gak salah arah.

---

## 1. Filosofi Desain

**Prinsip: biasa aja, bersih, dan familiar.** Ini bukan produk yang butuh identitas visual berani atau elemen "wow" — ini fasilitas kesehatan publik yang dipakai lintas usia dan latar belakang teknologi. Target: orang buka web ini, langsung ngerti harus ngapain, tanpa mikir soal desainnya sama sekali.

Referensi acuan konkret: **shadcn/ui** dan **Tailwind UI** — bukan sebagai tema visual yang ditiru mentah, tapi sebagai standar disiplin desain: skala spacing konsisten, tipografi sederhana (1 typeface, beberapa weight), warna netral dominan, warna brand dipakai sedikit dan sengaja, border radius kecil-menengah konsisten, shadow tipis, tanpa gradient dekoratif, tanpa glassmorphism, tanpa ilustrasi 3D/AI-generated look.

**Yang dihindari secara eksplisit** (ciri khas "AI generic" yang gak mau dipakai di sini):
- Gradient warna-warni sebagai background/tombol besar.
- Ilustrasi abstrak blob/3D generik.
- Font display tebal dramatis di setiap heading.
- Card dengan shadow besar melayang + border radius berlebihan (mis. `rounded-3xl` di semua elemen).
- Emoji sebagai pengganti ikon fungsional.
- Copy marketing-speak ("Solusi kesehatan masa depan Anda!") — pakai bahasa fungsional, jelas, langsung.
- Layout dengan terlalu banyak whitespace dekoratif tanpa fungsi (ruang kosong besar tanpa alasan struktural).

---

## 2. Design Tokens

### 2.1 Warna

Base warna netral (skala abu, gaya shadcn — bukan abu monoton, sedikit undertone dingin agar cocok sama teal brand):

| Token | Hex | Pemakaian |
|---|---|---|
| `--background` | `#FFFFFF` | Background utama |
| `--foreground` | `#1C2626` | Teks utama (bukan hitam pekat #000) |
| `--muted` | `#F1F4F4` | Background section sekunder, card netral |
| `--muted-foreground` | `#5C6B6B` | Teks sekunder, caption, placeholder |
| `--border` | `#E2E8E8` | Border, divider |

Warna brand (dari logo RSU Tangsel Care), dipakai **selektif**, bukan dominan:

| Token | Hex | Pemakaian |
|---|---|---|
| `--primary` | `#0E7D80` | Tombol utama, link aktif, ikon fungsional, elemen interaktif |
| `--primary-foreground` | `#FFFFFF` | Teks di atas primary |
| `--primary-hover` | `#0A5F61` | Hover/active state |
| `--accent` | `#E63946` | **Sangat terbatas** — hanya untuk badge darurat/urgent, bukan untuk dekorasi |

Warna status (independen dari warna brand, standar industri agar gak ambigu):

| Token | Hex | Pemakaian |
|---|---|---|
| `--success` | `#16A34A` | Status konfirmasi, berhasil |
| `--warning` | `#D97706` | Status pending, perlu perhatian |
| `--destructive` | `#DC2626` | Error, batal, gagal |

**Rasio pemakaian target di satu halaman:** ~85% netral (putih/abu/teks), ~10% primary (teal), ~5% status/accent gabungan. Kalau satu halaman kelihatan "penuh warna", itu tanda desain melenceng dari prinsip.

### 2.2 Tipografi

Satu typeface untuk seluruh produk (bukan kombinasi display+body yang kontras) — konsisten dengan pendekatan shadcn/Tailwind UI:

- **Font:** Inter (atau sistem font stack sebagai fallback: `-apple-system, "Segoe UI", Roboto, sans-serif`) — dipilih karena netral, sangat teruji untuk keterbacaan di berbagai ukuran layar dan kondisi pengguna (termasuk lansia), dan sudah standar di banyak produk kesehatan/pemerintahan digital.
- **Skala ukuran** (mobile-first, base 16px — bukan 14px, karena target lansia butuh baseline lebih besar dari default umum):

| Token | Ukuran | Pemakaian |
|---|---|---|
| `text-xs` | 13px | Caption, label kecil (dipakai minim) |
| `text-sm` | 14px | Teks sekunder |
| `text-base` | 16px | Body text default |
| `text-lg` | 18px | Body text besar (opsi user, lihat §5) |
| `text-xl` | 22px | Subheading |
| `text-2xl` | 28px | Heading section |
| `text-3xl` | 34px | Heading halaman/hero (dipakai terbatas, hanya beranda) |

- **Weight:** Regular (400) untuk body, Medium (500) untuk label/tombol, SemiBold (600) untuk heading. Hindari Bold (700+) berlebihan di banyak elemen — bikin halaman berisik.
- **Line-height:** 1.5 untuk body text (bukan 1.2 yang rapat) — penting untuk pembaca lansia/low vision.

### 2.3 Spacing & Layout

Skala spacing 4px-based (standar Tailwind): `4, 8, 12, 16, 24, 32, 48, 64px`. Konsisten dipakai untuk padding, gap, margin — jangan pakai nilai bebas di luar skala ini.

- **Border radius:** `--radius: 8px` untuk button/input, `12px` untuk card. Tidak lebih dari itu — hindari radius besar (`24px+`) yang kesan "playful/AI generated".
- **Shadow:** tipis dan fungsional saja — `0 1px 2px rgba(0,0,0,0.05)` untuk card, dipakai untuk membedakan layer, bukan efek dekoratif "floating".
- **Container max-width:** 1200px di desktop, dengan padding horizontal 16px (mobile) → 24px (tablet) → 32px (desktop).

### 2.4 Breakpoint Responsive

| Breakpoint | Lebar | Target |
|---|---|---|
| `sm` | ≥640px | Mobile besar / landscape |
| `md` | ≥768px | Tablet |
| `lg` | ≥1024px | Desktop kecil |
| `xl` | ≥1280px | Desktop |

**Pendekatan mobile-first wajib** — desain & kode dimulai dari layout mobile (≤640px), baru di-scale up. Mayoritas pasien akses dari HP.

---

## 3. Komponen (Inventaris, gaya shadcn/ui)

Semua komponen di bawah mengikuti pola shadcn/ui: composable, accessible by default (built di atas Radix primitives kalau pakai React), styled minimal via Tailwind utility classes, bukan komponen custom bergaya berat.

| Komponen | Dipakai di | Catatan |
|---|---|---|
| `Button` (primary/outline/ghost) | CTA daftar online, submit form, aksi sekunder | Min height 44px (target tap area, lihat §5) |
| `Input`, `Select`, `DatePicker` | Form pendaftaran, OTP | Label selalu visible di atas input, bukan placeholder-only |
| `Card` | Ringkasan booking, hasil pencarian dokter | Border tipis + shadow minimal, bukan shadow besar |
| `Badge` | Status booking (`pending`/`confirmed`/`cancelled`) | Warna status token, bukan warna brand |
| `Stepper`/`Progress` | Alur multi-step daftar online | Angka langkah + label teks, bukan hanya ikon |
| `Dialog`/`Sheet` | Konfirmasi, disclaimer chat dokter | Sheet (bottom sheet) di mobile, Dialog di desktop |
| `Toast` | Notifikasi hasil aksi (booking berhasil, OTP terkirim) | Auto-dismiss dengan opsi close manual |
| `Tabs` | Toggle bahasa, kategori info | Underline style, bukan pill besar |
| `Skeleton` | Loading state jadwal dokter/data | Bukan spinner generik — lebih informatif untuk konten list |

**Prinsip pemilihan komponen:** kalau ada padanan langsung di shadcn/ui, pakai pola itu (props, struktur, naming) sebagai baseline, lalu sesuaikan token warna/spacing ke sistem di atas. Jangan reinvent pattern yang sudah baku.

---

## 4. Multi-Bahasa (i18n)

- **Bahasa default:** Indonesia. **Bahasa kedua:** Inggris (untuk turis/ekspat/keluarga pasien asing).
- Toggle bahasa **selalu terlihat** di header (bukan disembunyikan di menu/footer) — ikon globe + label kode bahasa (`ID` / `EN`), posisi kanan atas konsisten di semua halaman.
- **Semua string UI di-eksternalisasi** (tidak hardcode di komponen) — struktur key per fitur, misal:
  ```
  {
    "booking.step1.title": "Pilih Poli",
    "booking.step1.title_en": "Select Department"
  }
  ```
- Format tanggal, jam, dan angka **mengikuti locale aktif** (mis. `dd/mm/yyyy` untuk ID, format 24 jam tetap dipakai di kedua bahasa karena lebih umum di konteks RS Indonesia — hindari AM/PM yang bisa membingungkan lansia).
- Istilah medis/administratif (nama poli, jenis layanan) punya terjemahan tervalidasi — bukan hasil translate mesin mentah, karena berpengaruh langsung ke pemahaman pasien soal layanan kesehatan.
- Disclaimer keselamatan (chat dokter, arahan darurat) **wajib tersedia di kedua bahasa** dengan makna identik, bukan hanya terjemahan literal.

---

## 5. Aksesibilitas — Lansia & Disabilitas

Target standar: **WCAG 2.1 level AA** minimum, dengan penyesuaian tambahan khusus untuk populasi lansia (mayoritas pengguna fasilitas kesehatan).

### 5.1 Untuk Pengguna Lansia
- **Base font 16px, dengan kontrol ukuran teks** — tombol A-/A+ di header untuk perbesar teks tanpa merusak layout (bukan cuma andalkan zoom browser).
- **Target tap/klik minimal 44×44px** untuk semua elemen interaktif (tombol, link, checkbox) — sesuai rekomendasi WCAG & Apple/Google HIG, krusial untuk pengguna dengan tremor/motor control terbatas.
- **Kontras warna minimal 4.5:1** untuk teks normal, 3:1 untuk teks besar/UI component — semua kombinasi token warna di §2.1 divalidasi terhadap rasio ini sebelum dipakai (teal `#0E7D80` di atas putih perlu dicek ulang untuk teks kecil; kalau kurang, gunakan `--primary-hover` yang lebih gelap untuk teks).
- **Bahasa sederhana** — hindari istilah teknis/medis tanpa penjelasan, hindari singkatan tanpa keterangan (mis. "IGD" tetap ditulis lengkap sekali di awal: "IGD (Instalasi Gawat Darurat)").
- **Alur linear, satu aksi per layar** — hindari halaman dengan banyak pilihan sekaligus; proses multi-step (daftar online) dipecah per langkah dengan tombol "Kembali" selalu tersedia.
- **Konfirmasi eksplisit sebelum aksi penting** — dialog konfirmasi untuk batal booking, bukan aksi langsung tanpa jeda.

### 5.2 Untuk Pengguna dengan Disabilitas
- **Navigasi keyboard penuh** — semua elemen interaktif bisa diakses via Tab, urutan fokus logis mengikuti alur visual, **visible focus ring** jelas (bukan `outline: none` tanpa pengganti).
- **Screen reader support** — semantic HTML wajib (`<button>` bukan `<div onClick>`, `<label>` terhubung ke `<input>`, heading hierarchy `h1`→`h2`→`h3` konsisten), `aria-label` untuk ikon tanpa teks, `aria-live` untuk update dinamis (status booking, hasil OTP).
- **Reduced motion** — hormati `prefers-reduced-motion`; animasi transisi dibuat opsional/minim, tidak ada auto-play carousel atau animasi yang gak bisa dimatikan.
- **Alt text deskriptif** untuk semua gambar informatif (foto dokter, ikon layanan); gambar dekoratif diberi `alt=""` agar tidak mengganggu screen reader.
- **Form error yang jelas** — pesan error terhubung langsung ke field terkait (`aria-describedby`), bukan hanya warna merah di border (karena buta warna) — sertakan ikon + teks.
- **Tidak bergantung pada warna semata** — status booking pakai warna + label teks + ikon (bukan cuma badge warna), penting untuk pengguna buta warna.

---

## 6. Struktur Halaman & Wireframe (Ringkas)

### 6.1 Beranda (Landing Page)

```
┌─────────────────────────────────────────┐
│ [Logo]      Beranda  Layanan  Info  [ID/EN] │  ← header sticky, putih, border-bottom tipis
├─────────────────────────────────────────┤
│                                           │
│   RSU Tangsel Care                       │  ← heading, bukan hero besar dramatis
│   Merawat Sepenuh Hati                   │
│                                           │
│   [ Daftar Online ]  [ Cek Status ]      │  ← 2 CTA utama, primary + outline
│                                           │
├─────────────────────────────────────────┤
│  Layanan Cepat (grid 2x2 mobile / 4x1 desktop) │
│  [Daftar Online] [Rawat Jalan] [Chat Dokter] [Info Darurat] │
├─────────────────────────────────────────┤
│  Info Praktis: jam layanan, lokasi, kontak darurat (teks, bukan ilustrasi) │
└─────────────────────────────────────────┘
```

Prinsip: beranda **fungsional**, bukan landing page marketing. Prioritas: dua CTA utama langsung terlihat tanpa scroll (above the fold) di mobile.

### 6.2 Daftar Online (Multi-step)

```
[ Stepper: ①Poli — ②Dokter&Jadwal — ③Data Diri — ④Konfirmasi ]

Step aktif ditampilkan penuh, step lain collapsed/dim.
Tombol "Lanjut" (primary) + "Kembali" (ghost) selalu di bawah, sticky di mobile.
```

### 6.3 Cek Status / Rawat Jalan

List sederhana berbasis `Card`: satu card per booking/kunjungan, isi status `Badge`, tanggal, poli, tombol aksi kontekstual ("Batalkan" / "Lihat Detail"). Tanpa tabel data padat (tidak ramah mobile/lansia).

### 6.4 Chat Dokter

- Entry point: tombol besar di beranda → buka `Sheet`/redirect WhatsApp.
- Disclaimer wajib tampil sebagai `Dialog` sebelum chat dimulai, butuh klik "Saya Mengerti" untuk lanjut (bukan auto-dismiss).

---

## 7. Checklist Kualitas Sebelum Rilis

- [ ] Semua breakpoint (sm/md/lg/xl) dicek manual, bukan cuma resize browser sekilas.
- [ ] Kontras warna divalidasi pakai tool (mis. WebAIM Contrast Checker) untuk tiap kombinasi teks/background.
- [ ] Navigasi keyboard end-to-end dicoba tanpa mouse sama sekali.
- [ ] Screen reader (VoiceOver/NVDA) dicoba minimal untuk alur daftar online.
- [ ] Toggle bahasa ID/EN dicek konsisten di semua halaman, termasuk pesan error dan disclaimer.
- [ ] Font size dinaikkan manual (browser zoom 200%) — layout tidak boleh rusak/overlap.
- [ ] `prefers-reduced-motion` dites, animasi mati dengan benar.
- [ ] Tap target diukur — tidak ada elemen interaktif di bawah 44px.
