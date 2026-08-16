"use client";

/**
 * Layanan Kesehatan — RSU Tangsel Care
 * - Paket Medical Check Up (MCU 10 Jenis)
 * - Layanan Spesialis & Fasilitas Medis Terpadu
 */

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const MCU_PACKAGES = [
  {
    name: "MCU Hemat",
    price: "Rp 250.000",
    desc: "Pemeriksaan kesehatan dasar hemat & efisien (Darah Rutin, Urin Rutin, Fisik Dokter Umum).",
    features: ["Pemeriksaan Fisik Dokter Umum", "Hematologi Rutin (Hb, Leukosit, Trombosit)", "Urine Lengkap"],
  },
  {
    name: "MCU Pelajar",
    price: "Rp 300.000",
    desc: "Khusus untuk syarat pendaftaran sekolah, kuliah, atau bebas narkoba.",
    features: ["Fisik & Visus Mata", "Tes Bebas Narkoba 5 Parameter", "Surat Keterangan Sehat Pelajar"],
  },
  {
    name: "MCU Pegawai",
    price: "Rp 450.000",
    desc: "Persyaratan tes kesehatan CPNS, BUMN, dan karyawan perusahaan.",
    features: ["Rontgen Thorax Digital", "Tes Bebas Narkoba 6 Parameter", "EKG Jantung Dasar", "Fisik Dokter"],
  },
  {
    name: "MCU Calon Pengantin",
    price: "Rp 650.000",
    desc: "Pemeriksaan pranikah (Premarital Check Up) untuk pasangan calon pengantin.",
    features: ["Golongan Darah & Rhesus", "Skrining Golongan Darah & Thalassemia", "HBsAg & HIV", "Skrining Kebidanan/Urologi"],
  },
  {
    name: "MCU ROHAJJ (Haji/Umroh)",
    price: "Rp 750.000",
    desc: "Pemeriksaan kesehatan lengkap dan vaksinasi istitha'ah untuk calon jemaah Haji dan Umroh.",
    features: ["Rontgen Dada & EKG Jantung", "Laboratorium Lengkap & Tes Kehamilan", "Vaksin Meningitis & Influenza"],
  },
  {
    name: "MCU Silver",
    price: "Rp 850.000",
    desc: "Paket skrining organ penting bagi dewasa muda.",
    features: ["Laboratorium Darah & Urine Lengkap", "Fungsi Hati & Ginjal (Ureum, Kreatinin)", "Profil Kolesterol & Gula Darah", "Rontgen Dada"],
  },
  {
    name: "MCU Gold",
    price: "Rp 1.350.000",
    desc: "Skrining kesehatan eksekutif menengah.",
    features: ["Seluruh Fasilitas MCU Silver", "USG Abdomen / Perut", "Treadmill Test Jantung", "Konsultasi Dokter Spesialis Penyakit Dalam"],
  },
  {
    name: "MCU Platinum",
    price: "Rp 2.100.000",
    desc: "Skrining komprehensif organ dalam & tumor marker.",
    features: ["Seluruh Fasilitas MCU Gold", "Tumor Marker (CEA & AFP)", "CT-Scan Thorax / USG Mammografi", "Pemeriksaan Mata & THT"],
  },
  {
    name: "MCU Titanium",
    price: "Rp 3.500.000",
    desc: "Paket kualitatif terlengkap VVIP RSU Tangsel Care.",
    features: ["Seluruh Fasilitas MCU Platinum", "MRI 1.5 Tesla organ pilihan", "Ekokardiografi Jantung", "Kamar Rawat Transit VVIP 1 Hari"],
  },
  {
    name: "MCU Jantung",
    price: "Rp 1.200.000",
    desc: "Skrining khusus kebugaran & potensi serangan jantung.",
    features: ["EKG Jantung 12 Lead", "Treadmill Stress Test", "Ekokardiografi USG Jantung", "Profil Lipid Lengkap & Konsultasi Spesialis Jantung"],
  },
];

function LayananKesehatanContent() {
  const searchParams = useSearchParams();
  const selectedMcu = searchParams.get("mcu") || "";
  const [filterMcu, setFilterMcu] = useState(selectedMcu);

  useEffect(() => {
    if (selectedMcu) setFilterMcu(selectedMcu);
  }, [selectedMcu]);

  const filteredMcuList = filterMcu
    ? MCU_PACKAGES.filter((p) => p.name.toLowerCase().includes(filterMcu.toLowerCase()))
    : MCU_PACKAGES;

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-12"
      style={{ maxWidth: "var(--container-max)" }}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Layanan Kesehatan &amp; Medical Check Up (MCU)
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Fasilitas pemeriksaan kesehatan berkala RSU Tangsel Care dengan 10 paket MCU pilihan dan pelayanan medis terpadu.
        </p>
      </div>

      {/* ── SECTION 1: MEDICAL CHECK UP (MCU) ───────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              Pemeriksaan Kesehatan Kualitatif
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Medical Check Up (MCU)
            </h2>
          </div>
          {filterMcu && (
            <button
              onClick={() => setFilterMcu("")}
              className="text-xs text-primary font-semibold hover:underline border border-primary/20 px-3 py-1.5 rounded bg-primary/5"
            >
              Tampilkan Semua 10 Paket MCU
            </button>
          )}
        </div>

        {/* Grid 10 Paket MCU */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMcuList.map((pkg, idx) => (
            <Card key={idx} className="hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between">
              <CardHeader className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-primary">{pkg.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{pkg.desc}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-muted text-foreground rounded">
                  {pkg.price}
                </span>
              </CardHeader>
              <CardBody className="space-y-4 pt-2">
                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/60 pt-3">
                  <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">Fasilitas Pemeriksaan:</p>
                  {pkg.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex gap-2 items-center">
                      <span className="text-primary font-bold">•</span>
                      <span className="text-foreground/90">{feat}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/daftar-online"
                  className={buttonVariants({ variant: "primary", size: "sm", className: "w-full mt-2" })}
                >
                  Daftar Paket {pkg.name}
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* ── SECTION 2: FASILITAS MEDIS UTAMA RS ──────────────────────────── */}
      <section className="space-y-6 pt-4 border-t border-border">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          Fasilitas Layanan Medis Terpadu
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              id: "rawat-jalan",
              title: "Poliklinik Rawat Jalan Spesialis",
              desc: "Konsultasi spesialis Penyakit Dalam, Anak, Kandungan, Jantung, Gigi, Mata, THT, Bedah, dan Orthopedi.",
              icon: "🏥",
            },
            {
              id: "igd",
              title: "Instalasi Gawat Darurat (IGD 24 Jam)",
              desc: "Penanganan kondisi gawat darurat medis dan kecelakaan 24 jam nonstop dengan tim dokter emergency.",
              icon: "🚨",
            },
            {
              id: "rawat-inap",
              title: "Rawat Inap & Intensive Care (ICU)",
              desc: "Ruang perawatan VVIP, VIP, Kelas 1-3, serta ICU/NICU/PICU lengkap dengan pemantauan medis 24 jam.",
              icon: "🛏️",
            },
          ].map((item, idx) => (
            <Card key={idx} id={item.id} className="shadow-2xs">
              <CardBody className="space-y-3">
                <div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center text-xl">
                  {item.icon}
                </div>
                <h3 className="font-bold text-base text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                <Link
                  href="/daftar-online"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "w-full mt-2" })}
                >
                  Daftar Antrian Online
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function LayananKesehatanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Memuat Layanan Kesehatan...</div>}>
      <LayananKesehatanContent />
    </Suspense>
  );
}
