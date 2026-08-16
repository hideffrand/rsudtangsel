"use client";

/**
 * Beranda — RSU Tangsel Care
 * - Hero Banner Carousel dengan Background Image photo1.png, photo2.png, photo3.png
 * - Judul Carousel KONSISTEN HANYA "RSU Tangsel Care"
 * - Section Layanan Kami
 * - Section Berita & Artikel
 * - Section Hubungi Kami & Google Maps Embed
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { buttonVariants } from "@/components/ui/button";
import { ARTICLES } from "@/lib/articles-data";

// ─── Ikon SVG inline ──────────────────────────────────────────────────────────

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

// ─── Data Slide Carousel (Judul KONSISTEN: RSU Tangsel Care) ─────────────────

const HERO_SLIDES = [
  {
    id: 1,
    badge: "Layanan Kesehatan Terpadu Tangsel",
    title: "RSU Tangsel Care",
    subtitle: "Merawat Sepenuh Hati dengan Pendaftaran Online Cepat, Transparan & Praktis",
    primaryCtaText: "Antrian Pendaftaran",
    primaryCtaLink: "/daftar-online",
    secondaryCtaText: "Jadwal Dokter",
    secondaryCtaLink: "/jadwal-dokter",
    image: "/photo1.png",
    accentColor: "bg-emerald-400",
  },
  {
    id: 2,
    badge: "Layanan Baru Eksekutif",
    title: "RSU Tangsel Care",
    subtitle: "Poliklinik Eksekutif Malam Hari — Konsultasi Spesialis Pukul 17.00 – 21.00 WIB Tanpa Mengganggu Jam Kerja Siang",
    primaryCtaText: "Daftar Poli Malam",
    primaryCtaLink: "/daftar-online",
    secondaryCtaText: "Tanya via Chatbot",
    secondaryCtaLink: "/chat",
    image: "/photo2.png",
    accentColor: "bg-teal-400",
  },
  {
    id: 3,
    badge: "Fasilitas Medis Canggih",
    title: "RSU Tangsel Care",
    subtitle: "Fasilitas Radiologi & MRI 1.5 Tesla Dosis Radiasi Rendah — Diagnostik Presisi Tinggi 24 Jam Nonstop",
    primaryCtaText: "Lihat Layanan Medis",
    primaryCtaLink: "/layanan-kesehatan",
    secondaryCtaText: "Jadwal Spesialis",
    secondaryCtaLink: "/jadwal-dokter",
    image: "/photo3.png",
    accentColor: "bg-sky-400",
  },
];

// ─── Komponen Utama Beranda ───────────────────────────────────────────────────

export default function HomePage() {
  const { t } = useI18n();

  // State Hero Carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play Carousel tiap 5 detik
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  };

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
      label: "Chatbot",
      desc: "Konsultasi medis cepat via Chatbot WhatsApp",
    },
    {
      key: "emergency",
      href: "tel:02155551234",
      icon: <IconExclamation className="w-6 h-6 text-accent" />,
      label: t("home.services.emergency"),
      desc: t("home.services.emergency_desc"),
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

  const activeSlideData = HERO_SLIDES[currentSlide];

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12"
      style={{ maxWidth: "var(--container-max)" }}
    >
      {/* ── HERO BANNER CAROUSEL DENGAN BACKGROUND PHOTO (photo1, photo2, photo3) ── */}
      <section
        aria-label="Carousel Pengumuman & Layanan Unggulan"
        className="relative overflow-hidden rounded-xl border border-border bg-slate-900 shadow-md min-h-[380px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Image per Slide dengan Effect Transition */}
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`
              absolute inset-0 bg-cover bg-center transition-opacity duration-700 transform scale-105
              ${currentSlide === idx ? "opacity-100 z-0" : "opacity-0 -z-10"}
            `}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}

        {/* Dark Overlay Gradient agar Teks & Tombol Kontras & Tajam */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/40 z-10 pointer-events-none" />

        {/* Content Overlay */}
        <div className="relative z-20 p-6 sm:p-10 min-h-[380px] flex flex-col justify-between">
          <div className="max-w-2xl space-y-4">
            {/* Badge Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-semibold border border-white/20 shadow-xs">
              <span className={`w-2 h-2 rounded-full ${activeSlideData.accentColor} animate-pulse`} />
              {activeSlideData.badge}
            </div>

            {/* Title (KONSISTEN: RSU Tangsel Care) */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
              {activeSlideData.title}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed drop-shadow-xs max-w-xl">
              {activeSlideData.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href={activeSlideData.primaryCtaLink}
                className={buttonVariants({
                  variant: "primary",
                  size: "lg",
                  className: "w-full sm:w-auto shadow-sm hover:shadow-md",
                })}
              >
                <IconCalendar className="w-5 h-5" />
                {activeSlideData.primaryCtaText}
              </Link>
              <Link
                href={activeSlideData.secondaryCtaLink}
                className="
                  inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md text-sm font-semibold
                  bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm
                  transition-all shadow-xs w-full sm:w-auto
                "
              >
                <IconClipboard className="w-5 h-5" />
                {activeSlideData.secondaryCtaText}
              </Link>
            </div>
          </div>

          {/* Bottom Controls: Dots & Navigation Arrows */}
          <div className="pt-6 flex items-center justify-between border-t border-white/20 mt-6">
            {/* Indicator Dots */}
            <div className="flex items-center gap-2" role="tablist">
              {HERO_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`
                    h-2.5 rounded-full transition-all duration-300 cursor-pointer
                    ${currentSlide === idx ? "w-8 bg-emerald-400" : "w-2.5 bg-white/40 hover:bg-white/70"}
                  `}
                  aria-label={`Ke slide ${idx + 1}`}
                  aria-selected={currentSlide === idx}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevSlide}
                className="
                  p-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/60
                  text-white transition-colors cursor-pointer backdrop-blur-xs
                "
                aria-label="Slide Sebelumnya"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={handleNextSlide}
                className="
                  p-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/60
                  text-white transition-colors cursor-pointer backdrop-blur-xs
                "
                aria-label="Slide Selanjutnya"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-border" />

      {/* ── LAYANAN KAMI ────────────────────────────────────────────────── */}
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

      {/* ── BERITA & ARTIKEL ───────────────────────────────────────────────── */}
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

      {/* ── HUBUNGI KAMI & MAP EMBED ────────────────────────────────────────── */}
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
