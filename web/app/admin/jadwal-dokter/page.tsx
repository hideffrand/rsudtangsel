"use client";

/**
 * Manajemen Jadwal Dokter — RSU Tangsel Care (/admin/jadwal-dokter)
 * Fitur:
 * 1. Set slot praktik per dokter/poli
 * 2. Blokir slot (cuti dokter, seminar, dll)
 * 3. Status slot real-time
 */

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { poliApi, type Poli } from "@/services/poli";

interface ScheduleSlot {
  id: number;
  doctorName: string;
  specialty: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  quota: number;
  filled: number;
  status: "Aktif" | "Diblokir (Cuti)" | "Diblokir (Seminar)";
}

const INITIAL_SLOTS: ScheduleSlot[] = [
  { id: 1, doctorName: "dr. Ahmad Sp.JP", specialty: "Jantung", dayOfWeek: "Senin", startTime: "08:00", endTime: "12:00", quota: 20, filled: 15, status: "Aktif" },
  { id: 2, doctorName: "dr. Ahmad Sp.JP", specialty: "Jantung", dayOfWeek: "Rabu", startTime: "13:00", endTime: "16:00", quota: 15, filled: 12, status: "Aktif" },
  { id: 3, doctorName: "dr. Siti Sp.A", specialty: "Anak", dayOfWeek: "Selasa", startTime: "09:00", endTime: "13:00", quota: 25, filled: 20, status: "Aktif" },
  { id: 4, doctorName: "dr. Budi Sp.OG", specialty: "Kandungan", dayOfWeek: "Kamis", startTime: "10:00", endTime: "14:00", quota: 18, filled: 18, status: "Diblokir (Cuti)" },
  { id: 5, doctorName: "dr. Maya Sp.M", specialty: "Mata", dayOfWeek: "Jumat", startTime: "08:30", endTime: "11:30", quota: 15, filled: 8, status: "Aktif" },
];

export default function AdminJadwalDokterPage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>(INITIAL_SLOTS);
  const [filterPoli, setFilterPoli] = useState("");
  const [searchDoc, setSearchDoc] = useState("");
  const [polis, setPolis] = useState<Poli[]>([]);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [blockItem, setBlockItem] = useState<ScheduleSlot | null>(null);
  const [blockReason, setBlockReason] = useState("Cuti Dokter");

  // Form State
  const [newDoc, setNewDoc] = useState("");
  const [newPoli, setNewPoli] = useState("");
  const [newDay, setNewDay] = useState("Senin");
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("12:00");
  const [newQuota, setNewQuota] = useState(20);

  // Muat master data poli dari API.
  useEffect(() => {
    let cancelled = false;
    poliApi
      .getAll()
      .then((data) => {
        if (cancelled) return;
        setPolis(data);
        if (data.length > 0) setNewPoli((prev) => (prev || data[0].name));
      })
      .catch(() => {
        if (!cancelled) setPolis([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSlots = slots.filter((s) => {
    const matchPoli = !filterPoli || s.specialty === filterPoli;
    const matchDoc = !searchDoc || s.doctorName.toLowerCase().includes(searchDoc.toLowerCase());
    return matchPoli && matchDoc;
  });

  const handleAddSlot = () => {
    if (!newDoc) return;
    const newSlot: ScheduleSlot = {
      id: Date.now(),
      doctorName: newDoc,
      specialty: newPoli,
      dayOfWeek: newDay,
      startTime: newStart,
      endTime: newEnd,
      quota: Number(newQuota),
      filled: 0,
      status: "Aktif",
    };
    setSlots([newSlot, ...slots]);
    setIsAddOpen(false);
    setNewDoc("");
  };

  const handleToggleBlock = () => {
    if (!blockItem) return;
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === blockItem.id) {
          const isCurrentlyBlocked = s.status !== "Aktif";
          return {
            ...s,
            status: isCurrentlyBlocked ? "Aktif" : (`Diblokir (${blockReason})` as ScheduleSlot["status"]),
          };
        }
        return s;
      })
    );
    setBlockItem(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Jadwal Dokter</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Atur slot praktik per spesialisasi dan kelola penutupan/blokir kuota antrian.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
        >
          + Tambah Slot Praktik
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cari Nama Dokter</label>
          <input
            type="search"
            placeholder="Ketik nama dokter..."
            value={searchDoc}
            onChange={(e) => setSearchDoc(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="w-full sm:w-60 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Poli / Spesialis</label>
          <select
            value={filterPoli}
            onChange={(e) => setFilterPoli(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Poli</option>
            {polis.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">
            Daftar Slot Praktik <span className="text-emerald-600">({filteredSlots.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3 text-left font-semibold">Dokter</th>
                <th className="px-6 py-3 text-left font-semibold">Poli</th>
                <th className="px-6 py-3 text-left font-semibold">Hari &amp; Jam</th>
                <th className="px-6 py-3 text-left font-semibold">Kuota / Terisi</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSlots.map((slot) => (
                <tr key={slot.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{slot.doctorName}</td>
                  <td className="px-6 py-4 text-slate-600">{slot.specialty}</td>
                  <td className="px-6 py-4 text-slate-700">
                    <span className="font-medium">{slot.dayOfWeek}</span> ({slot.startTime} - {slot.endTime})
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800">{slot.filled}</span> / {slot.quota} Pasien
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        slot.status === "Aktif"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700 border border-red-200"
                      }`}
                    >
                      {slot.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setBlockItem(slot)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        slot.status === "Aktif"
                          ? "text-white bg-amber-600 hover:bg-amber-500"
                          : "text-white bg-emerald-600 hover:bg-emerald-500"
                      }`}
                    >
                      {slot.status === "Aktif" ? "Blokir Slot" : "Buka Blokir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Slot */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Slot Praktik Baru"
        confirmLabel="Simpan Slot"
        cancelLabel="Batal"
        onConfirm={handleAddSlot}
      >
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Nama Dokter</label>
            <input
              type="text"
              placeholder="dr. Contoh Sp.X"
              value={newDoc}
              onChange={(e) => setNewDoc(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Poli</label>
              <select
                value={newPoli}
                onChange={(e) => setNewPoli(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
              >
                {polis.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Hari Praktik</label>
              <select
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
              >
                {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Jam Mulai</label>
              <input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Jam Selesai</label>
              <input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Kuota Max</label>
              <input
                type="number"
                value={newQuota}
                onChange={(e) => setNewQuota(Number(e.target.value))}
                className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Modal Toggle Block */}
      <Dialog
        isOpen={blockItem !== null}
        onClose={() => setBlockItem(null)}
        title={blockItem?.status === "Aktif" ? "Blokir Slot Praktik" : "Buka Blokir Slot"}
        confirmLabel={blockItem?.status === "Aktif" ? "Ya, Blokir" : "Ya, Buka Kembali"}
        cancelLabel="Batal"
        onConfirm={handleToggleBlock}
        confirmVariant={blockItem?.status === "Aktif" ? "destructive" : "primary"}
      >
        {blockItem && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              Dokter: <strong className="text-slate-800">{blockItem.doctorName}</strong> ({blockItem.dayOfWeek}, {blockItem.startTime}-{blockItem.endTime})
            </p>
            {blockItem.status === "Aktif" && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Alasan Pemblokiran</label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
                >
                  <option value="Cuti Dokter">Cuti Dokter</option>
                  <option value="Seminar/Tugas Luar">Seminar / Tugas Luar</option>
                  <option value="Perbaikan Fasilitas Poli">Perbaikan Fasilitas Poli</option>
                </select>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
