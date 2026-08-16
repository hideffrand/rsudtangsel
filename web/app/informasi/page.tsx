"use client";

/**
 * Informasi — RSU Tangsel Care
 */

import { useI18n } from "@/lib/i18n-context";
import { Card, CardBody } from "@/components/ui/card";

export default function InformasiPage() {
  const { t } = useI18n();

  const infoList = [
    {
      title: "Jam Layanan Poliklinik & IGD",
      content: "Poliklinik Rawat Jalan buka Senin–Jumat pukul 07.00–21.00 WIB dan Sabtu pukul 07.00–17.00 WIB. Instalasi Gawat Darurat (IGD) dan Rawat Inap melayani 24 Jam Nonstop.",
    },
    {
      title: "Ketentuan Pendaftaran Online",
      content: "Pendaftaran online antrian poli dapat dilakukan mulai H-7 hingga H-1 sebelum tanggal kunjungan. Pasien wajib membawa KTP/Kartu Keluarga asli dan kartu BPJS/Asuransi saat verifikasi fisik di rumah sakit.",
    },
    {
      title: "Alamat & Lokasi Rumah Sakit",
      content: "Jl. Raya Serpong, Kota Tangerang Selatan, Banten 15310. Tersedia fasilitas parkir luas, halte angkutan umum depan gedung utama, dan akses ramah disabilitas.",
    },
    {
      title: "Layanan Pasien BPJS Kesehatan",
      content: "RSU Tangsel Care menerima seluruh rujukan Faskes 1 (Puskesmas/Klinik). Harap memastikan surat rujukan masih aktif dan nomor Kartu Indonesia Sehat (KIS) sesuai NIK KTP.",
    },
  ];

  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      style={{ maxWidth: "var(--container-max)" }}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Informasi Rumah Sakit
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Panduan layanan, jam operasional, dan informasi penting bagi pasien dan keluarga.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {infoList.map((item, idx) => (
          <Card key={idx} className="shadow-xs border-border">
            <CardBody className="space-y-2">
              <h2 className="text-lg font-semibold text-primary">{item.title}</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{item.content}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
