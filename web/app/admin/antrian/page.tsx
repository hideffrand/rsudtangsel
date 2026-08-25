"use client";

/**
 * Manajemen Antrian & Check-in QR — RSU Tangsel Care (/admin/antrian)
 * Fitur:
 * 1. Daftar booking pasien & filter status (Belum Check-in, Sudah Check-in, Selesai, Rujukan, dll.)
 * 2. Scan QR Code via Kamera Browser (html5-qrcode) + Input Manual fallback
 * 3. Notifikasi informasi lantai & ruangan setelah check-in
 * 4. Tombol "Selesai" dengan pemilihan Outcome (Selesai Normal, Rawat Inap, Rawat Jalan, Rujukan Spesialis)
 * 5. Alur Rujukan Dokter Umum -> Spesialis (Bisa langsung disetujui hari ini / besok tanpa QR dengan No. Rekam Medis)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  QrCode,
  RotateCw,
  Clock,
  CheckCircle,
  Volume2,
  SkipForward,
  CheckSquare,
  ClipboardList,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Hospital,
  PersonStanding,
  Settings,
  Zap,
  Lightbulb,
} from "lucide-react";
import {
  getAdminQueue,
  callPatient,
  skipPatient,
  checkInPatient,
  finishPatientConsultation,
  createDirectSpecialistBooking,
  getFloorForPoli,
  type QueueItem,
} from "@/services/queue";
import { poliApi, type Poli } from "@/services/poli";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Waiting: { label: "Belum Check-in", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  CheckedIn: { label: "Sudah Check-in", cls: "bg-blue-100 text-blue-800 border-blue-300" },
  Processing: { label: "Sedang Bertemu Dokter", cls: "bg-purple-100 text-purple-800 border-purple-300" },
  Done: { label: "Selesai Normal", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  RawatInap: { label: "Rawat Inap", cls: "bg-rose-100 text-rose-800 border-rose-300" },
  RawatJalan: { label: "Rawat Jalan", cls: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  RujukanSpesialis: { label: "Rujukan Spesialis", cls: "bg-teal-100 text-teal-800 border-teal-300" },
  Cancelled: { label: "Dibatalkan", cls: "bg-red-100 text-red-700 border-red-300" },
};

export default function AntrianAdminPage() {
  const { showToast } = useToast();

  // Queue Data & Filters
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [polis, setPolis] = useState<Poli[]>([]);
  const [filterPoli, setFilterPoli] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  // Selected Patient for detail inspection
  const [selectedPatient, setSelectedPatient] = useState<QueueItem | null>(null);

  // QR Scanner Modal State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState("");
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const html5QrCodeRef = useRef<unknown>(null);

  // Success Check-in Banner / Modal (Floor Info)
  const [checkInSuccessInfo, setCheckInSuccessInfo] = useState<{
    queueNumber: string;
    patientName: string;
    poli: string;
    floorInfo: string;
  } | null>(null);

  // "Selesai" Consultation Outcome Dialog
  const [finishModalPatient, setFinishModalPatient] = useState<QueueItem | null>(null);
  const [outcomeType, setOutcomeType] = useState<"Done" | "RawatInap" | "RawatJalan" | "RujukanSpesialis">("Done");
  const [referralPoli, setReferralPoli] = useState("Jantung");
  const [referralDoctor, setReferralDoctor] = useState("dr. Ahmad Sp.JP");
  const [referralDate, setReferralDate] = useState(new Date().toISOString().split("T")[0]);
  const [referralNotes, setReferralNotes] = useState("");
  const [familyPhone, setFamilyPhone] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [waResult, setWaResult] = useState<{ familyUrl?: string; doctorUrl?: string } | null>(null);
  const [isSubmittingOutcome, setIsSubmittingOutcome] = useState(false);

  // Direct Specialist Booking Modal (Without QR)
  const [showDirectSpecialistModal, setShowDirectSpecialistModal] = useState(false);
  const [directForm, setDirectForm] = useState({
    patient_name: "",
    nik: "",
    phone_number: "",
    referred_to_poli: "Jantung",
    referred_to_doctor: "dr. Ahmad Sp.JP",
    referred_date: new Date().toISOString().split("T")[0],
    outcome_notes: "Rujukan langsung tanpa QR",
  });

  // ─── 1. Load Master Data & Queue ───────────────────────────────────────────
  useEffect(() => {
    poliApi.getAll().then(setPolis).catch(() => setPolis([]));
  }, []);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminQueue({
        poli: filterPoli || undefined,
        date: filterDate || undefined,
      });
      setQueue(data);
      if (data.length > 0 && !selectedPatient) {
        setSelectedPatient(data[0]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filterPoli, filterDate, selectedPatient]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQueue();
  }, [fetchQueue]);

  // ─── 2. Filtered Queue ─────────────────────────────────────────────────────
  const filteredQueue = queue.filter((item) => {
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    return true;
  });

  // ─── 3. QR Camera Scanner Integration ──────────────────────────────────────
  const startCameraScanner = async () => {
    setScannerError(null);
    setIsScanningActive(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width: number, height: number) => {
            const minEdge = Math.min(width, height);
            const size = Math.floor(minEdge * 0.75);
            return { width: size, height: size };
          },
        },
        async (decodedText: string) => {
          // Success Callback
          await handleProcessCheckIn(decodedText);
          try {
            await html5QrCode.stop();
          } catch {
            // ignore
          }
          setShowScannerModal(false);
          setIsScanningActive(false);
        },
        () => {
          // Frame error (silent)
        }
      );
    } catch (err: unknown) {
      setScannerError(
        err instanceof Error
          ? `Gagal mengakses kamera: ${err.message}`
          : "Kamera tidak dapat diakses pada perangkat ini. Silakan gunakan input manual kode booking di bawah."
      );
      setIsScanningActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const scanner = html5QrCodeRef.current as { stop: () => Promise<void> };
        await scanner.stop();
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setIsScanningActive(false);
  };

  const handleOpenScanner = () => {
    setShowScannerModal(true);
    setManualCodeInput("");
    setScannerError(null);
    // Start camera slightly delayed after modal opens
    setTimeout(startCameraScanner, 300);
  };

  const handleCloseScanner = () => {
    stopCameraScanner();
    setShowScannerModal(false);
  };

  // ─── 4. Process Check-in ───────────────────────────────────────────────────
  const handleProcessCheckIn = async (rawCode: string) => {
    if (!rawCode.trim()) return;

    try {
      const updatedItem = await checkInPatient(rawCode);
      setQueue((prev) =>
        prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
      setSelectedPatient(updatedItem);

      // Trigger Floor Location Notification Modal
      setCheckInSuccessInfo({
        queueNumber: updatedItem.number,
        patientName: updatedItem.patient_name,
        poli: updatedItem.poli,
        floorInfo: updatedItem.floor_info || getFloorForPoli(updatedItem.poli),
      });

      showToast(`Check-in berhasil untuk ${updatedItem.patient_name}!`, "success");
    } catch {
      showToast("Kode booking tidak ditemukan dalam antrian hari ini.", "error");
    }
  };

  // ─── 5. Handle "Selesai" Outcome Submission ────────────────────────────────
  const handleSaveOutcome = async () => {
    if (!finishModalPatient) return;

    // Validasi WA keluarga wajib untuk RawatInap / RawatJalan
    if ((outcomeType === "RawatInap" || outcomeType === "RawatJalan") && !familyPhone.trim()) {
      showToast("Nomor WhatsApp keluarga pasien wajib diisi untuk Rawat Inap / Rawat Jalan", "error");
      return;
    }

    setIsSubmittingOutcome(true);
    setWaResult(null);

    try {
      const rmNo = `RM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const isReferral = outcomeType === "RujukanSpesialis";

      const updated = await finishPatientConsultation(finishModalPatient.id, outcomeType, {
        medical_record_no: rmNo,
        referred_to_poli: isReferral ? referralPoli : undefined,
        referred_to_doctor: isReferral ? referralDoctor : undefined,
        referred_date: isReferral ? referralDate : undefined,
        outcome_notes: referralNotes || undefined,
        floor_info: isReferral ? getFloorForPoli(referralPoli) : finishModalPatient.floor_info,
        family_phone_number: familyPhone.trim() || undefined,
        family_name: familyName.trim() || undefined,
      });

      setQueue((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      setSelectedPatient(updated);

      // Simpan URL WA untuk ditampilkan ke admin
      if (updated.whatsapp_url || updated.doctor_whatsapp_url) {
        setWaResult({ familyUrl: updated.whatsapp_url, doctorUrl: updated.doctor_whatsapp_url });
      }

      if (isReferral) {
        showToast(`Rujukan ke ${referralPoli} (${referralDoctor}) berhasil! No. RM: ${rmNo}`, "success");
      } else {
        showToast(`Status ${finishModalPatient.patient_name}: ${STATUS_BADGE[outcomeType]?.label}`, "success");
      }
    } catch {
      showToast("Gagal memperbarui status konsultasi", "error");
    } finally {
      setIsSubmittingOutcome(false);
      if (outcomeType !== "RawatInap" && outcomeType !== "RawatJalan") {
        setFinishModalPatient(null);
        setFamilyPhone("");
        setFamilyName("");
      } else {
        setIsSubmittingOutcome(false);
      }
    }
  };

  const handleCloseFinishModal = () => {
    setFinishModalPatient(null);
    setFamilyPhone("");
    setFamilyName("");
    setWaResult(null);
    setReferralNotes("");
    setOutcomeType("Done");
  };

  // ─── 6. Direct Specialist Walk-in / Referral without QR ────────────────────
  const handleCreateDirectSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directForm.patient_name || !directForm.nik) {
      showToast("Nama dan NIK pasien wajib diisi", "error");
      return;
    }

    try {
      const newBooking = await createDirectSpecialistBooking(directForm);
      setQueue((prev) => [newBooking, ...prev]);
      setSelectedPatient(newBooking);
      setShowDirectSpecialistModal(false);
      showToast(
        `Pasien rujukan langsung ke ${newBooking.poli} berhasil disetujui! No RM: ${newBooking.medical_record_no}`,
        "success"
      );
      setDirectForm({
        patient_name: "",
        nik: "",
        phone_number: "",
        referred_to_poli: "Jantung",
        referred_to_doctor: "dr. Ahmad Sp.JP",
        referred_date: new Date().toISOString().split("T")[0],
        outcome_notes: "Rujukan langsung tanpa QR",
      });
    } catch {
      showToast("Gagal membuat booking spesialis langsung", "error");
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Antrian &amp; Check-in QR</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola antrian poli hari ini, scan QR Code kehadiran pasien, dan atur rujukan internal ke dokter spesialis.
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDirectSpecialistModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Booking Spesialis (Tanpa QR)
          </button>

          <button
            onClick={handleOpenScanner}
            className="px-4 py-2 text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4" /> Scan QR Check-in
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider">Filter:</span>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="Waiting">Belum Check-in (Waiting)</option>
            <option value="CheckedIn">Sudah Check-in (CheckedIn)</option>
            <option value="Processing">Sedang Dipanggil (Processing)</option>
            <option value="Done">Selesai (Done)</option>
            <option value="RujukanSpesialis">Rujukan Spesialis</option>
            <option value="RawatInap">Rawat Inap</option>
            <option value="RawatJalan">Rawat Jalan</option>
          </select>

          <select
            value={filterPoli}
            onChange={(e) => setFilterPoli(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Poliklinik</option>
            <option value="Umum">Poli Umum</option>
            {polis.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="admin-filter-date" className="font-bold text-slate-500">Tanggal:</label>
          <input
            id="admin-filter-date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold"
          />
          <button
            onClick={fetchQueue}
            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
          >
            <RotateCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Main Grid: Queue List (Left) + Detail & Action Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Queue List */}
        <div className="lg:col-span-1 border border-slate-200 rounded-xl bg-white p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-slate-800 text-sm">
              Daftar Pasien ({filteredQueue.length})
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {queue.filter((q) => q.status === "Waiting").length} Belum Hadir
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat data antrian...</div>
          ) : filteredQueue.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Tidak ada antrian pada filter ini.</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredQueue.map((item) => {
                const isSelected = selectedPatient?.id === item.id;
                const badge = STATUS_BADGE[item.status] || STATUS_BADGE.Waiting;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPatient(item)}
                    className={`
                      w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5
                      ${isSelected
                        ? "border-emerald-500 bg-emerald-50/60 shadow-2xs ring-1 ring-emerald-400"
                        : "border-slate-200 hover:bg-slate-50"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-800 tracking-wider">
                        {item.number}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      {item.patient_name}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{item.poli}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.schedule_time || item.created_at}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Patient Inspection & Action Desk */}
        <div className="lg:col-span-2 border border-slate-200 rounded-xl bg-white p-6 shadow-2xs space-y-6">
          {selectedPatient ? (
            <>
              {/* Patient Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-emerald-600 tracking-wider">
                      {selectedPatient.number}
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <h2 className="text-lg font-black text-slate-800">{selectedPatient.patient_name}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    NIK: <span className="font-mono">{selectedPatient.nik || "367401xxxxxxxxxx"}</span> &bull; No. HP: {selectedPatient.phone_number || "-"}
                  </p>
                </div>

                {/* Status Badge */}
                <div>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${STATUS_BADGE[selectedPatient.status]?.cls}`}>
                    {STATUS_BADGE[selectedPatient.status]?.label}
                  </span>
                </div>
              </div>

              {/* Floor / Room Notification Card */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Lokasi Pertemuan Medis (Lantai &amp; Ruangan):
                </span>
                <p className="text-base font-black text-emerald-950">
                  {selectedPatient.floor_info || getFloorForPoli(selectedPatient.poli)}
                </p>
                <p className="text-xs text-emerald-700">
                  Dokter Pemeriksa: <strong>{selectedPatient.doctor_name}</strong> &bull; Poli: <strong>{selectedPatient.poli}</strong>
                </p>
              </div>

              {/* Special Medical Record Info if Referred */}
              {selectedPatient.medical_record_no && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1 text-teal-900">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[10px] tracking-wider text-teal-700">Rujukan Spesialis Terkonfirmasi</span>
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-teal-300">{selectedPatient.medical_record_no}</span>
                  </div>
                  <p className="font-bold text-sm">
                    Tujuan: {selectedPatient.referred_to_poli} — {selectedPatient.referred_to_doctor}
                  </p>
                  <p className="text-teal-700">
                    Jadwal Pertemuan: <strong>{selectedPatient.referred_date}</strong> (Disetujui Langsung Tanpa QR)
                  </p>
                  {selectedPatient.outcome_notes && (
                    <p className="text-slate-600 italic mt-1">Catatan: &ldquo;{selectedPatient.outcome_notes}&rdquo;</p>
                  )}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi Pemeriksaan Antrian:</h3>

                <div className="flex flex-wrap gap-2.5">
                  {/* Check-in Trigger */}
                  {selectedPatient.status === "Waiting" && (
                    <button
                      onClick={() => handleProcessCheckIn(selectedPatient.number)}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Konfirmasi Check-in Manual
                    </button>
                  )}

                  {/* Call Patient */}
                  <button
                    onClick={async () => {
                      const res = await callPatient(selectedPatient.id);
                      setQueue((prev) => prev.map((q) => (q.id === res.id ? { ...q, status: res.status } : q)));
                      setSelectedPatient((prev) => (prev ? { ...prev, status: res.status } : null));
                      showToast(`Memanggil pasien ${selectedPatient.patient_name}`, "success");
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Panggil Pasien
                  </button>

                  {/* Skip Patient */}
                  <button
                    onClick={async () => {
                      const res = await skipPatient(selectedPatient.id);
                      setQueue((prev) => prev.map((q) => (q.id === res.id ? { ...q, status: res.status } : q)));
                      setSelectedPatient((prev) => (prev ? { ...prev, status: res.status } : null));
                      showToast(`Pasien ${selectedPatient.patient_name} dilewati`, "warning");
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <SkipForward className="w-3.5 h-3.5" /> Lewati (Skip)
                  </button>

                  {/* Finish Consultation Trigger */}
                  <button
                    onClick={() => {
                      setFinishModalPatient(selectedPatient);
                      setOutcomeType("Done");
                      setReferralPoli("Jantung");
                      setReferralDoctor("dr. Ahmad Sp.JP");
                      setReferralDate(new Date().toISOString().split("T")[0]);
                      setReferralNotes("");
                    }}
                    className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Selesai Konsultasi Dokter
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <ClipboardList className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-semibold">Pilih pasien di sebelah kiri untuk melihat detail &amp; memproses antrian.</p>
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────
          MODAL: CAMERA QR SCANNER & MANUAL CODE INPUT
      ─────────────────────────────────────────────────────────────────── */}
      <Dialog
        isOpen={showScannerModal}
        onClose={handleCloseScanner}
        title={<span className="flex items-center gap-2"><QrCode className="w-4 h-4" /> Scan QR Code Kehadiran Pasien</span>}
        confirmLabel="Tutup"
        onConfirm={handleCloseScanner}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Arahkan kamera ke layar HP atau tiket cetak QR Code pasien.
          </p>

          {/* Camera Viewport */}
          <div className="relative bg-slate-950 rounded-xl overflow-hidden min-h-[260px] flex flex-col items-center justify-center border-2 border-slate-800">
            <div id="reader" className="w-full max-w-[320px] rounded-lg overflow-hidden" />

            {scannerError && (
              <div className="p-4 text-center space-y-2 text-amber-400 text-xs flex items-center gap-2 justify-center">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{scannerError}</span>
              </div>
            )}

            {isScanningActive && (
              <span className="absolute bottom-2 text-[11px] bg-slate-900/80 text-emerald-400 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                Kamera Aktif &bull; Menunggu QR...
              </span>
            )}
          </div>

          {/* Fallback Manual Code Input */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <label htmlFor="manual-code-input" className="text-xs font-bold text-slate-700">Atau Ketik Manual Nomor Antrian / NIK:</label>
            <div className="flex gap-2">
              <input
                id="manual-code-input"
                type="text"
                placeholder="Contoh: U001, J001, atau 367401..."
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 uppercase font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => {
                  if (!manualCodeInput) return;
                  handleProcessCheckIn(manualCodeInput);
                  handleCloseScanner();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cari &amp; Check-in
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────────────
          MODAL: CHECK-IN SUCCESS & FLOOR NOTIFICATION
      ─────────────────────────────────────────────────────────────────── */}
      <Dialog
        isOpen={!!checkInSuccessInfo}
        onClose={() => setCheckInSuccessInfo(null)}
        title={<span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Pasien Berhasil Check-in!</span>}
        confirmLabel="Mengerti, Arahkan Pasien"
        onConfirm={() => setCheckInSuccessInfo(null)}
      >
        {checkInSuccessInfo && (
          <div className="space-y-4 text-slate-800">
            <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-xl p-4 text-center space-y-2">
              <span className="text-3xl font-black text-emerald-700 tracking-wider">
                {checkInSuccessInfo.queueNumber}
              </span>
              <p className="font-extrabold text-base text-slate-900">{checkInSuccessInfo.patientName}</p>
              <span className="inline-block text-xs font-bold bg-white text-emerald-800 px-3 py-0.5 rounded-full border border-emerald-300">
                Poli {checkInSuccessInfo.poli}
              </span>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> SILAKAN ARAHKAN PASIEN KE:
              </span>
              <p className="text-base font-black text-emerald-300">{checkInSuccessInfo.floorInfo}</p>
              <p className="text-xs text-slate-300">
                Harap menunggu di ruang tunggu depan poli hingga nomor antrian dipanggil oleh perawat.
              </p>
            </div>
          </div>
        )}
      </Dialog>

      {/* ───────────────────────────────────────────────────────────────────
          MODAL: "SELESAI" KONSULTASI & OUTCOME (RAWAT / RUJUKAN SPESIALIS)
      ─────────────────────────────────────────────────────────────────── */}
      <Dialog
        isOpen={!!finishModalPatient}
        onClose={handleCloseFinishModal}
        title={`Tindak Lanjut Pemeriksaan: ${finishModalPatient?.patient_name}`}
        confirmLabel={isSubmittingOutcome ? "Menyimpan..." : "Simpan & Selesaikan"}
        cancelLabel="Batal"
        onConfirm={handleSaveOutcome}
      >
        {finishModalPatient && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pilih Hasil Konsultasi / Tindak Lanjut:
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setOutcomeType("Done")}
                  className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${outcomeType === "Done"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Selesai Normal</span>
                  <p className="text-[11px] font-normal text-slate-500 mt-0.5">Pulang / tebus obat farmasi</p>
                </button>

                <button
                  type="button"
                  onClick={() => setOutcomeType("RujukanSpesialis")}
                  className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${outcomeType === "RujukanSpesialis"
                    ? "bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-400"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <span className="flex items-center gap-1.5"><ArrowRightLeft className="w-4 h-4 text-teal-600" /> Rujuk ke Spesialis</span>
                  <p className="text-[11px] font-normal text-slate-500 mt-0.5">Dari Dokter Umum ke Dokter Spesialis</p>
                </button>

                <button
                  type="button"
                  onClick={() => setOutcomeType("RawatInap")}
                  className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${outcomeType === "RawatInap"
                    ? "bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-400"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <span className="flex items-center gap-1.5"><Hospital className="w-4 h-4 text-rose-600" /> Rawat Inap</span>
                  <p className="text-[11px] font-normal text-slate-500 mt-0.5">Kamar rawat / observasi ICU</p>
                </button>

                <button
                  type="button"
                  onClick={() => setOutcomeType("RawatJalan")}
                  className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${outcomeType === "RawatJalan"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-400"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <span className="flex items-center gap-1.5"><PersonStanding className="w-4 h-4 text-indigo-600" /> Rawat Jalan</span>
                  <p className="text-[11px] font-normal text-slate-500 mt-0.5">Jadwalkan kontrol berkala</p>
                </button>
              </div>
            </div>

            {/* Input WA Keluarga — tampil saat RawatInap atau RawatJalan dipilih */}
            {(outcomeType === "RawatInap" || outcomeType === "RawatJalan") && (
              <div className="p-4 bg-blue-50/70 border border-blue-300 rounded-xl space-y-3">
                <span className="font-extrabold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  📱 KONTAK KELUARGA PASIEN (WHATSAPP)
                </span>
                <p className="text-[11px] text-blue-700 font-medium">
                  Nomor ini akan dihubungkan dengan WhatsApp dokter yang bertugas. Admin dapat langsung membuka chat WA setelah menyimpan.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="family-wa-name" className="text-[11px] font-bold text-slate-700">Nama Keluarga:</label>
                    <input
                      id="family-wa-name"
                      type="text"
                      placeholder="mis. Budi (ayah)"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="family-wa-phone" className="text-[11px] font-bold text-slate-700">No. WA yang dapat dihubungi: </label>
                    <input
                      id="family-wa-phone"
                      type="tel"
                      placeholder="0812xxxxxxxx"
                      value={familyPhone}
                      onChange={(e) => setFamilyPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                      className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Tombol WA setelah submit berhasil */}
                {waResult && (
                  <div className="pt-2 space-y-2">
                    <p className="text-[11px] font-bold text-emerald-800">✅ Data disimpan! Buka WhatsApp:</p>
                    <div className="flex flex-wrap gap-2">
                      {waResult.familyUrl && (
                        <a
                          href={waResult.familyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          💬 Chat Keluarga Pasien
                        </a>
                      )}
                      {waResult.doctorUrl && (
                        <a
                          href={waResult.doctorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          🩺 Notifikasi ke Dokter
                        </a>
                      )}
                      <button
                        onClick={handleCloseFinishModal}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If Referral to Specialist Chosen */}
            {outcomeType === "RujukanSpesialis" && (
              <div className="p-4 bg-teal-50/70 border border-teal-300 rounded-xl space-y-3">
                <span className="font-extrabold text-teal-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" /> Pengaturan Rujukan Dokter Spesialis (Tanpa QR):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="referral-poli-select" className="text-[11px] font-bold text-slate-700">Poli Spesialis Tujuan:</label>
                    <select
                      id="referral-poli-select"
                      value={referralPoli}
                      onChange={(e) => {
                        setReferralPoli(e.target.value);
                        setReferralDoctor(`dr. Ahli ${e.target.value} Sp.${e.target.value.slice(0, 2)}`);
                      }}
                      className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-teal-500"
                    >
                      <option value="Jantung">Poli Jantung (Sp.JP)</option>
                      <option value="Penyakit Dalam">Poli Penyakit Dalam (Sp.PD)</option>
                      <option value="Anak">Poli Anak (Sp.A)</option>
                      <option value="Mata">Poli Mata (Sp.M)</option>
                      <option value="Saraf">Poli Saraf (Sp.N)</option>
                      <option value="Bedah">Poli Bedah (Sp.B)</option>
                      <option value="Kandungan">Poli Kandungan (Sp.OG)</option>
                      <option value="THT-KL">Poli THT-KL</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="referral-doctor-input" className="text-[11px] font-bold text-slate-700">Dokter Spesialis:</label>
                    <input
                      id="referral-doctor-input"
                      type="text"
                      value={referralDoctor}
                      onChange={(e) => setReferralDoctor(e.target.value)}
                      className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="referral-date-input" className="text-[11px] font-bold text-slate-700">Jadwal Bertemu:</label>
                    <input
                      id="referral-date-input"
                      type="date"
                      value={referralDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setReferralDate(e.target.value)}
                      className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>
                  <div className="flex items-center pt-4">
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2.5 py-1.5 rounded-lg border border-teal-300 flex items-center gap-1.5">
                      <Zap className="w-3 h-3" /> Langsung Disetujui (No QR)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-teal-200 rounded-lg text-[11px] text-teal-800 flex items-start gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Pasien dapat langsung menuju poli spesialis pada tanggal yang dipilih tanpa perlu scan QR lagi, cukup menunjukkan <strong>Nomor Rekam Medis</strong>.</span>
                </div>
              </div>
            )}

            {/* Medical / Diagnosis Notes */}
            <div>
              <label htmlFor="referral-notes-input" className="text-xs font-bold text-slate-700">Catatan Diagnosa / Instruksi Dokter:</label>
              <textarea
                id="referral-notes-input"
                rows={2}
                placeholder="Misal: Pasien memerlukan evaluasi EKG dan USG Jantung lanjutan..."
                value={referralNotes}
                onChange={(e) => setReferralNotes(e.target.value)}
                className="w-full mt-1 p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* ───────────────────────────────────────────────────────────────────
          MODAL: BOOKING DOKTER SPESIALIS LANGSUNG (TANPA QR)
      ─────────────────────────────────────────────────────────────────── */}
      <Dialog
        isOpen={showDirectSpecialistModal}
        onClose={() => setShowDirectSpecialistModal(false)}
        title={<span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Tambah Antrian Spesialis (Langsung Tanpa QR)</span>}
        confirmLabel="Setujui &amp; Buat Antrian"
        cancelLabel="Batal"
        onConfirm={() => {
          const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
          handleCreateDirectSpecialist(fakeEvent);
        }}
      >
        <div className="space-y-3 text-xs sm:text-sm text-slate-800">
          <p className="text-xs text-slate-500">
            Gunakan formulir ini untuk pasien yang dirujuk langsung oleh dokter umum atau datang khusus ke poli spesialis tanpa tiket QR.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="direct-patient-name" className="text-xs font-bold text-slate-700">Nama Pasien *</label>
              <input
                id="direct-patient-name"
                type="text"
                required
                placeholder="Nama lengkap pasien"
                value={directForm.patient_name}
                onChange={(e) => setDirectForm((prev) => ({ ...prev, patient_name: e.target.value }))}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="direct-patient-nik" className="text-xs font-bold text-slate-700">NIK (16 Digit) *</label>
              <input
                id="direct-patient-nik"
                type="text"
                required
                placeholder="367401xxxxxxxxxx"
                maxLength={16}
                value={directForm.nik}
                onChange={(e) => setDirectForm((prev) => ({ ...prev, nik: e.target.value.replace(/\D/g, "") }))}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="direct-referred-poli" className="text-xs font-bold text-slate-700">Poli Spesialis Tujuan</label>
              <select
                id="direct-referred-poli"
                value={directForm.referred_to_poli}
                onChange={(e) =>
                  setDirectForm((prev) => ({
                    ...prev,
                    referred_to_poli: e.target.value,
                    referred_to_doctor: `dr. Ahli ${e.target.value} Sp.${e.target.value.slice(0, 2)}`,
                  }))
                }
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Jantung">Poli Jantung</option>
                <option value="Penyakit Dalam">Poli Penyakit Dalam</option>
                <option value="Anak">Poli Anak</option>
                <option value="Mata">Poli Mata</option>
                <option value="Saraf">Poli Saraf</option>
                <option value="Bedah">Poli Bedah</option>
                <option value="Kandungan">Poli Kandungan</option>
              </select>
            </div>
            <div>
              <label htmlFor="direct-referred-doctor" className="text-xs font-bold text-slate-700">Dokter Spesialis</label>
              <input
                id="direct-referred-doctor"
                type="text"
                value={directForm.referred_to_doctor}
                onChange={(e) => setDirectForm((prev) => ({ ...prev, referred_to_doctor: e.target.value }))}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label htmlFor="direct-referred-date" className="text-xs font-bold text-slate-700">Tanggal Kunjungan</label>
            <input
              id="direct-referred-date"
              type="date"
              value={directForm.referred_date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDirectForm((prev) => ({ ...prev, referred_date: e.target.value }))}
              className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
