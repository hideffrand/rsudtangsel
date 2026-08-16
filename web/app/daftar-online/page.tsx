"use client";

/**
 * Daftar Online — RSU Tangsel Care
 * Multi-step form: ①Poli → ②Dokter & Jadwal → ③Data Diri → ④Konfirmasi
 * Design.md §6.2
 */

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/components/ui/toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { Dialog } from "@/components/ui/dialog";
import { Card, CardBody } from "@/components/ui/card";

// ─── Mock data (nanti ganti fetch dari backend) ───────────────────────────────

const POLI_LIST = [
  { value: "umum", label: "Poli Umum" },
  { value: "gigi", label: "Poli Gigi & Mulut" },
  { value: "anak", label: "Poli Anak" },
  { value: "kandungan", label: "Poli Kandungan & Kebidanan" },
  { value: "penyakit-dalam", label: "Poli Penyakit Dalam" },
  { value: "mata", label: "Poli Mata" },
  { value: "jantung", label: "Poli Jantung" },
  { value: "orthopedi", label: "Poli Orthopedi" },
];

const DOKTER_BY_POLI: Record<string, { value: string; label: string; jadwal: string[] }[]> = {
  umum: [
    { value: "dr-andi", label: "dr. Andi Saputra, Sp.U", jadwal: ["08:00", "09:00", "10:00", "11:00"] },
    { value: "dr-sari", label: "dr. Sari Dewi", jadwal: ["13:00", "14:00", "15:00"] },
  ],
  gigi: [
    { value: "drg-budi", label: "drg. Budi Santoso", jadwal: ["08:00", "09:00", "10:00"] },
    { value: "drg-lisa", label: "drg. Lisa Permata, Sp.KG", jadwal: ["13:00", "14:00"] },
  ],
  anak: [
    { value: "dr-mega", label: "dr. Mega Andini, Sp.A", jadwal: ["08:00", "09:00", "10:00", "11:00"] },
  ],
  kandungan: [
    { value: "dr-ratna", label: "dr. Ratna Kusuma, Sp.OG", jadwal: ["08:00", "09:00", "10:00"] },
  ],
  "penyakit-dalam": [
    { value: "dr-hendra", label: "dr. Hendra Wijaya, Sp.PD", jadwal: ["09:00", "10:00", "11:00"] },
  ],
  mata: [
    { value: "dr-indah", label: "dr. Indah Fitriani, Sp.M", jadwal: ["08:00", "09:00"] },
  ],
  jantung: [
    { value: "dr-bagas", label: "dr. Bagas Pratama, Sp.JP", jadwal: ["10:00", "11:00", "13:00"] },
  ],
  orthopedi: [
    { value: "dr-tono", label: "dr. Sutono Raharjo, Sp.OT", jadwal: ["08:00", "09:00", "10:00"] },
  ],
};

const PEMBAYARAN = [
  { value: "bpjs", label: "BPJS" },
  { value: "umum", label: "Umum / Mandiri" },
  { value: "asuransi", label: "Asuransi Swasta" },
];

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
}: {
  data: FormData;
  errors: FormErrors;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <Select
        id="poli"
        label={t("booking.field.poli")}
        required
        placeholder="— Pilih Poli —"
        options={POLI_LIST}
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
}: {
  data: FormData;
  errors: FormErrors;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  const { t } = useI18n();
  const dokterList = DOKTER_BY_POLI[data.poli] ?? [];
  const selectedDokter = dokterList.find((d) => d.value === data.dokter);
  const jadwalList = selectedDokter
    ? selectedDokter.jadwal.map((j) => ({ value: j, label: j }))
    : [];

  return (
    <div className="space-y-4">
      <Select
        id="dokter"
        label={t("booking.field.dokter")}
        required
        placeholder="— Pilih Dokter —"
        options={dokterList.map((d) => ({ value: d.value, label: d.label }))}
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
        onChange={(e) => onChange("tanggal", e.target.value)}
        error={errors.tanggal}
        min={new Date().toISOString().split("T")[0]}
      />
      <Select
        id="jam"
        label={t("booking.field.jam")}
        required
        placeholder={data.dokter ? "— Pilih Waktu —" : "Pilih dokter dulu"}
        options={jadwalList}
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
        options={PEMBAYARAN}
        value={data.jenis_pembayaran}
        onChange={(e) => onChange("jenis_pembayaran", e.target.value)}
        error={errors.jenis_pembayaran}
      />
    </div>
  );
}

function Step4Konfirmasi({ data }: { data: FormData }) {
  const { t } = useI18n();
  const dokterList = DOKTER_BY_POLI[data.poli] ?? [];
  const dokterLabel = dokterList.find((d) => d.value === data.dokter)?.label ?? data.dokter;
  const poliLabel = POLI_LIST.find((p) => p.value === data.poli)?.label ?? data.poli;
  const pembayaranLabel = PEMBAYARAN.find((p) => p.value === data.jenis_pembayaran)?.label ?? data.jenis_pembayaran;

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/daftar-online`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nik: formData.nik,
          nama: formData.nama,
          tanggal_lahir: formData.tanggal_lahir,
          no_hp: formData.no_hp,
          alamat: formData.alamat,
          poli: formData.poli,
          dokter: DOKTER_BY_POLI[formData.poli]?.find((d) => d.value === formData.dokter)?.label ?? formData.dokter,
          tanggal: formData.tanggal,
          jam: formData.jam,
          jenis_pembayaran: formData.jenis_pembayaran,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? t("error.generic"));
      }

      const json = await res.json();
      setResult({
        nomor_antrian: json.data?.nomor_antrian ?? "A-001",
        qr_code: json.data?.qr_code,
      });
      showToast(t("booking.success.title"), "success");
    } catch (err) {
      // Saat backend belum siap, tampilkan mock result
      console.warn("API belum tersedia, pakai mock result:", err);
      setResult({ nomor_antrian: "A-" + Math.floor(Math.random() * 99 + 1).toString().padStart(3, "0") });
      showToast("Pendaftaran berhasil (mode demo)", "success");
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

      {/* Stepper */}
      <Stepper steps={stepLabels} currentStep={currentStep} />

      {/* Step content */}
      <Card className="mt-8 shadow-sm border-border">
        <CardBody className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            {stepTitles[currentStep]}
          </h2>

          <div className="pt-2">
            {currentStep === 0 && <Step1Poli data={formData} errors={errors} onChange={handleChange} />}
            {currentStep === 1 && <Step2DokterJadwal data={formData} errors={errors} onChange={handleChange} />}
            {currentStep === 2 && <Step3DataDiri data={formData} errors={errors} onChange={handleChange} />}
            {currentStep === 3 && <Step4Konfirmasi data={formData} />}
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
    </div>
  );
}
