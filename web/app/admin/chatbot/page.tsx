"use client";

/**
 * Chatbot Internal & Inbox Support - RSU Tangsel Care (/admin/chatbot)
 * Fitur:
 * 1. Search cepat data pasien / SOP RS
 * 2. Inbox chat pasien publik (routing pertanyaan medis/layanan)
 * 3. Draft balasan otomatis dari AI (bisa disunting lalu dikirim)
 */

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

interface ChatThread {
  id: string;
  patientName: string;
  phone: string;
  category: "Keluhan Medis" | "Pertanyaan Tarif MCU" | "Jadwal Poli" | "Umum";
  lastMessage: string;
  time: string;
  unread: boolean;
  aiSuggestedDraft: string;
  messages: {
    sender: "patient" | "agent" | "ai";
    text: string;
    time: string;
  }[];
}

const INITIAL_THREADS: ChatThread[] = [
  {
    id: "CHAT-001",
    patientName: "Budi Santoso",
    phone: "08123456789",
    category: "Keluhan Medis",
    lastMessage: "Dokter, saya merasa sesak napas setelah minum obat tadi siang.",
    time: "15:30",
    unread: true,
    aiSuggestedDraft: "Halo Budi, segera istirahat dalam posisi duduk tegak. Apabila sesak napas memberat disertai nyeri dada, mohon segera mengunjungi IGD RSU Tangsel Care terdekat atau hubungi (021) 5555-9999.",
    messages: [
      { sender: "patient", text: "Selamat sore RSU Tangsel Care", time: "15:28" },
      { sender: "patient", text: "Dokter, saya merasa sesak napas setelah minum obat tadi siang.", time: "15:30" },
    ],
  },
  {
    id: "CHAT-002",
    patientName: "Siti Rahma",
    phone: "085711223344",
    category: "Pertanyaan Tarif MCU",
    lastMessage: "Berapa biaya untuk MCU Pelajar untuk syarat masuk kuliah?",
    time: "14:15",
    unread: false,
    aiSuggestedDraft: "Halo Kak Siti, biaya Paket MCU Pelajar di RSU Tangsel Care adalah Rp 300.000 (sudah termasuk tes bebas narkoba 5 parameter dan surat keterangan sehat). Anda bisa mendaftar via menu MCU di website kami.",
    messages: [
      { sender: "patient", text: "Berapa biaya untuk MCU Pelajar untuk syarat masuk kuliah?", time: "14:15" },
      { sender: "agent", text: "Halo Kak Siti, paket MCU Pelajar kami seharga Rp 300.000.", time: "14:20" },
    ],
  },
];

const SOP_KNOWLEDGE_BASE = [
  { title: "SOP Penanganan Pasien Nyeri Dada / Sesak", desc: "Pertolongan pertama pada indikasi sindrom koroner akut, arahkan langsung ke IGD." },
  { title: "SOP Syarat MCU Narkoba Pelajar", desc: "Membawa KTP/Kartu Pelajar, pasfoto 3x4 2 lembar, puasa 8 jam sebelum tes." },
  { title: "SOP Jam Besuk / Kunjungan Rawat Inap", desc: "Siang: 11.00 - 13.00 WIB | Sore: 17.00 - 19.00 WIB. Maksimal 2 pengunjung per kamar." },
];

