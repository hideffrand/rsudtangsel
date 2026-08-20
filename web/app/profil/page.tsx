"use client";

/**
 * Profil Pasien - RSU Tangsel Care
 */

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfilPasienPage() {
  const { t } = useI18n();

  const [patientData, setPatientData] = useState({
    nik: "3674012345670001",
    nama: "Budi Pratama",
    tanggalLahir: "1990-05-14",
    noHp: "081234567890",
    alamat: "Jl. BSD Raya Utama No. 12, Serpong, Tangsel",
    bpjsNumber: "0001234567891",
  });

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      style={{ maxWidth: "720px" }}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Profil Pasien
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Informasi identitas medis dan riwayat pendaftaran antrian Anda.
        </p>
      </div>

      {/* Identitas Card */}
      <Card className="shadow-xs border-border">
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-semibold text-lg text-foreground">Data Pribadi Pasien</h2>
          <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-medium">
            Terverifikasi (KTP & BPJS)
          </span>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="prof-nik" label="NIK (KTP)" value={patientData.nik} readOnly disabled />
            <Input id="prof-nama" label="Nama Lengkap" value={patientData.nama} readOnly disabled />
            <Input id="prof-ttl" label="Tanggal Lahir" type="date" value={patientData.tanggalLahir} readOnly disabled />
            <Input id="prof-hp" label="Nomor Handphone" value={patientData.noHp} readOnly disabled />
            <div className="sm:col-span-2">
              <Input id="prof-alamat" label="Alamat Tempat Tinggal" value={patientData.alamat} readOnly disabled />
            </div>
            <div className="sm:col-span-2">
              <Input id="prof-bpjs" label="Nomor BPJS Kesehatan" value={patientData.bpjsNumber} readOnly disabled />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Fast Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/daftar-online"
          className={buttonVariants({ variant: "primary", size: "lg", className: "flex-1" })}
        >
          Buat Antrian Pendaftaran Baru
        </Link>
        <Link
          href="/jadwal-dokter"
          className={buttonVariants({ variant: "outline", size: "lg", className: "flex-1" })}
        >
          Cek Jadwal Dokter Spesialis
        </Link>
      </div>
    </div>
  );
}
