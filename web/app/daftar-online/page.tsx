"use client";

/**
 * Daftar Online — RSU Tangsel Care
 * Multi-step form: ①Poli → ②Dokter & Jadwal → ③Data Diri → ④Konfirmasi
 * Design.md §6.2
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/components/ui/toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { Dialog } from "@/components/ui/dialog";
import { Card, CardBody } from "@/components/ui/card";
import { doctorsApi } from "@/services/doctors";
import { schedulesApi, type DoctorSchedule } from "@/services/schedules";
import { registrationApi } from "@/services/registration";

// ─── Hari ─────────────────────────────────────────────────────────────────────

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PAYMENT_LABEL: Record<string, string> = {
  bpjs: "BPJS",
  umum: "Umum / Mandiri",
  asuransi: "Asuransi Swasta",
};

function weekdayOf(dateStr: string): string {
  return WEEKDAY_NAMES[new Date(`${dateStr}T00:00:00`).getDay()];
}

/** Generate slot jam dari jadwal dokter (start → end, per jam). */
function scheduleSlots(schedule: DoctorSchedule): string[] {
  const start = schedule.start_time.slice(0, 5);
  if (!schedule.end_time) return [start];
  const slots: string[] = [];
  let h = Number(start.split(":")[0]);
  const m = Number(start.split(":")[1]);
  const [eh, em] = schedule.end_time.slice(0, 5).split(":").map(Number);
  while (h * 60 + m < eh * 60 + em) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    h += 1;
  }
  return slots.length > 0 ? slots : [start];
}

// ─── Tipe form data ───────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  poli: string;
  // Step 2
  dokter: string;
  tanggal: string;
  jam: string;
  // Step 3
  nik: string;
  nama: string;
  tanggal_lahir: string;
  no_hp: string;
  alamat: string;
  jenis_pembayaran: string;
}

interface FormErrors {
  [key: string]: string;
}

// ─── Validasi ─────────────────────────────────────────────────────────────────

function validateStep(step: number, data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (step === 0) {
    if (!data.poli) errors.poli = "Pilih poli terlebih dahulu";
  }
  if (step === 1) {
    if (!data.dokter) errors.dokter = "Pilih dokter terlebih dahulu";
    if (!data.tanggal) errors.tanggal = "Pilih tanggal kunjungan";
    if (!data.jam) errors.jam = "Pilih jadwal waktu";
  }
  if (step === 2) {
    if (!data.nik) errors.nik = "NIK wajib diisi";
    else if (!/^\d{16}$/.test(data.nik)) errors.nik = "NIK harus 16 digit angka";
    if (!data.nama) errors.nama = "Nama lengkap wajib diisi";
    if (!data.tanggal_lahir) errors.tanggal_lahir = "Tanggal lahir wajib diisi";
    if (!data.no_hp) errors.no_hp = "Nomor HP wajib diisi";
    else if (!/^[0-9+\-\s()]{8,15}$/.test(data.no_hp)) errors.no_hp = "Nomor HP tidak valid";
    if (!data.jenis_pembayaran) errors.jenis_pembayaran = "Pilih jenis pembayaran";
  }
  return errors;
}

// ─── Komponen step ────────────────────────────────────────────────────────────

function Step1Poli({
  data,
  errors,
  onChange,
  poliOptions,
}: {
  data: FormData;
  errors: FormErrors;
  onChange: (field: keyof FormData, value: string) => void;
  poliOptions: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <Select
        id="poli"
        label={t("booking.field.poli")}
        required
        placeholder="— Pilih Poli —"
        options={poliOptions}
        value={data.poli}
        onChange={(e) => onChange("poli", e.target.value)}
        error={errors.poli}
      />
    </div>
  );
}

function Step2DokterJadwal({
  data,
  errors,
  onChange,
  doctors,
  schedules,
}: {
  data: FormData;
  errors: FormErrors;
  onChange: (field: keyof FormData, value: string) => void;
  doctors: { id: number; name: string; specialty: string }[];
  schedules: DoctorSchedule[];
}) {
  const { t } = useI18n();
  const dokterList = doctors.filter((d) => d.specialty === data.poli);
  const jamList = data.dokter && data.tanggal
    ? Array.from(
        new Set(
          schedules
            .filter((s) => s.doctor_id === Number(data.dokter) && s.day_of_week === weekdayOf(data.tanggal))
            .flatMap((s) => scheduleSlots(s)),
        ),
      )
    : [];

  return (
    <div className="space-y-4">
      <Select
        id="dokter"
        label={t("booking.field.dokter")}
        required
        placeholder="— Pilih Dokter —"
        options={dokterList.map((d) => ({ value: String(d.id), label: d.name }))}
        value={data.dokter}
        onChange={(e) => {
          onChange("dokter", e.target.value);
          onChange("jam", ""); // reset jam saat ganti dokter
        }}
        error={errors.dokter}
      />
      <Input
        id="tanggal"
        label={t("booking.field.tanggal")}
        type="date"
        required
        value={data.tanggal}
        onChange={(e) => {
          onChange("tanggal", e.target.value);
          onChange("jam", ""); // reset jam saat ganti tanggal
        }}
        error={errors.tanggal}
        min={new Date().toISOString().split("T")[0]}
      />
      <Select
        id="jam"
        label={t("booking.field.jam")}
        required
        placeholder={data.dokter ? "— Pilih Waktu —" : "Pilih dokter dulu"}
        options={jamList.map((j) => ({ value: j, label: j }))}
        value={data.jam}
        onChange={(e) => onChange("jam", e.target.value)}
        error={errors.jam}
        disabled={!data.dokter}
      />
    </div>
  );
}

