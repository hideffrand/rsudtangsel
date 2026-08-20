"use client";

/**
 * StatCard - Kartu statistik untuk dashboard admin
 */

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: "green" | "blue" | "amber" | "red" | "slate";
  trend?: { value: number; label: string };
  loading?: boolean;
}

const colorMap = {
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "bg-emerald-100 text-emerald-600",
    value: "text-emerald-700",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "bg-blue-100 text-blue-600",
    value: "text-blue-700",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "bg-amber-100 text-amber-600",
    value: "text-amber-700",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    icon: "bg-red-100 text-red-600",
    value: "text-red-700",
  },
  slate: {
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-200 dark:border-slate-700",
    icon: "bg-slate-100 text-slate-600",
    value: "text-slate-700",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "slate",
  loading = false,
}: StatCardProps) {
  const c = colorMap[color];

  if (loading) {
    return (
      <div className="p-5 rounded-xl border border-border bg-background animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-muted rounded w-24" />
            <div className="h-8 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-32" />
          </div>
          <div className="w-10 h-10 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-xl border ${c.border} ${c.bg} transition-all hover:shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </p>
          <p className={`text-3xl font-extrabold tracking-tight ${c.value}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
