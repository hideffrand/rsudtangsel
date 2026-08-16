"use client";

/**
 * Beranda — RSU Tangsel Care
 * Design.md §6.1 — Fungsional, bukan landing page marketing
 * 2 CTA utama above the fold di mobile
 */

import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { buttonVariants } from "@/components/ui/button";
import { ARTICLES } from "@/lib/articles-data";

// ─── Ikon SVG inline (bukan emoji) ───────────────────────────────────────────

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function IconExclamation({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

// ─── Komponen utama ───────────────────────────────────────────────────────────

export default function HomePage() {
  const { t } = useI18n();

  const services = [
    {
      key: "register",
      href: "/daftar-online",
      icon: <IconCalendar className="w-6 h-6 text-primary" />,
      label: t("home.services.register"),
      desc: t("home.services.register_desc"),
    },
    {
      key: "outpatient",
      href: "/jadwal-dokter",
      icon: <IconClipboard className="w-6 h-6 text-primary" />,
      label: "Jadwal Dokter",
      desc: "Lihat jadwal praktek dan spesialisasi dokter",
    },
    {
      key: "chat",
      href: "/chat",
      icon: <IconChat className="w-6 h-6 text-primary" />,
      label: t("home.services.chat"),
      desc: t("home.services.chat_desc"),
    },
    {
      key: "emergency",
      href: "tel:02155551234",
      icon: <IconExclamation className="w-6 h-6 text-accent" />,
      label: t("home.services.emergency"),
      desc: t("home.services.emergency_desc"),
    },
  ];

  const articles = [
    {
      id: 1,
      title: "RSU Tangsel Care Resmikan Poliklinik Eksekutif Malam Hari",
      date: "14 Agustus 2026",
      category: "Layanan Baru",
      desc: "Memudahkan masyarakat dan pekerja kantoran untuk mendapatkan layanan kesehatan spesialis tanpa harus mengganggu jam kerja siang.",
    },
    {
      id: 2,
      title: "Tips Menjaga Kesehatan Jantung & Pola Makan Sehat",
      date: "10 Agustus 2026",
      category: "Edukasi Kesehatan",
      desc: "Simak ulasan lengkap dr. Bagas Pratama, Sp.JP mengenai 5 kebiasaan harian yang ampuh menjaga kebugaran otot jantung Anda.",
    },
    {
      id: 3,
      title: "Panduan Mudah Pendaftaran Antrian Online BPJS Kesehatan",
      date: "05 Agustus 2026",
      category: "Panduan Pasien",
      desc: "Langkah praktis melakukan verifikasi rujukan Faskes 1 dan mengambil nomor antrian poli RSU Tangsel Care dari smartphone.",
    },
  ];

  const contactItems = [
    {
      icon: <IconMapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />,
      label: "Alamat & Lokasi Utama",
      value: "Jl. Raya Serpong No. 1, Kota Tangerang Selatan, Banten 15310",
    },
    {
      icon: <IconPhone className="w-5 h-5 text-accent shrink-0 mt-0.5" />,
      label: "Nomor Kontak & Telepon",
      value: "Call Center: (021) 5555-1234 | WA: 0821-0000-0000 | IGD 24 Jam: (021) 5555-9999",
    },
    {
      icon: <IconMail className="w-5 h-5 text-primary shrink-0 mt-0.5" />,
      label: "Email Resmi RS",
      value: "info@rsudtangsel.go.id / kontak@rsudtangselcare.id",
    },
  ];

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12"
      style={{ maxWidth: "var(--container-max)" }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section aria-labelledby="hero-heading">
        <div className="py-6 sm:py-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Layanan Kesehatan Terpadu Tangsel
          </div>
          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight"
          >
            {t("home.hero.title")}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
            {t("home.hero.subtitle")}
          </p>

          {/* 2 CTA utama — above the fold di mobile */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/daftar-online"
              id="cta-daftar-online"
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                className: "w-full sm:w-auto shadow-sm hover:shadow-md",
              })}
            >
              <IconCalendar className="w-5 h-5" />
              Antrian Pendaftaran
            </Link>
            <Link
              href="/jadwal-dokter"
              id="cta-jadwal-dokter"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "w-full sm:w-auto shadow-2xs hover:shadow-xs",
              })}
            >
              <IconClipboard className="w-5 h-5" />
              Jadwal Dokter
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-border" />

      {/* ── Layanan Kami ────────────────────────────────────────────────── */}
      <section aria-labelledby="services-heading">
        <h2
          id="services-heading"
          className="text-xl sm:text-2xl font-bold text-foreground mb-5 tracking-tight"
        >
          Layanan Kami
        </h2>
        {/* Grid 2×2 mobile / 4×1 desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => (
            <Link
              key={service.key}
              href={service.href}
              id={`service-${service.key}`}
              className="
                group flex flex-col gap-3.5 p-5
                border border-border rounded-md
                bg-background hover:bg-muted/50 hover:border-primary/40 hover:shadow-sm
                transition-all duration-200
                focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
              "
              aria-label={`${service.label} — ${service.desc}`}
            >
              <div className="w-11 h-11 flex items-center justify-center rounded-sm bg-muted group-hover:bg-primary/10 transition-colors">
                {service.icon}
              </div>
              <div>
                <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{service.label}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {service.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Divider */}
      <hr className="border-border" />

      {/* ── Berita & Artikel ───────────────────────────────────────────────── */}
      <section aria-labelledby="news-heading">
        <div className="flex items-center justify-between mb-5">
          <h2
            id="news-heading"
            className="text-xl sm:text-2xl font-bold text-foreground tracking-tight"
          >
            Berita &amp; Artikel
          </h2>
          <Link
            href="/berita"
            className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Lihat Semua Artikel &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ARTICLES.slice(0, 3).map((art) => (
            <article
              key={art.id}
              className="flex flex-col justify-between p-5 border border-border rounded-md bg-background shadow-2xs hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-xs">
                    {art.category}
                  </span>
                  <span>{art.date}</span>
                </div>
                <Link href={`/berita/${art.id}`}>
                  <h3 className="text-base font-semibold text-foreground leading-snug hover:text-primary transition-colors cursor-pointer mt-1">
                    {art.title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {art.summary}
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-border/60">
                <Link
                  href={`/berita/${art.id}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Baca Selengkapnya &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Divider */}
      <hr className="border-border" />

      {/* ── Hubungi Kami & Map Embed ────────────────────────────────────────── */}
      <section aria-labelledby="contact-heading" className="space-y-6">
        <div>
          <h2
            id="contact-heading"
            className="text-xl sm:text-2xl font-bold text-foreground tracking-tight"
          >
            Hubungi Kami
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Layanan informasi, lokasi gedung utama RSU Tangsel Care, dan kontak darurat.
          </p>
        </div>

        {/* Informational Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contactItems.map((item, idx) => (
            <div
              key={idx}
              className="flex gap-3.5 p-5 border border-border rounded-md bg-background shadow-2xs hover:border-slate-300 transition-colors"
            >
              {item.icon}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground leading-relaxed">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Embedded Map Section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Peta Lokasi RSU Tangsel Care
          </p>
          <div className="w-full overflow-hidden rounded-md border border-border shadow-xs bg-muted/40">
            <iframe
              src="https://maps.google.com/maps?q=RSUD+Kota+Tangerang+Selatan&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="w-full h-72 sm:h-80 border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              title="Peta Lokasi RSU Tangsel Care"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