function Step3DataDiri({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: FormErrors;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <Input
        id="nik"
        label={t("booking.field.nik")}
        required
        placeholder="16 digit NIK"
        maxLength={16}
        inputMode="numeric"
        value={data.nik}
        onChange={(e) => onChange("nik", e.target.value.replace(/\D/g, ""))}
        error={errors.nik}
      />
      <Input
        id="nama"
        label={t("booking.field.nama")}
        required
        placeholder="Sesuai KTP"
        value={data.nama}
        onChange={(e) => onChange("nama", e.target.value)}
        error={errors.nama}
      />
      <Input
        id="tanggal_lahir"
        label={t("booking.field.tanggal_lahir")}
        type="date"
        required
        value={data.tanggal_lahir}
        onChange={(e) => onChange("tanggal_lahir", e.target.value)}
        error={errors.tanggal_lahir}
      />
      <Input
        id="no_hp"
        label={t("booking.field.no_hp")}
        required
        type="tel"
        placeholder="08xx-xxxx-xxxx"
        inputMode="tel"
        value={data.no_hp}
        onChange={(e) => onChange("no_hp", e.target.value)}
        error={errors.no_hp}
      />
      <Textarea
        id="alamat"
        label={t("booking.field.alamat")}
        placeholder="Alamat lengkap"
        value={data.alamat}
        onChange={(e) => onChange("alamat", e.target.value)}
        error={errors.alamat}
      />
      <Select
        id="jenis_pembayaran"
        label={t("booking.field.pembayaran")}
        required
        placeholder="— Pilih Jenis Pembayaran —"
        options={Object.entries(PAYMENT_LABEL).map(([value, label]) => ({ value, label }))}
        value={data.jenis_pembayaran}
        onChange={(e) => onChange("jenis_pembayaran", e.target.value)}
        error={errors.jenis_pembayaran}
      />
    </div>
  );
}

