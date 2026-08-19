"use client";

/**
 * Jadwal Dokter — RSU Tangsel Care
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { doctorsApi } from "@/services/doctors";
import { schedulesApi, type DoctorSchedule } from "@/services/schedules";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_LABEL: Record<string, string> = {
  Monday: "Senin",
  Tuesday: "Selasa",
  Wednesday: "Rabu",
  Thursday: "Kamis",
  Friday: "Jumat",
  Saturday: "Sabtu",
  Sunday: "Minggu",
};

function formatTime(t: string) {
  return t.slice(0, 5);
}

export default function JadwalDokterPage() {
  const [search, setSearch] = useState("");
  const [selectedPoli, setSelectedPoli] = useState("semua");
  const [doctors, setDoctors] = useState<{ id: number; name: string; specialty: string }[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [doctorList, scheduleList] = await Promise.all([
        doctorsApi.getAll(),
        schedulesApi.getAll(),
      ]);
      setDoctors(doctorList.filter((d) => d.status === "active"));
      setSchedules(scheduleList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat jadwal dokter.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const poliOptions = [
    { value: "semua", label: "Semua Poli" },
    ...Array.from(new Set(doctors.map((d) => d.specialty).filter(Boolean)))
      .sort()
      .map((s) => ({ value: s, label: s })),
  ];

  const rows = doctors.map((d) => {
    const docSchedules = schedules
      .filter((s) => s.doctor_id === d.id)
      .sort((a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week));
    const days = docSchedules.map((s) => DAY_LABEL[s.day_of_week] ?? s.day_of_week).join(", ");
    const hours = docSchedules
      .map((s) => `${formatTime(s.start_time)}${s.end_time ? ` – ${formatTime(s.end_time)}` : ""}`)
      .join(", ");
    return { id: d.id, name: d.name, poli: d.specialty, days, hours };
  });

  const filteredDoctors = rows.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.poli.toLowerCase().includes(search.toLowerCase());
    const matchPoli = selectedPoli === "semua" || d.poli.toLowerCase() === selectedPoli.toLowerCase();
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
            options={poliOptions}
            value={selectedPoli}
            onChange={(e) => setSelectedPoli(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Dokter */}
      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Memuat jadwal dokter...</div>
      ) : error ? (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}{" "}
          <button onClick={loadData} className="underline font-semibold ml-1">Coba lagi</button>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Tidak ada dokter yang cocok.</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDoctors.map((doc) => (
          <Card key={doc.id} className="hover:border-primary/40 hover:shadow-sm transition-all">
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                  {doc.name.trim().charAt(0)?.toUpperCase() || "D"}
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
                  <span className="font-semibold text-foreground">{doc.days || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jam Praktek:</span>
                  <span className="font-semibold text-foreground">{doc.hours || "—"}</span>
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
      )}
    </div>
  );
}
