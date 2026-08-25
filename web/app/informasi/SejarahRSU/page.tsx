"use client";

/**
 * Halaman Sejarah RSU Kota Tangerang Selatan (/informasi/SejarahRSU)
 * Menampilkan sejarah singkat RSU Tangsel beserta daftar direktur yang pernah menjabat
 * dalam bentuk carousel horizontal otomatis.
 */

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const DIREKTUR = [
  {
    nama: "drg. Hj. Ida Lidia",
    periode: "2010 – Januari 2011",
    inisial: "IL",
  },
  {
    nama: "drg. Yantie Sari",
    periode: "Januari 2011 – Januari 2012",
    inisial: "YS",
  },
  {
    nama: "Hj. Neng Ulfah, S.Sos, Msi",
    periode: "Januari 2012 – Desember 2013",
    inisial: "NU",
  },
  {
    nama: "drg. Hj. Maya Mardiana, MARS",
    periode: "Desember 2013 – Januari 2017",
    inisial: "MM",
  },
  {
    nama: "dr. Suhara Manullang, M.Kes",
    periode: "Januari 2017 – Juli 2018",
    inisial: "SM",
  },
  {
    nama: "dr. Allin Hendalin Mahdaniar (Plt)",
    periode: "2018 – Oktober 2019",
    inisial: "AH",
  },
  {
    nama: "dr. Umi Kulsum, M.K.M (Plt)",
    periode: "Oktober 2019 – Mei 2020",
    inisial: "UK",
  },
  {
    nama: "dr. Umi Kulsum, M.K.M",
    periode: "Mei 2020 – Sekarang",
    inisial: "UK",
    current: true,
  },
];

// Duplikasi untuk infinite scroll
const DUPLIKASI = [...DIREKTUR, ...DIREKTUR, ...DIREKTUR];

