"use client";

/**
 * Jadwal Dokter — RSU Tangsel Care
 */

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";

const POLI_OPTIONS = [
  { value: "semua", label: "Semua Poli" },
  { value: "umum", label: "Poli Umum" },
  { value: "gigi", label: "Poli Gigi & Mulut" },
  { value: "anak", label: "Poli Anak" },
  { value: "kandungan", label: "Poli Kandungan & Kebidanan" },
  { value: "penyakit-dalam", label: "Poli Penyakit Dalam" },
  { value: "jantung", label: "Poli Jantung" },
];

const DOCTORS = [
  { id: 1, name: "dr. Andi Saputra, Sp.U", poli: "Poli Umum", days: "Senin – Jumat", hours: "08:00 – 12:00 WIB" },
  { id: 2, name: "dr. Sari Dewi, Sp.PD", poli: "Poli Penyakit Dalam", days: "Senin, Rabu, Jumat", hours: "13:00 – 16:00 WIB" },
  { id: 3, name: "drg. Budi Santoso", poli: "Poli Gigi & Mulut", days: "Selasa & Kamis", hours: "09:00 – 14:00 WIB" },
  { id: 4, name: "dr. Mega Andini, Sp.A", poli: "Poli Anak", days: "Senin – Sabtu", hours: "08:00 – 11:00 WIB" },
  { id: 5, name: "dr. Ratna Kusuma, Sp.OG", poli: "Poli Kandungan", days: "Rabu & Sabtu", hours: "10:00 – 15:00 WIB" },
  { id: 6, name: "dr. Bagas Pratama, Sp.JP", poli: "Poli Jantung", days: "Selasa, Kamis, Sabtu", hours: "08:00 – 12:00 WIB" },
];

export default function JadwalDokterPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedPoli, setSelectedPoli] = useState("semua");

  const filteredDoctors = DOCTORS.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.poli.toLowerCase().includes(search.toLowerCase());
    const matchPoli = selectedPoli === "semua" || d.poli.toLowerCase().includes(selectedPoli);
    return matchSearch && matchPoli;
  });

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      style={{ maxWidth: "var(--container-max)" }}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Jadwal Dokter & Spesialis
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Temukan jadwal dokter spesialis RSU Tangsel Care dan lakukan pendaftaran antrian secara online.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/40 p-4 rounded-md border border-border">
        <div className="sm:col-span-2">
          <Input
            id="doctor-search"
            label="Cari Nama Dokter / Spesialis"
            placeholder="Contoh: dr. Andi atau Penyakit Dalam"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Select
            id="doctor-poli-filter"
            label="Filter Poli"
            options={POLI_OPTIONS}
            value={selectedPoli}
            onChange={(e) => setSelectedPoli(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Dokter */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDoctors.map((doc) => (
          <Card key={doc.id} className="hover:border-primary/40 hover:shadow-sm transition-all">
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                  {doc.name.charAt(4) || "D"}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base leading-snug">{doc.name}</h3>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-medium bg-muted text-primary rounded">
                    {doc.poli}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 text-xs space-y-1.5 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Hari Praktek:</span>
                  <span className="font-semibold text-foreground">{doc.days}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jam Praktek:</span>
                  <span className="font-semibold text-foreground">{doc.hours}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/daftar-online"
                  className={buttonVariants({ variant: "primary", size: "sm", className: "w-full" })}
                >
                  Daftar Antrian Poli
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
