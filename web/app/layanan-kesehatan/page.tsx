"use client";

/**
 * Layanan Kesehatan — RSU Tangsel Care
 */

import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { Card, CardBody } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default function LayananKesehatanPage() {
  const { t } = useI18n();

  const services = [
    {
      title: "Rawat Jalan / Poliklinik Spesialis",
      desc: "Layanan konsultasi dan pemeriksaan medis oleh dokter spesialis (Poli Umum, Gigi, Anak, Kandungan, Penyakit Dalam, Jantung, Mata, dan Orthopedi).",
      icon: "🏥",
    },
    {
      title: "Instalasi Gawat Darurat (IGD 24 Jam)",
      desc: "Layanan medis penanganan darurat 24 jam dengan tim dokter emergency dan penanganan trauma cepat tanggap.",
      icon: "🚨",
    },
    {
      title: "Rawat Inap & ICU",
      desc: "Kamar perawatan kelas VVIP, VIP, Kelas 1, 2, 3, serta ruang perawatan intensif (ICU/NICU/PICU) yang nyaman dan higienis.",
      icon: "🛏️",
    },
    {
      title: "Laboratorium & Radiologi 24 Jam",
      desc: "Pemeriksaan darah lengkap, swab, X-Ray digital, CT-Scan, dan USG 4D dengan hasil akurat dan cepat.",
      icon: "🔬",
    },
    {
      title: "Farmasi & Apotik 24 Jam",
      desc: "Penyediaan obat-obatan resep dokter dan alat kesehatan yang terjamin keaslian dan ketersediaannya.",
      icon: "💊",
    },
    {
      title: "Konsultasi Chat Dokter",
      desc: "Konsultasi medis ringan dari rumah via WhatsApp dengan dokter pendamping RSU Tangsel Care.",
      icon: "💬",
      link: "/chat",
    },
  ];

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      style={{ maxWidth: "var(--container-max)" }}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Layanan Kesehatan Terpadu
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          RSU Tangsel Care menyediakan fasilitas medis modern dan komprehensif untuk seluruh keluarga.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((item, idx) => (
          <Card key={idx} className="hover:border-primary/40 hover:shadow-sm transition-all">
            <CardBody className="space-y-3 flex flex-col h-full justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center text-2xl border border-primary/20">
                  {item.icon}
                </div>
                <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-3">
                {item.link ? (
                  <Link
                    href={item.link}
                    className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}
                  >
                    Buka Chat Dokter
                  </Link>
                ) : (
                  <Link
                    href="/daftar-online"
                    className={buttonVariants({ variant: "primary", size: "sm", className: "w-full" })}
                  >
                    Daftar Antrian Online
                  </Link>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