export default function SejarahRSUPage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef<number>(0);

  useEffect(() => {
    const SPEED = 0.6; // piksel per frame

    const animate = () => {
      const track = trackRef.current;
      if (!track) return;

      posRef.current += SPEED;

      // Reset setelah 1/3 scroll (segmen pertama)
      const oneThird = track.scrollWidth / 3;
      if (posRef.current >= oneThird) {
        posRef.current = 0;
      }

      track.style.transform = `translateX(-${posRef.current}px)`;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    // Pause saat hover
    const container = trackRef.current?.parentElement;
    const pause = () => cancelAnimationFrame(animRef.current);
    const resume = () => {
      animRef.current = requestAnimationFrame(animate);
    };
    container?.addEventListener("mouseenter", pause);
    container?.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(animRef.current);
      container?.removeEventListener("mouseenter", pause);
      container?.removeEventListener("mouseleave", resume);
    };
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* ─── Breadcrumb ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-8">
          <Link href="/" className="hover:text-teal-700">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/informasi" className="hover:text-teal-700">
            Informasi Publik
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Sejarah RSU</span>
        </div>

        {/* ─── Judul ──────────────────────────────────────────────── */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
          Sejarah RSU Kota Tangerang Selatan
        </h1>
        <div className="w-16 h-1 rounded-full bg-teal-600 mb-8" />

        {/* ─── Paragraf Latar Belakang ────────────────────────────── */}
        <div className="prose prose-gray max-w-none text-gray-700 text-[15px] leading-relaxed space-y-4 mb-10">
          <p>
            Kota Tangerang Selatan merupakan daerah otonom yang terbentuk pada
            tanggal <strong>26 November 2008</strong>, berdasarkan Undang-undang
            Nomor 51 Tahun 2008 tentang pembentukan Kota Tangerang Selatan.
            Pembentukan daerah otonom tersebut yang merupakan pemekaran dari
            Kabupaten Tangerang.
          </p>
          <p>
            Kota Tangerang Selatan memiliki 7 Kecamatan, luas wilayah 147,19
            km² yang merupakan dataran rendah dengan letak ketinggian dari
            permukaan laut 44 m. Kota Tangerang Selatan adalah kota yang batas
            wilayah sebelah timur berbatasan langsung dengan Kota Jakarta Selatan
            Provinsi DKI Jakarta, batas wilayah sebelah selatan berbatasan
            dengan Kota Depok dan Kabupaten Bogor Provinsi Jawa Barat, sebelah
            barat berbatasan dengan Kecamatan Cisauk, Kecamatan Pagedangan,
            Kecamatan Kelapa Dua Kabupaten Tangerang dan sebelah utara dengan
            Kecamatan Ciledug Kota Tangerang.
          </p>
          <p>
            Dalam upaya mengatasi permasalahan kesehatan dan meningkatkan derajat
            kesehatan masyarakat Kota Tangerang Selatan, yaitu dengan memperbanyak
            fasilitas pelayanan kesehatan di wilayah Kota Tangerang Selatan.
            Kota Tangerang Selatan memiliki 29 Puskesmas{" "}
            <em>(Sumber: Kepwal no. 440/kep.122-HUK/2018)</em> yang memberikan
            pelayanan kesehatan khususnya masyarakat Kota Tangerang Selatan.
            Namun belum sepenuhnya dirasakan dan belum memadai untuk masyarakat
            Kota Tangerang Selatan, dimana kasus rujukan ke Rumah Sakit cukup
            tinggi, sementara jarak Rumah Sakit Pemerintah dari Kota Tangerang
            Selatan relatif jauh (seperti: RSUP Fatmawati, RSCM, dll).
          </p>
        </div>
      </div>

      {/* ─── Foto RSU ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          <Image
            src="/gambarrsu.png"
            alt="Gedung RSU Kota Tangerang Selatan"
            width={1200}
            height={600}
            className="w-full object-cover"
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-6 py-4">
            <p className="text-white text-sm font-medium">
              Gedung RSU Kota Tangerang Selatan
            </p>
          </div>
        </div>
      </div>

      {/* ─── Paragraf Operasional ────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-gray max-w-none text-gray-700 text-[15px] leading-relaxed space-y-4 mb-10">
          <p>
            Berdasarkan kondisi tersebut Pemerintah Kota Tangerang Selatan pada
            awal beroperasi (<strong>07 April 2010</strong>) sampai dengan Maret
            2012, RSU Kota Tangerang Selatan menggunakan bangunan sementara di
            wilayah Puskesmas Pamulang Jalan Surya Kencana No 01 Pamulang yang
            diresmikan oleh Gubernur Banten, Hj. Ratu Atut Chosiyah pada tanggal
            07 April 2010 yang bertepatan dengan Hari Kesehatan Sedunia dengan
            nama RSUD As-Sholihin.
          </p>
          <p>
            RSU Kota Tangerang Selatan telah menjadi SKPD dengan Peraturan Daerah
            Nomor 06 Tahun 2010 tentang Organisasi Perangkat Daerah Kota
            Tangerang Selatan.
          </p>
        </div>

        {/* ─── Judul Carousel ─────────────────────────────────────── */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            Direktur yang Pernah Menjabat
          </h2>
          <p className="text-sm text-gray-500">
            RSU Kota Tangerang Selatan · 2010 s/d Sekarang
          </p>
          <div className="w-12 h-1 rounded-full bg-teal-600 mt-3" />
        </div>
      </div>

      {/* ─── Carousel Direktur ───────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="w-full overflow-hidden pb-2" style={{ cursor: "default" }}>
          <div ref={trackRef} className="flex gap-5 will-change-transform" style={{ width: "max-content" }}>
            {DUPLIKASI.map((d, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-60 rounded-2xl border border-gray-100 bg-white shadow-md px-5 py-6 flex flex-col items-center text-center"
                style={{ boxShadow: "0 2px 16px 0 rgba(0,0,0,0.07)" }}
              >
                {/* Avatar */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 ${
                    d.current ? "bg-teal-600" : "bg-gray-400"
                  }`}
                >
                  {d.inisial}
                </div>

                {/* Badge Direktur Saat Ini */}
                {d.current && (
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wide bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2.5 py-0.5 mb-2">
                    Direktur Saat Ini
                  </span>
                )}

                <p className="text-sm font-bold text-gray-900 leading-snug mb-1">
                  {d.nama}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">{d.periode}</p>
              </div>
            ))}
          </div>
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
