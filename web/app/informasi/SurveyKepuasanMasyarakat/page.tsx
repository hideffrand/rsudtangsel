"use client";

import { useState } from "react";
import Link from "next/link";

interface UnsurSKM {
  no: number;
  unsur: string;
  nilai: number;
  kategori: string;
  peringkat: number;
}

interface DataTriwulan {
  indeks: number;
  mutu: string;
  kriteria: string;
  unsurList: UnsurSKM[];
}

const DATA_SKM: Record<string, DataTriwulan> = {
  "Triwulan 1": {
    indeks: 94.53,
    mutu: "A",
    kriteria: "Sangat Baik",
    unsurList: [
      { no: 1, unsur: "Persyaratan", nilai: 3.868, kategori: "Sangat Memuaskan", peringkat: 3 },
      { no: 2, unsur: "Prosedur", nilai: 3.670, kategori: "Sangat Memuaskan", peringkat: 8 },
      { no: 3, unsur: "Waktu pelayanan", nilai: 3.758, kategori: "Sangat Memuaskan", peringkat: 6 },
      { no: 4, unsur: "Biaya/tarif", nilai: 3.879, kategori: "Sangat Memuaskan", peringkat: 2 },
      { no: 5, unsur: "Produk layanan", nilai: 3.879, kategori: "Sangat Memuaskan", peringkat: 1 },
      { no: 6, unsur: "Kompetensi pelaksana", nilai: 3.868, kategori: "Sangat Memuaskan", peringkat: 4 },
      { no: 7, unsur: "Perilaku pelaksana", nilai: 3.835, kategori: "Sangat Memuaskan", peringkat: 5 },
      { no: 8, unsur: "Sarana dan Prasarana", nilai: 3.549, kategori: "Sangat Memuaskan", peringkat: 9 },
      { no: 9, unsur: "Penanganan Pengaduan", nilai: 3.725, kategori: "Sangat Memuaskan", peringkat: 7 },
    ],
  },
  "Triwulan 2": {
    indeks: 95.02,
    mutu: "A",
    kriteria: "Sangat Baik",
    unsurList: [
      { no: 1, unsur: "Persyaratan", nilai: 3.835, kategori: "Sangat Memuaskan", peringkat: 5 },
      { no: 2, unsur: "Prosedur", nilai: 3.725, kategori: "Sangat Memuaskan", peringkat: 8 },
      { no: 3, unsur: "Waktu pelayanan", nilai: 3.769, kategori: "Sangat Memuaskan", peringkat: 7 },
      { no: 4, unsur: "Biaya/tarif", nilai: 3.868, kategori: "Sangat Memuaskan", peringkat: 3 },
      { no: 5, unsur: "Produk layanan", nilai: 3.879, kategori: "Sangat Memuaskan", peringkat: 1 },
      { no: 6, unsur: "Kompetensi pelaksana", nilai: 3.868, kategori: "Sangat Memuaskan", peringkat: 2 },
      { no: 7, unsur: "Perilaku pelaksana", nilai: 3.857, kategori: "Sangat Memuaskan", peringkat: 4 },
      { no: 8, unsur: "Sarana dan Prasarana", nilai: 3.615, kategori: "Sangat Memuaskan", peringkat: 9 },
      { no: 9, unsur: "Penanganan Pengaduan", nilai: 3.791, kategori: "Sangat Memuaskan", peringkat: 6 },
    ],
  },
  "Triwulan 3": {
    indeks: 95.33,
    mutu: "A",
    kriteria: "Sangat Baik",
    unsurList: [
      { no: 1, unsur: "Persyaratan", nilai: 3.846, kategori: "Sangat Memuaskan", peringkat: 4 },
      { no: 2, unsur: "Prosedur", nilai: 3.769, kategori: "Sangat Memuaskan", peringkat: 6 },
      { no: 3, unsur: "Waktu pelayanan", nilai: 3.659, kategori: "Sangat Memuaskan", peringkat: 9 },
      { no: 4, unsur: "Biaya/tarif", nilai: 3.956, kategori: "Sangat Memuaskan", peringkat: 1 },
      { no: 5, unsur: "Produk layanan", nilai: 3.890, kategori: "Sangat Memuaskan", peringkat: 2 },
      { no: 6, unsur: "Kompetensi pelaksana", nilai: 3.846, kategori: "Sangat Memuaskan", peringkat: 5 },
      { no: 7, unsur: "Perilaku pelaksana", nilai: 3.725, kategori: "Sangat Memuaskan", peringkat: 8 },
      { no: 8, unsur: "Sarana dan Prasarana", nilai: 3.769, kategori: "Sangat Memuaskan", peringkat: 7 },
      { no: 9, unsur: "Penanganan Pengaduan", nilai: 3.857, kategori: "Sangat Memuaskan", peringkat: 3 },
    ],
  },
  "Triwulan 4": {
    indeks: 97.99,
    mutu: "A",
    kriteria: "Sangat Baik",
    unsurList: [
      { no: 1, unsur: "Persyaratan", nilai: 3.91, kategori: "Sangat Memuaskan", peringkat: 7 },
      { no: 2, unsur: "Prosedur", nilai: 3.92, kategori: "Sangat Memuaskan", peringkat: 5 },
      { no: 3, unsur: "Waktu pelayanan", nilai: 3.92, kategori: "Sangat Memuaskan", peringkat: 6 },
      { no: 4, unsur: "Biaya/tarif", nilai: 3.93, kategori: "Sangat Memuaskan", peringkat: 3 },
      { no: 5, unsur: "Produk layanan", nilai: 3.91, kategori: "Sangat Memuaskan", peringkat: 8 },
      { no: 6, unsur: "Kompetensi pelaksana", nilai: 3.94, kategori: "Sangat Memuaskan", peringkat: 2 },
      { no: 7, unsur: "Perilaku pelaksana", nilai: 3.96, kategori: "Sangat Memuaskan", peringkat: 1 },
      { no: 8, unsur: "Sarana dan Prasarana", nilai: 3.93, kategori: "Sangat Memuaskan", peringkat: 4 },
      { no: 9, unsur: "Penanganan Pengaduan", nilai: 3.86, kategori: "Sangat Memuaskan", peringkat: 9 },
    ],
  },
};

