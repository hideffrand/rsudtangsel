"use client";

/**
 * Katalog Berita & Artikel — RSU Tangsel Care
 */

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { ARTICLES } from "@/lib/articles-data";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function BeritaPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const filteredArticles = ARTICLES.filter(
    (art) =>
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.category.toLowerCase().includes(search.toLowerCase()) ||
      art.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      style={{ maxWidth: "var(--container-max)" }}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Berita &amp; Artikel Kesehatan
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Informasi terkini seputar fasilitas RSU Tangsel Care, edukasi gaya hidup sehat, dan layanan medis.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="max-w-md">
        <Input
          id="search-berita"
          label="Cari Berita & Artikel"
          placeholder="Ketik kata kunci berita atau topik..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid Berita */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((art) => (
          <Card key={art.id} className="hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between">
            <CardBody className="space-y-3 flex flex-col justify-between h-full">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold px-2.5 py-0.5 bg-primary/10 text-primary rounded-xs">
                    {art.category}
                  </span>
                  <span>{art.date}</span>
                </div>
                <Link href={`/berita/${art.id}`}>
                  <h2 className="text-lg font-semibold text-foreground leading-snug hover:text-primary transition-colors cursor-pointer mt-1">
                    {art.title}
                  </h2>
                </Link>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {art.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium">
                  {art.readTime}
                </span>
                <Link
                  href={`/berita/${art.id}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Baca Selengkapnya &rarr;
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
