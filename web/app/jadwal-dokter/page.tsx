"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { doctorsApi } from "@/services/doctors";
import { poliApi, type Poli } from "@/services/poli";
import { schedulesApi, type DoctorSchedule } from "@/services/schedules";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DISPLAY_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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

function formatSlot(s: DoctorSchedule | undefined): string {
  if (!s) return "-";
  return `${formatTime(s.start_time)}${s.end_time ? ` – ${formatTime(s.end_time)}` : " – Selesai"}`;
}

export default function JadwalDokterPage() {
  const [search, setSearch] = useState("");
  const [selectedPoli, setSelectedPoli] = useState("semua");
  const [doctors, setDoctors] = useState<{ id: number; name: string; specialty: string; poli_id: number | null }[]>([]);
  const [polis, setPolis] = useState<Poli[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [doctorList, scheduleList, poliList] = await Promise.all([
        doctorsApi.getAll(),
        schedulesApi.getAll(),
        poliApi.getAll(),
      ]);
      setDoctors(doctorList.filter((d) => d.status === "active"));
      setSchedules(scheduleList);
      setPolis(poliList);
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
    ...polis.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  const rows = doctors.map((d) => {
    const docSchedules = schedules
      .filter((s) => s.doctor_id === d.id)
      .sort((a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week));
    const scheduleByDay: Partial<Record<string, DoctorSchedule>> = {};
    for (const s of docSchedules) scheduleByDay[s.day_of_week] = s;
    return { id: d.id, name: d.name, poli: d.specialty, poliId: d.poli_id, scheduleByDay };
  });

  const filteredDoctors = rows.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.poli.toLowerCase().includes(search.toLowerCase());
    const matchPoli = selectedPoli === "semua" || (d.poliId != null && String(d.poliId) === selectedPoli);
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

              <table className="w-full pt-2 border-t border-border/60 text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left font-medium py-1 pr-2 w-16">Hari</th>
                    <th className="text-left font-medium py-1">Jam</th>
                  </tr>
                </thead>
                <tbody>
                  {DISPLAY_DAYS.map((day) => {
                    const slot = doc.scheduleByDay[day];
                    return (
                      <tr key={day} className="border-t border-border/40 first:border-t-0">
                        <td className="py-1 pr-2 text-muted-foreground">{DAY_LABEL[day]}</td>
                        <td className={`py-1 font-semibold ${slot ? "text-foreground" : "text-muted-foreground/60"}`}>
                          {formatSlot(slot)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

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