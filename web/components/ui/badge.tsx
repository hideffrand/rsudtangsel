/**
 * Badge — RSU Tangsel Care
 * Status booking + ikon (bukan hanya warna, penting untuk colorblind — Design.md §5.2)
 * Pakai warna status token, BUKAN warna brand (Design.md §3)
 */

import type { ReactNode } from "react";
import { Hourglass, RefreshCw, Check, X } from "lucide-react";

export type BadgeStatus = "menunggu" | "diproses" | "selesai" | "batal" | "darurat";

interface BadgeProps {
  status: BadgeStatus;
  /** Label override — jika tidak diisi, pakai label default per status */
  label?: string;
  className?: string;
}

const statusConfig: Record<
  BadgeStatus,
  { label: string; colorClass: string; icon: ReactNode; ariaLabel: string }
> = {
  menunggu: {
    label: "Menunggu",
    colorClass:
      "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Hourglass className="w-3.5 h-3.5" />,
    ariaLabel: "Status: Menunggu",
  },
  diproses: {
    label: "Diproses",
    colorClass:
      "bg-blue-50 text-blue-700 border-blue-200",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    ariaLabel: "Status: Diproses",
  },
  selesai: {
    label: "Selesai",
    colorClass:
      "bg-green-50 text-success border-green-200",
    icon: <Check className="w-3.5 h-3.5" />,
    ariaLabel: "Status: Selesai",
  },
  batal: {
    label: "Dibatalkan",
    colorClass:
      "bg-red-50 text-destructive border-red-200",
    icon: <X className="w-3.5 h-3.5" />,
    ariaLabel: "Status: Dibatalkan",
  },
  darurat: {
    label: "Darurat",
    colorClass:
      "bg-red-50 text-accent border-red-300 font-semibold",
    icon: "!",
    ariaLabel: "Status: Darurat",
  },
};

export function Badge({ status, label, className = "" }: BadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label ?? config.label;

  return (
    <span
      role="status"
      aria-label={config.ariaLabel}
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5
        text-xs font-medium
        border rounded-full
        ${config.colorClass}
        ${className}
      `}
    >
      {/* Ikon fungsional — aria-hidden agar screen reader skip */}
      <span aria-hidden="true" className="leading-none">
        {config.icon}
      </span>
      {displayLabel}
    </span>
  );
}
