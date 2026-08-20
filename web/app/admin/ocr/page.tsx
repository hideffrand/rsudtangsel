"use client";

/**
 * OCR Review Queue - RSU Tangsel Care (/admin/ocr)
 * Fitur:
 * 1. Upload dokumen (KTP, BPJS, rujukan, resep)
 * 2. Ekstraksi langsung via CnOCR Microservice (atau Go API Proxy)
 * 3. Review hasil ekstraksi (field confidence rendah di-highlight)
 * 4. Approve/Reject sebelum sync ke SIMRS
 */

import { useState } from "react";
import { extractOcrDocument } from "@/lib/admin-api";

interface OcrDoc {
  id: string;
  docType: "KTP" | "BPJS" | "Surat Rujukan" | "Resep Dokter" | "Umum";
  patientName: string;
  uploadDate: string;
  status: "Pending Review" | "Approved" | "Rejected";
  confidenceScore: number;
  extractedFields: {
    key: string;
    value: string;
    confidence: number; // 0..100
  }[];
}

const INITIAL_DOCS: OcrDoc[] = [
  {
    id: "OCR-1001",
    docType: "KTP",
    patientName: "Budi Santoso",
    uploadDate: "2026-08-17 14:20",
    status: "Pending Review",
    confidenceScore: 82,
    extractedFields: [
      { key: "NIK", value: "3674011204890001", confidence: 98 },
      { key: "Nama", value: "Budi Santoso", confidence: 95 },
      { key: "Tanggal Lahir", value: "1989-04-12", confidence: 64 }, // low confidence!
      { key: "Alamat", value: "Jl. Ciater Raya No. 45, Serpong", confidence: 71 }, // medium confidence
      { key: "Agama", value: "ISLAM", confidence: 99 },
    ],
  },
  {
    id: "OCR-1002",
    docType: "BPJS",
    patientName: "Siti Aminah",
    uploadDate: "2026-08-17 14:45",
    status: "Pending Review",
    confidenceScore: 94,
    extractedFields: [
      { key: "No. Kartu BPJS", value: "0001234567890", confidence: 99 },
      { key: "Nama Peserta", value: "Siti Aminah", confidence: 98 },
      { key: "Faskes Tingkat 1", value: "Puskesmas Pamulang", confidence: 85 },
      { key: "Status Kartu", value: "AKTIF", confidence: 95 },
    ],
  },
  {
    id: "OCR-1003",
    docType: "Surat Rujukan",
    patientName: "Ahmad Fauzi",
    uploadDate: "2026-08-17 15:10",
    status: "Approved",
    confidenceScore: 96,
    extractedFields: [
      { key: "No. Rujukan", value: "12345678R001", confidence: 98 },
      { key: "Poli Tujuan", value: "Poli Jantung", confidence: 97 },
      { key: "Diagnosa Awal", value: "Hipertensi Sekunder", confidence: 93 },
    ],
  },
];

