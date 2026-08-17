"use client";

/**
 * Layanan Kesehatan — RSU Tangsel Care
 * - Paket Medical Check Up (MCU)
 * - Layanan Spesialis & Fasilitas Medis Terpadu
 */

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { mcuPackagesApi, McuPackage } from "@/services/mcuPackages";

interface McuDisplay {
  id: number;
  name: string;
  price: string;
  desc: string;
  features: string[];
}

const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;

const toMcuDisplay = (pkg: McuPackage): McuDisplay => ({
  id: pkg.id,
  name: pkg.name,
  price: formatPrice(pkg.price),
  desc: pkg.description,
  features: pkg.items.map((item) => item.name),
});

function LayananKesehatanContent() {
  const searchParams = useSearchParams();
  const selectedMcu = searchParams.get("mcu") || "";
  // Derive the active filter: URL param unless the user explicitly clears it.
  const [cleared, setCleared] = useState(false);
  const filterMcu = cleared ? "" : selectedMcu;
  const [mcuList, setMcuList] = useState<McuDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    mcuPackagesApi
      .getAll()
      .then((packages) => {
        if (!cancelled) setMcuList(packages.map(toMcuDisplay));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMcuList = filterMcu
    ? mcuList.filter((p) => p.name.toLowerCase().includes(filterMcu.toLowerCase()))
    : mcuList;

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
          Fasilitas pemeriksaan kesehatan berkala RSU Tangsel Care dengan {loading ? "berbagai" : mcuList.length} paket MCU pilihan dan pelayanan medis terpadu.
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
              onClick={() => setCleared(true)}
              className="text-xs text-primary font-semibold hover:underline border border-primary/20 px-3 py-1.5 rounded bg-primary/5"
            >
              Tampilkan Semua {mcuList.length} Paket MCU
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat paket MCU...</p>
        ) : error ? (
          <p className="text-sm text-destructive">
            Gagal memuat paket MCU. Pastikan backend API tersedia.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMcuList.map((pkg) => (
              <Card key={pkg.id} className="hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between">
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
        )}
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
