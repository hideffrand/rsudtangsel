"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { poliApi, type Poli } from "@/services/poli";
import { doctorsApi, type Doctor } from "@/services/doctors";
import { schedulesApi, type DoctorSchedule, type SchedulePayload } from "@/services/schedules";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

type FormState = {
  doctorId: number | "";
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  quota: number;
};

const EMPTY_FORM: FormState = {
  doctorId: "",
  dayOfWeek: "Senin",
  startTime: "08:00",
  endTime: "12:00",
  quota: 20,
};

export default function AdminJadwalDokterPage() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [polis, setPolis] = useState<Poli[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [filterPoliId, setFilterPoliId] = useState<number | "">("");
  const [searchDoc, setSearchDoc] = useState("");
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DoctorSchedule | null>(null);
  const [deleteItem, setDeleteItem] = useState<DoctorSchedule | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const loadAll = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [scheduleData, doctorData, poliData] = await Promise.all([
        schedulesApi.getAll(),
        doctorsApi.getAll(),
        poliApi.getAll(),
      ]);
      setSchedules(scheduleData);
      setDoctors(doctorData);
      setPolis(poliData);
    } catch (err) {
      console.error(err);
      setLoadError("Gagal memuat data jadwal dari server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const doctorsById = useMemo(() => {
    const map = new Map<number, Doctor>();
    doctors.forEach((d) => map.set(d.id, d));
    return map;
  }, [doctors]);

  const polisById = useMemo(() => {
    const map = new Map<number, Poli>();
    polis.forEach((p) => map.set(p.id, p));
    return map;
  }, [polis]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchPoli = !filterPoliId || doc.poli_id === filterPoliId;
      const matchDoc = !searchDoc || doc.name.toLowerCase().includes(searchDoc.toLowerCase());
      return matchPoli && matchDoc;
    });
  }, [doctors, filterPoliId, searchDoc]);

  const schedulesByDoctorId = useMemo(() => {
    const map = new Map<number, DoctorSchedule[]>();
    schedules.forEach((s) => {
      const list = map.get(s.doctor_id) || [];
      list.push(s);
      map.set(s.doctor_id, list);
    });
    return map;
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const doctor = doctorsById.get(s.doctor_id);
      const matchPoli = !filterPoliId || doctor?.poli_id === filterPoliId;
      const matchDoc = !searchDoc || s.doctor_name.toLowerCase().includes(searchDoc.toLowerCase());
      return matchPoli && matchDoc;
    });
  }, [schedules, doctorsById, filterPoliId, searchDoc]);

  const openAddModal = (doctorId?: number, dayOfWeek?: string) => {
    setEditingSchedule(null);
    setForm({
      ...EMPTY_FORM,
      doctorId: doctorId ?? doctors[0]?.id ?? "",
      dayOfWeek: dayOfWeek ?? "Senin",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (schedule: DoctorSchedule) => {
    setEditingSchedule(schedule);
    setForm({
      doctorId: schedule.doctor_id,
      dayOfWeek: schedule.day_of_week,
      startTime: schedule.start_time,
      endTime: schedule.end_time ?? "",
      quota: schedule.quota,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const validateForm = (): string | null => {
    if (!form.doctorId) return "Pilih dokter terlebih dahulu.";
    if (!form.startTime) return "Jam mulai wajib diisi.";
    if (form.endTime && form.startTime >= form.endTime) {
      return "Jam selesai harus setelah jam mulai.";
    }

    const docSchedules = schedules.filter(
      (s) => s.doctor_id === Number(form.doctorId) && s.day_of_week === form.dayOfWeek
    );

    const hasConflict = docSchedules.some((s) => {
      if (editingSchedule && s.id === editingSchedule.id) return false;
      const sEnd = s.end_time || "23:59";
      const fEnd = form.endTime || "23:59";
      return form.startTime < sEnd && fEnd > s.start_time;
    });

    if (hasConflict) {
      return `Dokter sudah memiliki jadwal bentrok pada hari ${form.dayOfWeek}.`;
    }

    return null;
  };

  const handleSaveSchedule = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload: SchedulePayload = {
      doctor_id: Number(form.doctorId),
      day_of_week: form.dayOfWeek,
      start_time: form.startTime,
      end_time: form.endTime || null,
      quota: Number(form.quota),
    };

    try {
      if (editingSchedule) {
        const updated = await schedulesApi.update(editingSchedule.id, payload);
        setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await schedulesApi.create(payload);
        setSchedules((prev) => [created, ...prev]);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      setFormError("Gagal menyimpan slot praktik. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteItem) return;
    setIsSaving(true);
    try {
      await schedulesApi.remove(deleteItem.id);
      setSchedules((prev) => prev.filter((s) => s.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err) {
      console.error(err);
      setFormError("Gagal menghapus slot praktik. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Jadwal Dokter</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola matriks ketersediaan mingguan, slot waktu praktik, dan alokasi kuota pasien.
          </p>
        </div>
        <button
          onClick={() => openAddModal()}
          disabled={isLoading || doctors.length === 0}
          className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
        >
          + Tambah Slot Praktik
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-end gap-3 shadow-xs">
        <div className="flex-1 space-y-1 w-full">
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
            value={filterPoliId}
            onChange={(e) => setFilterPoliId(e.target.value ? Number(e.target.value) : "")}
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Poli</option>
            {polis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden h-9 bg-slate-50 self-end">
          <button
            onClick={() => setViewMode("grouped")}
            className={`px-3 text-xs font-semibold transition-colors ${
              viewMode === "grouped" ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Kartu Dokter
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 text-xs font-semibold transition-colors ${
              viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tabel Flat
          </button>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{loadError}</span>
          <button onClick={loadAll} className="font-semibold underline">
            Coba lagi
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
          Memuat data jadwal dan dokter...
        </div>
      ) : viewMode === "grouped" ? (
        <div className="space-y-4">
          {filteredDoctors.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
              Tidak ada dokter yang cocok dengan filter.
            </div>
          ) : (
            filteredDoctors.map((doc) => {
              const docSchedules = schedulesByDoctorId.get(doc.id) || [];
              const poli = doc.poli_id ? polisById.get(doc.poli_id) : null;

              return (
                <div key={doc.id} className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200">
                        {doc.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base leading-tight">{doc.name}</h3>
                        <p className="text-xs text-slate-500">
                          {poli?.name || doc.specialty || "Spesialisasi Tidak Set"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openAddModal(doc.id)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md border border-emerald-200/60 transition-colors self-start sm:self-auto"
                    >
                      + Tambah Slot Hari
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    {DAYS.map((day) => {
                      const daySlots = docSchedules.filter((s) => s.day_of_week === day);
                      return (
                        <div key={day} className="p-3 bg-white flex flex-col justify-between space-y-2 min-h-[110px]">
                          <div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-2">
                              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{day}</span>
                              <button
                                onClick={() => openAddModal(doc.id, day)}
                                title={`Tambah slot ${day}`}
                                className="text-slate-400 hover:text-emerald-600 font-semibold text-xs"
                              >
                                +
                              </button>
                            </div>
                            {daySlots.length === 0 ? (
                              <p className="text-xs text-slate-300 italic py-2">Libur / Tidak ada slot</p>
                            ) : (
                              <div className="space-y-1.5">
                                {daySlots.map((slot) => (
                                  <div
                                    key={slot.id}
                                    className="p-2 bg-slate-50 border border-slate-100 rounded-md group hover:border-slate-300 transition-colors"
                                  >
                                    <div className="text-xs font-bold text-slate-700">
                                      {slot.start_time} - {slot.end_time || "Selesai"}
                                    </div>
                                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                                      <span>Kuota: {slot.quota}</span>
                                      <div className="space-x-1 opacity-80 group-hover:opacity-100">
                                        <button
                                          onClick={() => openEditModal(slot)}
                                          className="text-slate-600 hover:text-slate-900 font-semibold"
                                        >
                                          Edit
                                        </button>
                                        <span>•</span>
                                        <button
                                          onClick={() => setDeleteItem(slot)}
                                          className="text-red-600 hover:text-red-800 font-semibold"
                                        >
                                          Hapus
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">
              Daftar Slot Praktik <span className="text-emerald-600">({filteredSchedules.length})</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-semibold">Dokter</th>
                  <th className="px-6 py-3 text-left font-semibold">Poli</th>
                  <th className="px-6 py-3 text-left font-semibold">Hari &amp; Jam</th>
                  <th className="px-6 py-3 text-left font-semibold">Kuota</th>
                  <th className="px-6 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      Tidak ada slot praktik yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((slot) => {
                    const doctor = doctorsById.get(slot.doctor_id);
                    return (
                      <tr key={slot.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">{slot.doctor_name}</td>
                        <td className="px-6 py-4 text-slate-600">{doctor?.specialty ?? "-"}</td>
                        <td className="px-6 py-4 text-slate-700">
                          <span className="font-medium">{slot.day_of_week}</span> ({slot.start_time}
                          {slot.end_time ? ` - ${slot.end_time}` : ""})
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800">{slot.quota}</span> Pasien
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(slot)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-slate-600 hover:bg-slate-500 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteItem(slot)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-red-600 hover:bg-red-500 transition-colors"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingSchedule ? "Edit Slot Praktik" : "Tambah Slot Praktik Baru"}
        confirmLabel={isSaving ? "Menyimpan..." : "Simpan Slot"}
        cancelLabel="Batal"
        onConfirm={handleSaveSchedule}
      >
        <div className="space-y-3 text-sm">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md px-3 py-2">
              {formError}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Dokter</label>
            <select
              value={form.doctorId}
              onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value ? Number(e.target.value) : "" }))}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
            >
              <option value="">Pilih dokter...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Hari Praktik</label>
            <select
              value={form.dayOfWeek}
              onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Jam Mulai</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Jam Selesai</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Kuota Max</label>
              <input
                type="number"
                min={0}
                value={form.quota}
                onChange={(e) => setForm((f) => ({ ...f, quota: Number(e.target.value) }))}
                className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md mt-1"
              />
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        title="Hapus Slot Praktik"
        confirmLabel={isSaving ? "Menghapus..." : "Ya, Hapus"}
        cancelLabel="Batal"
        onConfirm={handleDeleteSchedule}
        confirmVariant="destructive"
      >
        {deleteItem && (
          <div className="space-y-2 text-sm">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md px-3 py-2">
                {formError}
              </div>
            )}
            <p className="text-slate-600">
              Yakin ingin menghapus slot praktik{" "}
              <strong className="text-slate-800">{deleteItem.doctor_name}</strong> pada{" "}
              <strong className="text-slate-800">{deleteItem.day_of_week}</strong> (
              {deleteItem.start_time}
              {deleteItem.end_time ? ` - ${deleteItem.end_time}` : ""})? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}