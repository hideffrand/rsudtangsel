"use client";

/**
 * Daftar Antrian Online - RSU Tangsel Care
 * Flow Alur Pendaftaran (3 Step - Light Theme):
 * ① Identitas & Keluhan (Form Identitas + Pilih Gejala / Typewriter + Auto Remember)
 * ② Dokter & Slot (Pilih Dokter & Slot Jam Praktik - Kuota 8 per Dokter)
 * ③ Konfirmasi & QR (Ringkasan Booking + Unduh QR Code SVG)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useToast, toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  User,
  Hospital,
  AlertTriangle,
  CalendarDays,
  Clock,
  Download,
  Info,
  Stethoscope,
  Target,
  Rocket,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Stepper } from "@/components/ui/stepper";
import { Dialog } from "@/components/ui/dialog";
import { Card, CardBody } from "@/components/ui/card";
import { doctorsApi, type Doctor } from "@/services/doctors";
import { poliApi, type Poli } from "@/services/poli";
import { registrationApi } from "@/services/registration";
import { schedulesApi, type DoctorSchedule } from "@/services/schedules";
import { getFloorForPoli } from "@/services/queue";

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const LOCAL_STORAGE_KEY = "rsud_patient_profile";



const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getDayName(dateStr: string): string {
  return WEEKDAY_NAMES[new Date(`${dateStr}T00:00:00`).getDay()];
}

interface PatientIdentity {
  nik: string;
  nama: string;
  tanggal_lahir: string;
  no_hp: string;
  alamat: string;
  jenis_pembayaran: string;
}

interface BookingState {
  // Step 0: Gejala / Poli
  selectedPoliId: string;
  selectedPoliName: string;
  symptomType: "specific" | "umum" | "unknown";
  
  // Step 1: Dokter & Slot
  selectedDoctorId: number | null;
  selectedDoctorName: string;
  selectedDate: string;
  selectedTime: string;
  
  // Step 0/2: Pasien
  patient: PatientIdentity;
}

const DEFAULT_PATIENT: PatientIdentity = {
  nik: "",
  nama: "",
  tanggal_lahir: "",
  no_hp: "",
  alamat: "",
  jenis_pembayaran: "umum",
};

const DEFAULT_BOOKING: BookingState = {
  selectedPoliId: "",
  selectedPoliName: "",
  symptomType: "specific",
  selectedDoctorId: null,
  selectedDoctorName: "",
  selectedDate: new Date().toISOString().split("T")[0],
  selectedTime: "",
  patient: DEFAULT_PATIENT,
};

interface BookingResult {
  queue_number: string;
  qr_code_payload: string;
  poli: string;
  doctor_name: string;
  date: string;
  time: string;
  floor_info: string;
  patient_name: string;
  nik: string;
  phone_number: string;
}

// ─── Typewriter Hook ─────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 40) {
  const [displayText, setDisplayText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let index = 0;
    const timer = setTimeout(() => {
      setDisplayText("");
      setIsDone(false);
    }, 0);

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        setIsDone(true);
        clearInterval(interval);
      }
    }, speed);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [text, speed]);

  return { displayText, isDone };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DaftarOnlinePage() {
  const { showToast } = useToast();

  // Navigation & Data States
  const [currentStep, setCurrentStep] = useState(0);
  const [booking, setBooking] = useState<BookingState>(DEFAULT_BOOKING);


  // Master Data
  const [polis, setPolis] = useState<Poli[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Loading Transition
  const [isMatchingSlots, setIsMatchingSlots] = useState(false);

  // Submission & Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const qrRef = useRef<SVGSVGElement | null>(null);

  // ─── 1. Load LocalStorage Profile ──────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PatientIdentity;
        if (parsed.nik && parsed.nama) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setBooking((prev) => ({ ...prev, patient: parsed }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // ─── 2. Fetch Master Data ──────────────────────────────────────────────────
  const [masterDataError, setMasterDataError] = useState("");
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);

  const fetchMasterData = useCallback(async () => {
    setLoadingData(true);
    setMasterDataError("");
    try {
      const [poliList, docList, scheduleList] = await Promise.all([
        poliApi.getAll(),
        doctorsApi.getAll(),
        schedulesApi.getAll(),
      ]);

      setPolis(poliList);
      setDoctors(docList.filter((d) => d.status === "active"));
      setSchedules(scheduleList);
    } catch {
      setPolis([]);
      setDoctors([]);
      setSchedules([]);
      setMasterDataError(
        "Gagal memuat data poli & dokter dari server. Pastikan koneksi tersedia lalu coba lagi."
      );
      toast.error(
        "Gagal memuat data poli & dokter dari server. Periksa koneksi Anda."
      );    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMasterData();
  }, [fetchMasterData]);

  // ─── 3. Dropdown Options for Step 0 ────────────────────────────────────────
  const symptomDropdownOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    polis.forEach((p) => {
      options.push({
      value: `poli_${p.id}`,
      label: `${p.name} — ${p.description || "Spesialis"}`,
    });
    });

    options.push({
      value: "symptom_umum",
      label: "Umum (demam, batuk, pusing, flu, lemas, nyeri kepala)",
    });
    options.push({
      value: "symptom_unknown",
      label: "Masih belum tahu gejalanya (Skrining Awal Dokter Umum)",
    });

    return options;
  }, [polis]);

  // ─── 4. Filter Doctors & Available Slots for Step 1 ────────────────────────
  const availableDoctors = useMemo(() => {
    if (!booking.selectedPoliId && booking.symptomType === "specific") return [];

    let targetPoliId: number | null = null;

    if (booking.symptomType === "umum" || booking.symptomType === "unknown") {
      const umumPoli = polis.find((p) => p.name.toLowerCase().includes("umum"));
      targetPoliId = umumPoli ? umumPoli.id : null;
    } else {
      targetPoliId = Number(booking.selectedPoliId);
    }

    return doctors.filter((d) => d.poli_id === targetPoliId);
  }, [booking.selectedPoliId, booking.symptomType, doctors, polis]);

  // Slot praktik diambil dari jadwal dokter asli (GET /api/schedules) yang
  // cocok dengan hari dari tanggal kunjungan terpilih.
  const getDoctorSlots = useCallback(
    (doctorId: number): { time: string; quota: number }[] => {
      const dayName = getDayName(booking.selectedDate);
      return schedules
        .filter((s) => s.doctor_id === doctorId && s.day_of_week === dayName)
        .map((s) => ({
          time: `${s.start_time.slice(0, 5)}${s.end_time ? ` - ${s.end_time.slice(0, 5)}` : " - Selesai"}`,
          quota: s.quota,
        }));
    },
    [booking.selectedDate, schedules]
  );

  // ─── Step 0 Handlers ───────────────────────────────────────────────────────
  const handlePoliSelect = (value: string) => {
    if (value === "symptom_umum") {
      const umumPoli = polis.find((p) => p.name.toLowerCase().includes("umum")) || polis[0];
      setBooking((prev) => ({
        ...prev,
        selectedPoliId: String(umumPoli?.id || 1),
        selectedPoliName: "Poli Umum",
        symptomType: "umum",
        selectedDoctorId: null,
        selectedTime: "",
      }));
    } else if (value === "symptom_unknown") {
      const umumPoli = polis.find((p) => p.name.toLowerCase().includes("umum")) || polis[0];
      setBooking((prev) => ({
        ...prev,
        selectedPoliId: String(umumPoli?.id || 1),
        selectedPoliName: "Poli Umum (Skrining Gejala)",
        symptomType: "unknown",
        selectedDoctorId: null,
        selectedTime: "",
      }));
    } else {
      const cleanId = value.replace("poli_", "");
      const selected = polis.find((p) => String(p.id) === cleanId);
      setBooking((prev) => ({
        ...prev,
        selectedPoliId: cleanId,
        selectedPoliName: selected?.name || "Poli Spesialis",
        symptomType: "specific",
        selectedDoctorId: null,
        selectedTime: "",
      }));
    }

    if (errors.poli) {
      setErrors((prev) => { const e = { ...prev }; delete e.poli; return e; });
    }
  };

  const handleStep0Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!booking.patient.nik || !/^\d{16}$/.test(booking.patient.nik)) {
      newErrors.nik = "NIK harus terdiri dari 16 digit angka";
    }
    if (!booking.patient.nama.trim()) {
      newErrors.nama = "Nama lengkap wajib diisi sesuai KTP";
    }
    if (!booking.patient.no_hp || booking.patient.no_hp.length < 9) {
      newErrors.no_hp = "Nomor WhatsApp aktif wajib diisi";
    }
    if (!booking.selectedPoliId && booking.symptomType === "specific") {
      newErrors.poli = "Silakan tentukan poli atau keluhan/gejala Anda";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    // Save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(booking.patient));

    // Transition with animation to Step 1 (Pilih Dokter & Slot)
    setIsMatchingSlots(true);
    setTimeout(() => {
      setIsMatchingSlots(false);
      setCurrentStep(1);
    }, 800);
  };

  // ─── Final Submit Booking ──────────────────────────────────────────────────
  const [submitError, setSubmitError] = useState("");

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Nomor antrian & QR diterbitkan oleh backend (POST /api/online-registration)
      const res = await registrationApi.register({
        nik: booking.patient.nik,
        name: booking.patient.nama,
        birth_date: booking.patient.tanggal_lahir || undefined,
        address: booking.patient.alamat || undefined,
        phone_number: booking.patient.no_hp,
        doctor_id: booking.selectedDoctorId || 0,
        schedule_date: booking.selectedDate,
        time: booking.selectedTime.split(" - ")[0] || "08:00",
        payment_type: booking.patient.jenis_pembayaran,
      });

      setBookingResult({
        queue_number: res.queue_number,
        qr_code_payload: res.queue_number,
        poli: booking.selectedPoliName,
        doctor_name: booking.selectedDoctorName,
        date: booking.selectedDate,
        time: booking.selectedTime,
        floor_info: getFloorForPoli(booking.selectedPoliName),
        patient_name: booking.patient.nama,
        nik: booking.patient.nik,
        phone_number: booking.patient.no_hp,
      });
      showToast("Pendaftaran antrian online berhasil dikonfirmasi!", "success");

      const waText = `*Tiket Antrian RSUD Tangsel*\nNomor: ${res.queue_number}\nPasien: ${booking.patient.nama}\nPoli: ${booking.selectedPoliName}\nDokter: ${booking.selectedDoctorName}\nJadwal: ${booking.selectedDate} (${booking.selectedTime})\nLokasi: ${getFloorForPoli(booking.selectedPoliName)}\n\nHarap tiba 15 menit sebelum slot jam untuk scan QR di meja pendaftaran.`;
      window.open(`https://wa.me/${booking.patient.no_hp.replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`, "_blank");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Pendaftaran gagal. Silakan coba lagi."
      );
      showToast("Pendaftaran antrian gagal. Coba lagi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `Tiket-Antrian-${bookingResult?.queue_number}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    showToast("QR Code berhasil diunduh!", "success");
  };

  const { displayText } = useTypewriter("Sebutkan Gejala Anda Secara Spesifik", 40);

  const stepLabels = [
    "Identitas & Keluhan",
    "Dokter & Slot",
    "Konfirmasi & QR",
  ];

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER: SUCCESS SCREEN WITH QR CODE
  // ───────────────────────────────────────────────────────────────────────────
  if (bookingResult) {
    return (
      <div className="min-h-[80vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-slate-800 flex items-center justify-center border-t border-slate-100">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Pendaftaran Antrian Berhasil!</h1>
            <p className="text-sm text-slate-500 mt-1">Simpan atau screenshot tiket &amp; QR Code di bawah ini untuk check-in di rumah sakit.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NOMOR ANTRIAN ANDA</span>
                <p className="text-3xl font-black text-emerald-600 tracking-wider mt-0.5">{bookingResult.queue_number}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LOKASI PRAKTIK</span>
                <p className="text-xs font-bold text-amber-700 mt-0.5 max-w-[180px]">{bookingResult.floor_info}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center border border-slate-200 shadow-xs">
              <QRCodeSVG
                ref={qrRef}
                value={bookingResult.qr_code_payload}
                size={180}
                level="H"
                includeMargin
              />
              <span className="text-[10px] font-black text-slate-500 mt-2 tracking-widest uppercase">
                Scan saat tiba di RSUD Tangsel
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600 border-t border-slate-200 pt-3">
              <div>
                <span className="text-slate-400">Pasien:</span>
                <p className="font-bold text-slate-800 truncate">{bookingResult.patient_name}</p>
              </div>
              <div>
                <span className="text-slate-400">NIK:</span>
                <p className="font-bold text-slate-800">{bookingResult.nik}</p>
              </div>
              <div>
                <span className="text-slate-400">Poli Tujuan:</span>
                <p className="font-bold text-emerald-600 truncate">{bookingResult.poli}</p>
              </div>
              <div>
                <span className="text-slate-400">Dokter:</span>
                <p className="font-bold text-slate-800 truncate">{bookingResult.doctor_name}</p>
              </div>
              <div>
                <span className="text-slate-400">Tanggal:</span>
                <p className="font-bold text-slate-800">{bookingResult.date}</p>
              </div>
              <div>
                <span className="text-slate-400">Slot Jam:</span>
                <p className="font-bold text-slate-800">{bookingResult.time}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleDownloadQR}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Unduh / Simpan Gambar QR Code
            </button>

            <Link
              href="/"
              className="inline-block text-xs text-slate-400 hover:text-slate-600 underline pt-2"
            >
              Kembali ke Halaman Utama Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MAIN MULTI-STEP FLOW (LIGHT THEME)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[85vh] bg-white py-10 px-4 sm:px-6 lg:px-8 text-slate-800 border-t border-slate-100">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-wider">
            Layanan Pendaftaran Mandiri
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Pendaftaran Antrian Online
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Dapatkan nomor antrian dan jadwal dokter spesialis RSUD Tangsel secara cepat &amp; transparan.
          </p>
        </div>

        {/* Stepper Navigation */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs">
          <Stepper steps={stepLabels} currentStep={currentStep} />
        </div>

        {/* Error memuat data master */}
        {masterDataError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3">
            <span>{masterDataError}</span>
            <button
              onClick={fetchMasterData}
              className="shrink-0 font-bold underline hover:text-red-800"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            STEP 0: IDENTITAS PASIEN & GEJALA/POLI
        ─────────────────────────────────────────────────────────────────── */}
        {currentStep === 0 && (
          <Card className="bg-white border-slate-200 text-slate-800 shadow-md">
            <CardBody className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-150 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" /> Gejala Keluhan Pasien
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pilih jenis gejala atau poli tujuan untuk mencari jadwal dokter.
                </p>
              </div>

              {/* Verified Profile Card from LocalStorage */}
              {/* Profile Card Hidden per user request */}

              <form onSubmit={handleStep0Submit} className="space-y-5">

                {/* Dropdown Gejala / Poli (Typewriter animation text above) */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <div className="text-center py-2">
                    <h3 className="text-lg font-bold text-slate-800 min-h-[1.5rem] flex items-center justify-center gap-1">
                      <span>{displayText}</span>
                      <span className="inline-block w-1 h-5 bg-emerald-500 animate-pulse" />
                    </h3>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="symptom-select-dropdown" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Keluhan / Poli Tujuan Pemeriksaan:
                    </label>
                    <select
                      id="symptom-select-dropdown"
                      value={
                        booking.symptomType === "umum"
                          ? "symptom_umum"
                          : booking.symptomType === "unknown"
                          ? "symptom_unknown"
                          : booking.selectedPoliId
                          ? `poli_${booking.selectedPoliId}`
                          : ""
                      }
                      onChange={(e) => handlePoliSelect(e.target.value)}
                      className="w-full bg-white border border-slate-350 hover:border-emerald-500 focus:border-emerald-500 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none transition-all cursor-pointer shadow-xs"
                    >
                      <option value="" disabled>-- Pilih keluhan / poli tujuan --</option>
                      {symptomDropdownOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.poli && (
                      <p className="text-xs font-bold text-red-500 mt-1">{errors.poli}</p>
                    )}
                  </div>

                  {booking.selectedPoliName && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Hospital className="w-4 h-4 text-emerald-600" />
                        <p className="font-bold text-slate-700">Rute Penanganan: <span className="text-emerald-600">{booking.selectedPoliName}</span></p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-end">
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    disabled={isMatchingSlots || loadingData}
                    className="bg-emerald-650 hover:bg-emerald-500 font-bold px-8 shadow-md"
                  >
                    {isMatchingSlots ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Mencari Jadwal Dokter...
                      </span>
                    ) : (
                    <span className="flex items-center gap-1.5">Lanjut Cari Jadwal Dokter <ChevronRight className="w-4 h-4" /></span>
                  )}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            STEP 1: PILIH DOKTER & SLOT JAM (KUOTA 8 PER DOKTER - LIGHT)
        ─────────────────────────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Poliklinik Terpilih</span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">{booking.selectedPoliName}</h2>
                <p className="text-xs text-slate-500">Pilih tanggal kunjungan dan slot waktu konsultasi yang masih tersedia.</p>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="slot-date-picker" className="text-xs font-bold text-slate-500">Tanggal:</label>
                <input
                  id="slot-date-picker"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={booking.selectedDate}
                  onChange={(e) =>
                    setBooking((prev) => ({
                      ...prev,
                      selectedDate: e.target.value,
                      selectedTime: "",
                    }))
                  }
                  className="bg-white border border-slate-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              {(() => {
                // Hanya tampilkan dokter yang punya jadwal pada tanggal terpilih.
                const doctorsWithSlots = availableDoctors
                  .map((doc) => ({ doc, slots: getDoctorSlots(doc.id) }))
                  .filter((entry) => entry.slots.length > 0);

                if (doctorsWithSlots.length === 0) {
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center space-y-3">
                      <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-800">Tidak ada jadwal dokter untuk tanggal ini</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Dokter spesialis pada poli ini belum membuka jadwal untuk tanggal terpilih. Silakan coba pilih hari berikutnya.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const nextDay = new Date();
                          nextDay.setDate(nextDay.getDate() + 1);
                          setBooking((prev) => ({ ...prev, selectedDate: nextDay.toISOString().split("T")[0] }));
                        }}
                      >
                        <CalendarDays className="w-3.5 h-3.5 mr-1" /> Cek Jadwal Besok
                      </Button>
                    </div>
                  );
                }

                return doctorsWithSlots.map(({ doc, slots }) => {
                  const totalQuota = slots.reduce((sum, s) => sum + s.quota, 0);
                  const isDoctorSelected = booking.selectedDoctorId === doc.id;

                  return (
                    <div
                      key={doc.id}
                      className={`
                        bg-white border rounded-xl p-5 transition-all shadow-xs
                        ${isDoctorSelected ? "border-emerald-550 ring-2 ring-emerald-500/10 bg-slate-50/20" : "border-slate-200 hover:border-slate-300"}
                      `}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{doc.name}</h3>
                            <p className="text-xs text-emerald-600 font-semibold">{doc.specialty}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                            <Target className="w-3 h-3" /> {totalQuota} Kuota Harian
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Pilih Jam Kunjungan Praktik:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {slots.map((slot) => {
                            const isSlotSelected = isDoctorSelected && booking.selectedTime === slot.time;

                            return (
                              <button
                                key={slot.time}
                                type="button"
                                onClick={() => {
                                  setBooking((prev) => ({
                                    ...prev,
                                    selectedDoctorId: doc.id,
                                    selectedDoctorName: doc.name,
                                    selectedTime: slot.time,
                                  }));
                                  if (errors.slot) {
                                    setErrors((prev) => { const e = { ...prev }; delete e.slot; return e; });
                                  }
                                }}
                                className={`
                                  py-2.5 px-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer
                                  ${isSlotSelected
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-slate-900"
                                  }
                                `}
                              >
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {slot.time}</span>
                                <span className={`text-[10px] ${isSlotSelected ? "text-emerald-100" : "text-slate-400"}`}>
                                  Kuota {slot.quota}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                     </div>
                   );
                 });
               })()}

               {errors.slot && (
                <p className="text-xs font-bold text-red-500 text-center">{errors.slot}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setCurrentStep(0)}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke Identitas
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (!booking.selectedDoctorId || !booking.selectedTime) {
                    setErrors({ slot: "Silakan pilih salah satu dokter dan slot jam praktik di atas." });
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="bg-emerald-650 hover:bg-emerald-500 font-bold px-8 flex items-center gap-1.5"
              >
                Lanjut ke Konfirmasi <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            STEP 2: KONFIRMASI DATA & TIKET QR (LIGHT)
        ─────────────────────────────────────────────────────────────────── */}
        {currentStep === 2 && (
          <Card className="bg-white border-slate-200 text-slate-800 shadow-md">
            <CardBody className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-150 pb-4">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-600" /> Ringkasan Konfirmasi Pendaftaran
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pastikan data jadwal dan identitas Anda sudah benar sebelum menerbitkan tiket antrian online.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden text-xs sm:text-sm">
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">Poliklinik Tujuan:</span>
                  <span className="font-extrabold text-emerald-600">{booking.selectedPoliName}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">Dokter Pemeriksa:</span>
                  <span className="font-extrabold text-slate-800">{booking.selectedDoctorName}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">Tanggal Kunjungan:</span>
                  <span className="font-extrabold text-slate-800">{booking.selectedDate} ({getDayName(booking.selectedDate)})</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">Slot Jam Praktik:</span>
                  <span className="font-extrabold text-emerald-600">{booking.selectedTime} WIB</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">Nama Pasien:</span>
                  <span className="font-extrabold text-slate-800">{booking.patient.nama}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">Nomor NIK KTP:</span>
                  <span className="font-mono text-slate-700 font-bold">{booking.patient.nik}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">No. WhatsApp Pasien:</span>
                  <span className="font-mono text-slate-700 font-bold">{booking.patient.no_hp}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">Jenis Pembayaran:</span>
                  <span className="font-extrabold uppercase text-amber-700">{booking.patient.jenis_pembayaran}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-250 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                <span>
                  Tiket QR Code akan otomatis terbit setelah tombol konfirmasi ditekan. Anda dapat mengunduh QR Code atau menunjukkannya langsung ke petugas saat check-in.
                </span>
              </div>

              {submitError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setCurrentStep(1)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSubmitting}
                  className="bg-emerald-650 hover:bg-emerald-500 font-extrabold px-8 py-3.5 shadow-md flex items-center gap-2"
                >
                  {isSubmitting ? "Menerbitkan Tiket..." : <><Rocket className="w-4 h-4" /> Konfirmasi Booking Sekarang</>}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Confirmation Modal */}
        <Dialog
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Konfirmasi Pendaftaran Antrian"
          confirmLabel="Ya, Terbitkan Tiket"
          cancelLabel="Periksa Lagi"
          onConfirm={handleFinalSubmit}
        >
          <div className="space-y-2 text-sm text-slate-750">
            <p>
              Apakah Anda yakin ingin mendaftar ke <strong>{booking.selectedPoliName}</strong> bersama <strong>{booking.selectedDoctorName}</strong> pada tanggal <strong>{booking.selectedDate}</strong> pukul <strong>{booking.selectedTime}</strong>?
            </p>
            <p className="text-xs text-slate-450">
              Sistem akan menerbitkan nomor antrian dan memotong 1 kuota harian dokter.
            </p>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
