"use client";

/**
 * Halaman Full Detail Informasi — RSU Tangsel Care (/informasi/[slug])
 * Menampilkan rincian penuh, persyaratan, dan alur pelayanan dalam 1 halaman full.
 */

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INFO_TOPICS } from "@/lib/informasi-data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default function InformasiDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const topic = INFO_TOPICS.find((t) => t.slug === resolvedParams.slug);

  if (!topic) {
    notFound();
  }

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      style={{ maxWidth: "var(--container-max)" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Beranda</Link>
        <span>/</span>
        <Link href="/informasi" className="hover:text-foreground">Informasi Publik</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{topic.title}</span>
      </div>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-lg bg-primary/10 border border-primary/20 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{topic.icon}</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {topic.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Diperbarui pada: <span className="font-semibold text-foreground">{topic.lastUpdated}</span>
            </p>
          </div>
        </div>
        <p className="text-sm sm:text-base text-foreground/90 leading-relaxed pt-1">
          {topic.overview}
        </p>
      </div>

      {/* Full Content Sections */}
      <div className="space-y-6">
        {topic.sections.map((sec, idx) => (
          <Card key={idx} className="shadow-xs border-border">
            <CardHeader>
              <h2 className="text-lg font-bold text-primary">{sec.heading}</h2>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2.5">
                {sec.points.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-3 text-sm text-foreground/90 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
        <Link href="/informasi" className={buttonVariants({ variant: "outline", size: "sm" })}>
          &larr; Kembali ke Informasi Publik
        </Link>
      </div>
    </div>
  );
}
