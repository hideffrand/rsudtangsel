/**
 * HealthAccessSection — RSU Tangsel Care
 * Banner CTA: Akses Layanan Kesehatan Terpadu Kapan Saja.
 * Menampilkan fasilitas unggulan (rawat jalan, IGD, rawat inap) + CTA pendaftaran.
 */

import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Hospital, Siren, BedDouble } from "lucide-react";

const FACILITIES = [
  {
    id: "rawat-jalan",
    title: "Poliklinik Rawat Jalan",
    desc: "Konsultasi spesialis Penyakit Dalam, Anak, Kandungan, Jantung, Bedah, dan lainnya.",
    icon: <Hospital className="w-6 h-6 text-amber-400" />,
    badge: "Spesialis",
    badgeBg: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  },
  {
    id: "igd",
    title: "IGD 24 Jam",
    desc: "Penanganan cepat kondisi darurat medis & kecelakaan nonstop oleh tim dokter emergency.",
    icon: <Siren className="w-6 h-6 text-rose-400" />,
    badge: "24/7 Nonstop",
    badgeBg: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  },
  {
    id: "rawat-inap",
    title: "Rawat Inap & ICU",
    desc: "Ruang VIP hingga Kelas 3, serta ICU/NICU/PICU dengan pemantauan medis intensif.",
    icon: <BedDouble className="w-6 h-6 text-emerald-400" />,
    badge: "Intensif",
    badgeBg: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  },
];

export function HealthAccessSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-primary to-slate-900 text-white p-8 sm:p-12 shadow-2xl my-12 border border-slate-800">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4 mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-semibold tracking-wide border border-amber-400/20">
          Layanan Medis Prioritas
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
          Akses Layanan Kesehatan Terpadu Kapan Saja
        </h2>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Dapatkan penanganan medis terbaik dengan fasilitas lengkap dan tim dokter spesialis yang siap melayani Anda dan keluarga 24/7.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {FACILITIES.map((item) => (
          <Card
            key={item.id}
            id={item.id}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-700/60 text-white transition-all hover:-translate-y-1 hover:border-slate-500"
          >
            <CardBody className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
                  {item.icon}
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${item.badgeBg}`}>
                  {item.badge}
                </span>
              </div>
              <h3 className="font-semibold text-lg text-white">{item.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          href="/daftar-online"
          className={buttonVariants({
            size: "lg",
            className: "w-full sm:w-auto bg-yellow-100 text-slate-950 hover:bg-yellow-200 font-bold px-8 shadow-lg transition-all hover:scale-105 border-0",
          })}
        >
          Daftar Antrian Online Sekarang
        </Link>
        <Link
          href="/kontak"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "w-full sm:w-auto bg-white text-slate-900 border-white hover:bg-slate-100 hover:text-slate-900 font-bold px-8 shadow-md transition-all hover:scale-105",
          })}
        >
          Hubungi Call Center
        </Link>
      </div>
    </section>
  );
}
