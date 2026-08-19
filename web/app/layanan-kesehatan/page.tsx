"use client";

/**
 * Layanan Kesehatan — RSU Tangsel Care
 * Katalog & daftar layanan: MCU dari /api/mcu-packages, Lab & Radiologi dari /api/diagnostic-services.
 * Plus fasilitas layanan medis terpadu RS.
 */

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { Card, CardBody } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Hospital, Siren, BedDouble, Search, X, Check, ChevronRight } from "lucide-react";
import { mcuPackagesApi } from "@/services/mcuPackages";
import { diagnosticServicesApi } from "@/services/diagnosticServices";

type CatalogCategory = "mcu" | "lab" | "radiologi";

interface CatalogItem {
  id: string;
  title: string;
  category: CatalogCategory;
  categoryLabel: string;
  badge?: string;
  itemsCount: string;
  priceNumber: number;
  priceFormatted: string;
  description: string;
  itemsIncluded: string[];
}

const CATEGORY_LABEL: Record<CatalogCategory, string> = {
  mcu: "Medical Check-Up",
  lab: "Cek Laboratorium",
  radiologi: "Cek Radiologi",
};

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function toCatalogItem(
  id: string,
  category: CatalogCategory,
  name: string,
  description: string,
  price: number,
  items: { name: string }[],
): CatalogItem {
  return {
    id,
    title: name,
    category,
    categoryLabel: CATEGORY_LABEL[category],
    itemsCount: `${items.length} Item Pemeriksaan`,
    priceNumber: price,
    priceFormatted: formatRupiah(price),
    description,
    itemsIncluded: items.map((i) => i.name),
  };
}

function LayananKesehatanContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("tipe") || "semua";
  const initialPaket = searchParams.get("paket") || "";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialType);
  const [searchQuery, setSearchQuery] = useState<string>(initialPaket);
  const [priceSort, setPriceSort] = useState<"default" | "asc" | "desc">("default");
  const [detailModalItem, setDetailModalItem] = useState<CatalogItem | null>(null);

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialType) setSelectedCategory(initialType);
    if (initialPaket) setSearchQuery(initialPaket);
  }, [initialType, initialPaket]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mcu, diagnostics] = await Promise.all([
        mcuPackagesApi.getAll(),
        diagnosticServicesApi.getAll(),
      ]);
      const list: CatalogItem[] = [
        ...mcu
          .filter((p) => p.is_active)
          .map((p) =>
            toCatalogItem(`mcu-${p.id}`, "mcu", p.name, p.description, p.price, p.items),
          ),
        ...diagnostics
          .filter((s) => s.is_active)
          .map((s) =>
            toCatalogItem(
              `ds-${s.id}`,
              s.category,
              s.name,
              s.description,
              s.price,
              s.items,
            ),
          ),
      ];
      setItems(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat katalog layanan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filteredServices = items.filter((item) => {
    const matchCategory =
      selectedCategory === "semua" || item.category === selectedCategory;
    const matchQuery =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemsIncluded.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()));
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Layanan Kesehatan
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Pilih paket Medical Check Up (MCU), tes laboratorium, atau pencitraan radiologi RSU Tangsel Care.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
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

        <div className="lg:col-span-3 space-y-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari paket layanan kesehatan, tes darah, USG, MCU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 sm:h-14 pl-11 pr-10 text-sm sm:text-base bg-background border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-xs transition-all text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Semua Layanan <span className="text-primary">({filteredServices.length})</span>
            </h2>
            <span className="text-xs text-muted-foreground">
              Menampilkan {filteredServices.length} pilihan paket medis
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Memuat katalog layanan...
            </div>
          ) : error ? (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}{" "}
              <button onClick={loadCatalog} className="underline font-semibold ml-1">
                Coba lagi
              </button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada layanan yang cocok.
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServices.map((item) => {
              const previewItems = item.itemsIncluded.slice(0, 3);
              const remainingCount = item.itemsIncluded.length - previewItems.length;

              return (
                <div
                  key={item.id}
                  className="
                    group relative border border-border rounded-xl bg-background p-6 shadow-xs
                    hover:border-primary hover:shadow-lg transition-all flex flex-col justify-between space-y-6
                  "
                >
                  {item.badge && (
                    <span className="absolute -top-3 right-5 px-3 py-1 text-[11px] font-bold uppercase bg-emerald-600 text-white rounded-full shadow-2xs tracking-wider">
                      {item.badge}
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {item.categoryLabel}
                      </span>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="p-3.5 bg-muted/40 border border-border/80 rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground uppercase tracking-wider border-b border-border/60 pb-1.5">
                        <span>Termasuk Dalam Paket</span>
                        <span className="text-primary font-semibold lowercase">({item.itemsCount})</span>
                      </div>

                      {item.itemsIncluded.length > 0 ? (
                        <ul className="space-y-1.5">
                          {previewItems.map((subItem, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-1 font-medium">{subItem}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Lihat detail untuk rincian layanan.
                        </p>
                      )}

                      {remainingCount > 0 && (
                        <button
                          onClick={() => setDetailModalItem(item)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1 cursor-pointer"
                        >
                          +{remainingCount} pemeriksaan lainnya
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/80 space-y-4">
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">Total Biaya Paket</span>
                      <div className="text-2xl font-extrabold text-primary tracking-tight">
                        {item.priceFormatted}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setDetailModalItem(item)}
                        className="flex-1 py-2.5 px-4 text-xs font-bold text-foreground border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer text-center"
                      >
                        Lihat Detail
                      </button>
                      <Link
                        href="/daftar-online"
                        className="flex-1 py-2.5 px-4 text-xs font-bold text-center text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-2xs"
                      >
                        Daftar Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

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
              icon: <Hospital className="w-5 h-5" />,
            },
            {
              id: "igd",
              title: "Instalasi Gawat Darurat (IGD 24 Jam)",
              desc: "Penanganan kondisi gawat darurat medis dan kecelakaan 24 jam nonstop dengan tim dokter emergency.",
              icon: <Siren className="w-5 h-5" />,
            },
            {
              id: "rawat-inap",
              title: "Rawat Inap & Intensive Care (ICU)",
              desc: "Ruang perawatan VVIP, VIP, Kelas 1-3, serta ICU/NICU/PICU lengkap dengan pemantauan medis 24 jam.",
              icon: <BedDouble className="w-5 h-5" />,
            },
          ].map((item, idx) => (
            <Card key={idx} id={item.id} className="shadow-2xs">
              <CardBody className="space-y-3">
                <div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
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

export default function LayananKesehatanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Memuat Layanan Kesehatan...</div>}>
      <LayananKesehatanContent />
    </Suspense>
  );
}