export default function AdminChatbotPage() {
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_THREADS);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(INITIAL_THREADS[0]);

  const [replyText, setReplyText] = useState(INITIAL_THREADS[0]?.aiSuggestedDraft || "");
  const [sopSearch, setSopSearch] = useState("");

  const filteredSop = SOP_KNOWLEDGE_BASE.filter(
    (s) =>
      !sopSearch ||
      s.title.toLowerCase().includes(sopSearch.toLowerCase()) ||
      s.desc.toLowerCase().includes(sopSearch.toLowerCase())
  );

  const handleSelectThread = (t: ChatThread) => {
    setSelectedThread(t);
    setReplyText(t.aiSuggestedDraft);
    // Mark read
    setThreads((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, unread: false } : item))
    );
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedThread) return;
    const nowStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const newMsg = { sender: "agent" as const, text: replyText, time: nowStr };

    const updatedThread = {
      ...selectedThread,
      lastMessage: replyText,
      time: nowStr,
      messages: [...selectedThread.messages, newMsg],
    };

    setSelectedThread(updatedThread);
    setThreads((prev) => prev.map((t) => (t.id === selectedThread.id ? updatedThread : t)));
    setReplyText("");
  };

  const handleUseAiDraft = () => {
    if (selectedThread) {
      setReplyText(selectedThread.aiSuggestedDraft);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Chatbot Internal &amp; Inbox Helpdesk</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Routing konsultasi publik ke staff, pencarian SOP pintar, dan pembantu balasan otomatis bertenaga AI.
        </p>
      </div>

      {/* Main Grid: SOP Search (Top) + Inbox Chat (Bottom) */}
      <div className="bg-emerald-900 text-white p-5 rounded-xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-emerald-200 flex items-center gap-1.5"><Search className="w-4 h-4" /> Search Cepat SOP &amp; Basis Pengetahuan Medis RS</h3>
          <span className="text-[11px] text-emerald-300">Pencarian Pintar AI</span>
        </div>
        <input
          type="search"
          placeholder="Cari SOP (contoh: sesak napas, jam besuk, syarat MCU)..."
          value={sopSearch}
          onChange={(e) => setSopSearch(e.target.value)}
          className="w-full h-10 px-4 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-emerald-400 placeholder-slate-400"
        />
        {sopSearch && (
          <div className="space-y-2 pt-2">
            {filteredSop.map((sop, idx) => (
              <div key={idx} className="p-3 bg-white/10 rounded-lg text-xs space-y-1">
                <p className="font-bold text-emerald-300">{sop.title}</p>
                <p className="text-slate-200 leading-relaxed">{sop.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Inbox Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Thread List */}
        <div className="lg:col-span-1 border border-slate-200 rounded-xl bg-white p-4 space-y-3 shadow-2xs">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
            Inbox Pesan Masuk Pasien ({threads.length})
          </h3>

          <div className="space-y-2">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectThread(t)}
                className={`
                  w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5
                  ${selectedThread?.id === t.id
                    ? "border-emerald-500 bg-emerald-50/50 shadow-2xs"
                    : "border-slate-100 hover:bg-slate-50"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{t.patientName}</span>
                  <span className="text-[10px] text-slate-400">{t.time}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full w-fit">
                  {t.category}
                </span>
                <p className="text-xs text-slate-600 line-clamp-1">{t.lastMessage}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Chat View + AI Draft Box */}
        <div className="lg:col-span-2 border border-slate-200 rounded-xl bg-white p-5 shadow-2xs flex flex-col h-[520px]">
          {selectedThread ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-bold text-slate-800 text-base">{selectedThread.patientName}</h2>
                  <p className="text-xs text-slate-400">No. Telp: {selectedThread.phone} | Kategori: {selectedThread.category}</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {selectedThread.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[80%] ${
                      m.sender === "patient" ? "items-start" : "items-end ml-auto"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        m.sender === "patient"
                          ? "bg-slate-100 text-slate-800 rounded-tl-none"
                          : "bg-emerald-600 text-white rounded-tr-none"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
                  </div>
                ))}
              </div>

              {/* AI Suggested Draft Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Draft Balasan Otomatis AI (Rekomendasi)
                  </span>
                  <button
                    onClick={handleUseAiDraft}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Gunakan Draft Ini
                  </button>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed italic">{selectedThread.aiSuggestedDraft}</p>
              </div>

              {/* Input Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik balasan untuk pasien (bisa sunting draft AI di atas)..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  className="flex-1 h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSendReply}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  Kirim
                </button>
              </div>
            </>
          ) : (
            <div className="m-auto text-center text-slate-400 text-sm">
              Pilih percakapan di sebelah kiri.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