function Step4Konfirmasi({
  data,
  doctors,
  poliOptions,
}: {
  data: FormData;
  doctors: { id: number; name: string; specialty: string }[];
  poliOptions: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const dokterLabel = doctors.find((d) => d.id === Number(data.dokter))?.name ?? data.dokter;
  const poliLabel = poliOptions.find((p) => p.value === data.poli)?.label ?? data.poli;
  const pembayaranLabel = PAYMENT_LABEL[data.jenis_pembayaran] ?? data.jenis_pembayaran;

  const rows = [
    { label: t("booking.field.poli"), value: poliLabel },
    { label: t("booking.field.dokter"), value: dokterLabel },
    { label: t("booking.field.tanggal"), value: data.tanggal },
    { label: t("booking.field.jam"), value: data.jam },
    { label: t("booking.field.nik"), value: data.nik },
    { label: t("booking.field.nama"), value: data.nama },
    { label: t("booking.field.tanggal_lahir"), value: data.tanggal_lahir },
    { label: t("booking.field.no_hp"), value: data.no_hp },
    { label: t("booking.field.alamat"), value: data.alamat || "—" },
    { label: t("booking.field.pembayaran"), value: pembayaranLabel },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{t("booking.step4.desc")}</p>
      <div className="divide-y divide-border border border-border rounded-md overflow-hidden bg-background">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-4 px-4 py-3 text-sm">
            <span className="w-36 shrink-0 text-muted-foreground">{row.label}</span>
            <span className="font-medium text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Halaman utama ────────────────────────────────────────────────────────────

const INITIAL_FORM: FormData = {
  poli: "", dokter: "", tanggal: "", jam: "",
  nik: "", nama: "", tanggal_lahir: "", no_hp: "", alamat: "", jenis_pembayaran: "",
};

interface SuccessResult {
  nomor_antrian: string;
  qr_code?: string;
}

export default function DaftarOnlinePage() {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SuccessResult | null>(null);

  const [doctors, setDoctors] = useState<{ id: number; name: string; specialty: string }[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [doctorList, scheduleList] = await Promise.all([
        doctorsApi.getAll(),
        schedulesApi.getAll(),
      ]);
      setDoctors(doctorList.filter((d) => d.status === "active"));
      setSchedules(scheduleList);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat data dokter.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const poliOptions = Array.from(new Set(doctors.map((d) => d.specialty).filter(Boolean)))
    .sort()
    .map((s) => ({ value: s, label: s }));

  const stepLabels = [
    t("booking.step1.label"),
    t("booking.step2.label"),
    t("booking.step3.label"),
    t("booking.step4.label"),
  ];

  const stepTitles = [
    t("booking.step1.title"),
    t("booking.step2.title"),
    t("booking.step3.title"),
    t("booking.step4.title"),
  ];

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
    }
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (currentStep === 3) {
      setShowConfirm(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    try {
      const res = await registrationApi.register({
        nik: formData.nik,
        name: formData.nama,
        birth_date: formData.tanggal_lahir || undefined,
        address: formData.alamat || undefined,
        phone_number: formData.no_hp,
        doctor_id: Number(formData.dokter),
        schedule_date: formData.tanggal,
        time: formData.jam || undefined,
        payment_type: PAYMENT_LABEL[formData.jenis_pembayaran] ?? "Umum",
      });
      setResult({
        nomor_antrian: res.queue_number,
        qr_code: res.qr_code,
      });
      showToast(t("booking.success.title"), "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("error.generic");
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Halaman sukses ────────────────────────────────────────────────────────

  if (result) {
    return (
      <div
        className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 text-center"
        style={{ maxWidth: "600px" }}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 mb-5">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("booking.success.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("booking.success.desc")}</p>
        <div className="mt-4 inline-block px-6 py-3 bg-muted border border-border rounded-md">
          <span className="text-3xl font-semibold text-primary tracking-widest">
            {result.nomor_antrian}
          </span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("booking.success.instruction")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => { setResult(null); setFormData(INITIAL_FORM); setCurrentStep(0); }}>
            Daftar Lagi
          </Button>
          <Link href="/" className={buttonVariants({ variant: "primary" })}>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // ─── Form multi-step ──────────────────────────────────────────────────────

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
      style={{ maxWidth: "640px" }}
    >
      <h1 className="text-2xl font-semibold text-foreground mb-6">
        {t("booking.title")}
      </h1>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Memuat data dokter...</div>
      ) : loadError ? (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {loadError}{" "}
          <button onClick={loadData} className="underline font-semibold ml-1">Coba lagi</button>
        </div>
      ) : poliOptions.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Belum ada poli yang tersedia.</div>
      ) : (
      <>
        {/* Stepper */}
        <Stepper steps={stepLabels} currentStep={currentStep} />

        {/* Step content */}
        <Card className="mt-8 shadow-sm border-border">
          <CardBody className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {stepTitles[currentStep]}
            </h2>

            <div className="pt-2">
              {currentStep === 0 && <Step1Poli data={formData} errors={errors} onChange={handleChange} poliOptions={poliOptions} />}
              {currentStep === 1 && <Step2DokterJadwal data={formData} errors={errors} onChange={handleChange} doctors={doctors} schedules={schedules} />}
              {currentStep === 2 && <Step3DataDiri data={formData} errors={errors} onChange={handleChange} />}
              {currentStep === 3 && <Step4Konfirmasi data={formData} doctors={doctors} poliOptions={poliOptions} />}
            </div>
          </CardBody>
        </Card>

        {/* Sticky nav buttons — Design.md §6.2 */}
        <div className="
          sticky bottom-0 mt-6 py-4
          flex flex-col-reverse sm:flex-row gap-3
          bg-background/95 backdrop-blur-xs border-t border-border
          -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 shadow-xs
        ">
          {currentStep > 0 && (
            <Button variant="ghost" size="lg" className="w-full sm:w-auto" onClick={handleBack}>
              {t("booking.btn_back")}
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto sm:ml-auto"
            onClick={handleNext}
            isLoading={isSubmitting}
            id={currentStep === 3 ? "btn-submit-booking" : `btn-next-step-${currentStep + 1}`}
          >
            {currentStep === 3 ? t("booking.btn_submit") : t("booking.btn_next")}
          </Button>
        </div>

        {/* Confirm dialog */}
        <Dialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          title={t("booking.confirm_title")}
          confirmLabel={t("booking.confirm_yes")}
          cancelLabel={t("booking.confirm_cancel")}
          onConfirm={handleSubmit}
        >
          <p>{t("booking.confirm_desc")}</p>
        </Dialog>
      </>
      )}
    </div>
  );
}
