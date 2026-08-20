"use client";

/**
 * Profil Pasien - RSU Tangsel Care
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfilPasienPage() {
  const { t } = useI18n();

  const [patientData, setPatientData] = useState({
    nik: "1234567890123456",
    nama: "Bryan Sean Abner Manullang",
    tanggalLahir: "1998-05-12",
    noHp: "081291608737",
    alamat: "Perumahan Pamulang Permai, Tangerang Selatan",
    bpjsNumber: "0001234567891",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rsud_patient_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Force update old Bryan Sean / Budi Pratama names to the new requested name
        if (parsed.nama === "Bryan Sean" || parsed.nama === "Budi Pratama" || parsed.no_hp === "081234567890") {
          parsed.nama = "Bryan Sean Abner Manullang";
          parsed.no_hp = "081291608737";
          parsed.nik = "1234567890123456";
          parsed.tanggal_lahir = "1998-05-12";
          parsed.alamat = "Perumahan Pamulang Permai, Tangerang Selatan";
          localStorage.setItem("rsud_patient_profile", JSON.stringify(parsed));
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPatientData({
          nik: parsed.nik || "1234567890123456",
          nama: parsed.nama || "Bryan Sean Abner Manullang",
          tanggalLahir: parsed.tanggal_lahir || "1998-05-12",
          noHp: parsed.no_hp || "081291608737",
          alamat: parsed.alamat || "Perumahan Pamulang Permai, Tangerang Selatan",
          bpjsNumber: parsed.bpjs_number || "0001234567891",
        });
      } else {
        const defaultProfile = {
          nik: "1234567890123456",
          nama: "Bryan Sean Abner Manullang",
          tanggal_lahir: "1998-05-12",
          no_hp: "081291608737",
          alamat: "Perumahan Pamulang Permai, Tangerang Selatan",
          bpjs_number: "0001234567891",
          jenis_pembayaran: "umum",
        };
        localStorage.setItem("rsud_patient_profile", JSON.stringify(defaultProfile));
      }
    } catch {
      // ignore
    }
  }, []);

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
