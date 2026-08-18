"use client";

/**
 * Detail Baca Berita & Artikel — RSU Tangsel Care
 * Dilengkapi Sidebar Kanan untuk membaca berita lainnya.
 */

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES } from "@/lib/articles-data";
import { buttonVariants } from "@/components/ui/button";

export default function BeritaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const articleId = parseInt(resolvedParams.id, 10);
  const article = ARTICLES.find((a) => a.id === articleId);

  if (!article) {
    notFound();
  }

  // Artikel lain untuk sidebar kanan
  const otherArticles = ARTICLES.filter((a) => a.id !== articleId);

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      style={{ maxWidth: "var(--container-max)" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Beranda</Link>
        <span>/</span>
        <Link href="/berita" className="hover:text-foreground">Berita &amp; Artikel</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">{article.title}</span>
      </div>

      {/* Grid Utama: Artikel (Kiri 2 Kolom) + Sidebar (Kanan 1 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Konten Bacaan Lengkap */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3 border-b border-border pb-6">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-semibold px-2.5 py-0.5 bg-primary/10 text-primary rounded-xs">
                {article.category}
              </span>
              <span>•</span>
              <span>{article.date}</span>
              <span>•</span>
              <span>{article.readTime}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight tracking-tight">
              {article.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Ditulis oleh: <span className="font-semibold text-foreground">{article.author}</span>
            </p>
          </div>

          {/* Paragraf Bacaan */}
          <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
            {article.content.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Footer Aksi */}
          <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <Link href="/berita" className={buttonVariants({ variant: "outline", size: "sm" })}>
              &larr; Kembali ke Daftar Berita
            </Link>
          </div>
        </div>

        {/* Sidebar Kanan: Berita & Artikel Lainnya */}
        <div className="space-y-4">
          <div className="p-5 border border-border rounded-md bg-background shadow-2xs space-y-4 sticky top-20">
            <h2 className="text-base font-bold text-foreground border-b border-border pb-2 tracking-tight">
              Berita &amp; Artikel Lainnya
            </h2>
            <div className="space-y-4">
              {otherArticles.map((item) => (
                <div key={item.id} className="space-y-1.5 pb-3 border-b border-border/60 last:border-0 last:pb-0">
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-muted text-primary rounded">
                    {item.category}
                  </span>
                  <Link href={`/berita/${item.id}`}>
                    <h3 className="text-sm font-semibold text-foreground hover:text-primary transition-colors leading-snug cursor-pointer">
                      {item.title}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-muted-foreground">{item.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