export default function AdminOcrPage() {
  const [docs, setDocs] = useState<OcrDoc[]>(INITIAL_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<OcrDoc | null>(INITIAL_DOCS[0]);
  const [selectedType, setSelectedType] = useState<string>("semua");

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<string>("ktp");

  const filteredDocs = docs.filter((d) => {
    if (selectedType === "semua") return true;
    return d.docType === selectedType;
  });

  const handleFieldChange = (key: string, newValue: string) => {
    if (!selectedDoc) return;
    const updatedFields = selectedDoc.extractedFields.map((f) =>
      f.key === key ? { ...f, value: newValue, confidence: 100 } : f
    );
    const updatedDoc = { ...selectedDoc, extractedFields: updatedFields };
    setSelectedDoc(updatedDoc);
    setDocs((prev) => prev.map((d) => (d.id === selectedDoc.id ? updatedDoc : d)));
  };

  const handleApprove = (id: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "Approved" } : d))
    );
    if (selectedDoc?.id === id) {
      setSelectedDoc((prev) => (prev ? { ...prev, status: "Approved" } : null));
    }
  };

  const handleReject = (id: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "Rejected" } : d))
    );
    if (selectedDoc?.id === id) {
      setSelectedDoc((prev) => (prev ? { ...prev, status: "Rejected" } : null));
    }
  };

  const handleRealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Panggil CnOCR via proxy Go / standalone mock
      const result = await extractOcrDocument(file, uploadDocType);

      // Cari nama pasien jika ada dari hasil ekstraksi
      const namaField = result.extracted_fields.find(
        (f) => f.key.toLowerCase().includes("nama")
      );
      const patientName = namaField ? namaField.value : file.name.replace(/\.[^/.]+$/, "");

      const docTypeDisplayMap: Record<string, OcrDoc["docType"]> = {
        ktp: "KTP",
        bpjs: "BPJS",
        rujukan: "Surat Rujukan",
        resep: "Resep Dokter",
      };

      const newDoc: OcrDoc = {
        id: `OCR-${Date.now().toString().slice(-4)}`,
        docType: docTypeDisplayMap[uploadDocType] || "Umum",
        patientName: patientName || "Dokumen Upload Baru",
        uploadDate: new Date().toISOString().slice(0, 16).replace("T", " "),
        status: "Pending Review",
        confidenceScore: Math.round(result.avg_confidence),
        extractedFields: result.extracted_fields.map((f) => ({
          key: f.key,
          value: f.value,
          confidence: Math.round(f.confidence),
        })),
      };

      setDocs((prev) => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
    } catch {
      // silent
    } finally {
      setIsUploading(false);
      // Reset input value agar bisa re-upload file yang sama
      e.target.value = "";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">OCR Review Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verifikasi &amp; koreksi hasil ekstraksi CnOCR pada dokumen pasien sebelum disinkronkan ke SIMRS.
          </p>
        </div>

        {/* Upload Controls */}
        <div className="flex items-center gap-2">
          <select
            value={uploadDocType}
            onChange={(e) => setUploadDocType(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="ktp">Dokumen: KTP</option>
            <option value="bpjs">Dokumen: BPJS</option>
            <option value="rujukan">Dokumen: Rujukan</option>
            <option value="resep">Dokumen: Resep</option>
            <option value="generic">Dokumen: Umum</option>
          </select>

          <label className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer transition-colors shadow-xs flex items-center gap-2">
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mengekstrak CnOCR...
              </>
            ) : (
              <>
                <span>📤 Upload Dokumen</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleRealUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </>
            )}
          </label>
        </div>
      </div>

      {/* Main Grid: Queue List (Left) + Detail Reviewer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Queue List */}
        <div className="lg:col-span-1 border border-slate-200 rounded-xl bg-white p-4 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Antrian Dokumen ({filteredDocs.length})</h3>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1"
            >
              <option value="semua">Semua Jenis</option>
              <option value="KTP">KTP</option>
              <option value="BPJS">BPJS</option>
              <option value="Surat Rujukan">Rujukan</option>
              <option value="Resep Dokter">Resep</option>
            </select>
          </div>

          <div className="space-y-2">
            {filteredDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`
                  w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5
                  ${selectedDoc?.id === doc.id
                    ? "border-emerald-500 bg-emerald-50/50 shadow-2xs"
                    : "border-slate-100 hover:bg-slate-50"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{doc.docType}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      doc.status === "Pending Review"
                        ? "bg-amber-100 text-amber-700"
                        : doc.status === "Approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{doc.patientName}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>ID: {doc.id}</span>
                  <span>Confidence: <strong className={doc.confidenceScore < 85 ? "text-amber-600" : "text-emerald-600"}>{doc.confidenceScore}%</strong></span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Inspection & Field Editing */}
        <div className="lg:col-span-2 border border-slate-200 rounded-xl bg-white p-6 shadow-2xs space-y-6">
          {selectedDoc ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 rounded">
                      {selectedDoc.docType}
                    </span>
                    <h2 className="text-lg font-bold text-slate-800">{selectedDoc.patientName}</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Uploaded pada: {selectedDoc.uploadDate} | Ref ID: {selectedDoc.id}</p>
                </div>

                {/* Approve / Reject CTA */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(selectedDoc.id)}
                    disabled={selectedDoc.status === "Rejected"}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                  >
                    Tolak / Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedDoc.id)}
                    disabled={selectedDoc.status === "Approved"}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-40 shadow-xs"
                  >
                    Approve &amp; Sync SIMRS
                  </button>
                </div>
              </div>

              {/* Confidence Legend */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
                <span>Rata-rata Tingkat Kepercayaan AI: <strong className="text-slate-800">{selectedDoc.confidenceScore}%</strong></span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> &ge;85% Tinggi</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> &lt;85% Perlu Review</span>
                </div>
              </div>

              {/* Extracted Fields Form */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-800">Hasil Ekstraksi Teks (Bisa Di-edit Langsung):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDoc.extractedFields.map((field) => {
                    const isLowConfidence = field.confidence < 85;
                    return (
                      <div
                        key={field.key}
                        className={`p-3 rounded-lg border space-y-1.5 transition-all ${
                          isLowConfidence
                            ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold text-slate-700">{field.key}</label>
                          <span
                            className={`text-[10px] font-bold ${
                              isLowConfidence ? "text-amber-700" : "text-emerald-600"
                            }`}
                          >
                            Score: {field.confidence}% {isLowConfidence && "⚠️"}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">
              Pilih dokumen di sebelah kiri untuk melihat hasil ekstraksi OCR.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