export default function SurveyKepuasanMasyarakatPage() {
  const [activeTab, setActiveTab] = useState<string>("Triwulan 1");
  const data = DATA_SKM[activeTab];

  return (
    <div className="bg-white min-h-screen">
      {/* ─── Breadcrumb ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-8">
          <Link href="/" className="hover:text-teal-700">Beranda</Link>
          <span>/</span>
          <Link href="/informasi" className="hover:text-teal-700">Informasi Publik</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Survey Kepuasan Masyarakat</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
          Survey Kepuasan Masyarakat (SKM)
        </h1>
        <p className="text-gray-500 text-sm mb-1">Tahun Evaluasi: 2025</p>
        <div className="w-16 h-1 rounded-full bg-teal-600 mt-3 mb-10" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* ─── Navigation Tabs ───────────────────────────────────── */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto gap-2 scrollbar-none">
          {Object.keys(DATA_SKM).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                py-2.5 px-6 font-semibold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer
                ${
                  activeTab === tab
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ─── Summary Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-50 border border-gray-100 rounded-xl p-5 flex flex-col justify-center items-center text-center shadow-xs">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Nilai Indeks Konversi
            </span>
            <span className="text-4xl font-black text-teal-700">{data.indeks}</span>
            <span className="text-xs text-teal-600 font-semibold mt-2 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100">
              Sangat Memuaskan
            </span>
          </div>

          <div className="bg-slate-50 border border-gray-100 rounded-xl p-5 flex flex-col justify-center items-center text-center shadow-xs">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Mutu Pelayanan
            </span>
            <span className="text-4xl font-black text-gray-800">{data.mutu}</span>
            <span className="text-xs text-gray-500 font-medium mt-2">
              Predikat Tertinggi
            </span>
          </div>

          <div className="bg-slate-50 border border-gray-100 rounded-xl p-5 flex flex-col justify-center items-center text-center shadow-xs">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Kriteria Pelayanan
            </span>
            <span className="text-3xl font-black text-gray-800">{data.kriteria}</span>
            <span className="text-xs text-emerald-600 font-semibold mt-2 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
              Sangat Baik
            </span>
          </div>
        </div>

        {/* ─── Chart Section (Visual Bar Chart) ────────────────── */}
        <div className="border border-gray-100 rounded-2xl bg-white p-6 shadow-sm mb-10">
          <h3 className="font-bold text-gray-800 text-lg mb-6">
            Grafik Nilai Rata-Rata Unsur Pelayanan ({activeTab})
          </h3>
          <div className="space-y-4">
            {data.unsurList.map((item) => {
              // Hitung persen lebar relatif dari nilai maksimum (4.0)
              const percentage = (item.nilai / 4.0) * 100;
              return (
                <div key={item.no} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  {/* Nama Unsur */}
                  <div className="md:w-52 text-xs font-bold text-gray-700 truncate">
                    {item.no}. {item.unsur}
                  </div>
                  {/* Bar */}
                  <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden relative flex items-center">
                    <div
                      className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-3"
                      style={{
                        width: `${percentage}%`,
                        background: "linear-gradient(90deg, #14b8a6, #0f766e)",
                      }}
                    >
                      <span className="text-[11px] font-black text-white">{item.nilai.toFixed(3)}</span>
                    </div>
                  </div>
                  {/* Badge Peringkat */}
                  <div className="hidden md:flex w-24 items-center justify-end text-xs font-semibold text-gray-500">
                    Peringkat: <span className="text-teal-600 font-bold ml-1">#{item.peringkat}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-gray-400 mt-6 pt-4 border-t border-gray-100">
            <span>Skala Penilaian: 1.0 (Terendah)</span>
            <span>4.0 (Tertinggi)</span>
          </div>
        </div>
      </div>

      {/* ─── Tombol Kembali ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-t border-gray-100 pt-8">
        <Link
          href="/informasi"
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900 transition-colors"
        >
          ← Kembali ke Informasi Publik
        </Link>
      </div>
    </div>
  );
}
