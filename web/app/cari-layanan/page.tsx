"use client";

/**
 * Halaman Cari & Daftar Layanan Kesehatan (/cari-layanan)
 * Tampilan UI presisi sesuai Gambar 4 (Siloam Hospitals style catalog page).
 */

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { CATALOG_SERVICES, MedicalServiceItem } from "@/lib/services-catalog-data";
import { Dialog } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";

function CariLayananContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("tipe") || "semua";
  const initialPaket = searchParams.get("paket") || "";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialType);
  const [searchQuery, setSearchQuery] = useState<string>(initialPaket);
  const [priceSort, setPriceSort] = useState<"default" | "asc" | "desc">("default");
  const [detailModalItem, setDetailModalItem] = useState<MedicalServiceItem | null>(null);

  useEffect(() => {
    if (initialType) setSelectedCategory(initialType);
    if (initialPaket) setSearchQuery(initialPaket);
  }, [initialType, initialPaket]);

  // Filter & Sort Logic
  const filteredServices = CATALOG_SERVICES.filter((item) => {
    const matchCategory =
      selectedCategory === "semua" || item.category === selectedCategory;
    const matchQuery =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  }).sort((a, b) => {
    if (priceSort === "asc") return a.priceNumber - b.priceNumber;
    if (priceSort === "desc") return b.priceNumber - a.priceNumber;
    return 0;
  });

  const handleResetFilter = () => {
    setSelectedCategory("semua");
    setSearchQuery("");
    setPriceSort("default");
  };

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      style={{ maxWidth: "var(--container-max)" }}
    >
      {/* Header Page */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Cari &amp; Daftar Layanan Kesehatan
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Pilih paket Medical Check Up (MCU), tes laboratorium, atau pencitraan radiologi RSU Tangsel Care.
        </p>
      </div>

      {/* Main Grid: Left Sidebar Filter + Right Services Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* ── LEFT SIDEBAR FILTER (Gambar 4 Style) ────────────────────────── */}
        <div className="lg:col-span-1 border border-border rounded-lg p-5 bg-background shadow-xs space-y-6 sticky top-20">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-base text-foreground">Filter Layanan</h3>
            <button
              onClick={handleResetFilter}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Filter Tipe / Kategori Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tipe Layanan
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { id: "semua", label: "Semua" },
                { id: "mcu", label: "Medical Check-Up" },
                { id: "lab", label: "Lab" },
                { id: "radiologi", label: "Radiologi" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`
                    px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer
                    ${
                      selectedCategory === tab.id
                        ? "bg-primary text-white border-primary shadow-2xs"
                        : "bg-muted/50 text-foreground border-border hover:bg-muted hover:border-primary/40"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Search Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Pencarian Kata Kunci
            </label>
            <input
              type="search"
              placeholder="Contoh: Hemat, Diabetes, USG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md focus:outline-none focus:border-primary"
            />
          </div>

          {/* Filter Urutkan Harga */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Urutkan Harga
            </label>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value as "default" | "asc" | "desc")}
              className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md focus:outline-none focus:border-primary"
            >
              <option value="default">Rekomendasi Utama</option>
              <option value="asc">Harga: Termurah ke Termahal</option>
              <option value="desc">Harga: Termahal ke Termurah</option>
            </select>
          </div>
        </div>

        {/* ── RIGHT MAIN CONTENT GRID (Gambar 4 Style) ─────────────────────── */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Semua Layanan <span className="text-primary">({filteredServices.length})</span>
            </h2>
            <span className="text-xs text-muted-foreground">
              Menampilkan {filteredServices.length} pilihan paket medis
            </span>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredServices.map((item) => (
              <div
                key={item.id}
                className="
                  group relative border border-border rounded-lg bg-background p-5 shadow-2xs
                  hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4
                "
              >
                {/* Badge (TERPOPULER / REKOMENDASI) */}
                {item.badge && (
                  <span className="absolute -top-3 right-4 px-2.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-600 text-white rounded-full shadow-2xs tracking-wider">
                    {item.badge}
                  </span>
                )}

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-primary">
                    {item.categoryLabel}
                  </span>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                  <div className="inline-block text-[11px] font-medium px-2 py-0.5 bg-muted rounded text-foreground">
                    {item.itemsCount}
                  </div>
                </div>

                {/* Price & Action Buttons (Gambar 4 Style) */}
                <div className="pt-3 border-t border-border/60 space-y-3">
                  <div className="text-lg font-extrabold text-primary">
                    {item.priceFormatted}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailModalItem(item)}
                      className="flex-1 py-2 px-3 text-xs font-semibold text-foreground border border-border rounded hover:bg-muted transition-colors cursor-pointer"
                    >
                      Lihat Detail
                    </button>
                    <Link
                      href="/daftar-online"
                      className="flex-1 py-2 px-3 text-xs font-semibold text-center text-white bg-primary hover:bg-primary/90 rounded transition-colors"
                    >
                      Daftar Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODAL DIALOG DETAIL PAKET MEDIS ─────────────────────────────────── */}
      <Dialog
        isOpen={detailModalItem !== null}
        onClose={() => setDetailModalItem(null)}
        title={detailModalItem?.title || "Detail Layanan"}
        cancelLabel="Tutup"
      >
        {detailModalItem && (
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded">
                {detailModalItem.categoryLabel}
              </span>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {detailModalItem.description}
              </p>
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                Fasilitas &amp; Item Pemeriksaan Terpenuhi:
              </h4>
              <ul className="space-y-1.5 text-xs text-foreground/90 pl-1">
                {detailModalItem.itemsIncluded.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border pt-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Total Biaya Layanan</span>
                <p className="text-lg font-bold text-primary">{detailModalItem.priceFormatted}</p>
              </div>
              <Link
                href="/daftar-online"
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                Lanjut Pendaftaran
              </Link>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default function CariLayananPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Memuat Katalog Layanan...</div>}>
      <CariLayananContent />
    </Suspense>
  );
}
