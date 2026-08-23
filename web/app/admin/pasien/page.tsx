"use client";

/**
 * Registrasi Pasien (admin) — target demo autofill ekstensi Webform Copilot.
 * Setiap input punya atribut `data-copilot` (key ternormalisasi: huruf kecil
 * alfanumerik) agar ekstensi bisa mengisi field ini dari hasil OCR
 * (doc_type `registrasi-pasien` → parser di ocr-service/doc_parser.py).
 * Form ini frontend-only: belum ada endpoint persistensi pasien.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";

const GENDER_OPTIONS = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
];

const EMPTY_FORM = {
  nama: "",
  nik: "",
  umur: "",
  jenisKelamin: "",
  alamat: "",
  noTelepon: "",
};

export default function AdminPasienPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setSubmitted(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nama.trim() || !form.nik.trim()) {
      setError("Nama dan NIK wajib diisi.");
      return;
    }
    setError(null);
    setSubmitted(true);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Registrasi Pasien</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Buka side panel Webform Copilot, pilih jenis dokumen{" "}
          <span className="font-medium">Registrasi Pasien</span>, lalu proses foto formulir
          untuk mengisi kolom di bawah secara otomatis.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-medium">Data Pasien</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
            <Input
              id="pasien-nama"
              label="Nama Lengkap"
              required
              data-copilot="nama"
              value={form.nama}
              onChange={(e) => setField("nama", e.target.value)}
              placeholder="Sesuai identitas"
            />
            <Input
              id="pasien-nik"
              label="NIK"
              required
              data-copilot="nik"
              value={form.nik}
              onChange={(e) => setField("nik", e.target.value)}
              placeholder="16 digit"
              inputMode="numeric"
              maxLength={16}
            />
            <Input
              id="pasien-umur"
              label="Umur"
              data-copilot="umur"
              value={form.umur}
              onChange={(e) => setField("umur", e.target.value)}
              placeholder="Tahun"
              inputMode="numeric"
              maxLength={3}
            />
            <Select
              id="pasien-jenis-kelamin"
              label="Jenis Kelamin"
              data-copilot="jeniskelamin"
              options={GENDER_OPTIONS}
              placeholder="Pilih jenis kelamin"
              value={form.jenisKelamin}
              onChange={(e) => setField("jenisKelamin", e.target.value)}
            />
            <Textarea
              id="pasien-alamat"
              label="Alamat"
              data-copilot="alamat"
              className="md:col-span-2"
              value={form.alamat}
              onChange={(e) => setField("alamat", e.target.value)}
            />
            <Input
              id="pasien-no-telepon"
              label="No. Telepon"
              data-copilot="notelepon"
              value={form.noTelepon}
              onChange={(e) => setField("noTelepon", e.target.value)}
              placeholder="08xx-xxxx-xxxx"
              inputMode="tel"
            />

            {error && (
              <p role="alert" className="md:col-span-2 text-sm text-destructive font-medium">
                {error}
              </p>
            )}
            {submitted && !error && (
              <p role="status" className="md:col-span-2 text-sm text-emerald-700 font-medium">
                Data pasien lengkap. Mode demo — belum tersimpan ke server.
              </p>
            )}

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" variant="primary">
                Simpan Data Pasien
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
