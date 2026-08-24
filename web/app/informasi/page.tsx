"use client";

/**
 * Halaman Utama Informasi - RSU Tangsel Care
 * Menampilkan 4 Kartu Informasi Utama. Klik pada kartu akan membuka Halaman Full Detail (/informasi/[slug]).
 */

import Link from "next/link";
import { INFO_TOPICS } from "@/lib/informasi-data";
import { Card, CardBody } from "@/components/ui/card";

export default function InformasiPage() {
  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8"
      style={{ maxWidth: "var(--container-max)" }}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Informasi &amp; Standar Pelayanan Publik
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Panduan resmi persyaratan pendaftaran, pembuatan dokumen medis, dan alur pelayanan pasien RSU Tangsel Care.
        </p>
      </div>

      {/* Grid 4 Kartu Informasi Utama (Gambar 1 Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {INFO_TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            href={`/informasi/${topic.slug}`}
            className="
              group flex flex-col justify-between p-6 border border-border rounded-lg
              bg-background hover:bg-muted/40 hover:border-primary/50 hover:shadow-md
              transition-all duration-200 cursor-pointer space-y-4
            "
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center text-2xl border border-primary/20">
                {topic.icon}
              </div>
              <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                {topic.title}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {topic.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Buka Selengkapnya</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ─── Kartu Sejarah RSU ──────────────────────────────────── */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-foreground mb-4">Tentang RSU Tangsel</h2>
        <Link
          href="/informasi/SejarahRSU"
          className="
            group flex flex-col justify-between p-6 border border-border rounded-lg
            bg-background hover:bg-muted/40 hover:border-primary/50 hover:shadow-md
            transition-all duration-200 cursor-pointer space-y-4 max-w-sm
          "
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center text-2xl border border-primary/20">
              🏥
            </div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
              Sejarah RSU Kota Tangerang Selatan
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Latar belakang pendirian, perjalanan operasional sejak 2010, dan daftar direktur yang pernah menjabat di RSU Kota Tangerang Selatan.
            </p>
          </div>
          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
            <span>Buka Selengkapnya</span>
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
