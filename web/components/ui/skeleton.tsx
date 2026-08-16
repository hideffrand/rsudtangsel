/**
 * Skeleton — RSU Tangsel Care
 * Bukan spinner generik — lebih informatif untuk konten list (Design.md §3)
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Memuat..."
      className={`animate-pulse rounded bg-muted ${className}`}
    />
  );
}

/** Skeleton untuk Card booking (satu baris di list status) */
export function BookingCardSkeleton() {
  return (
    <div
      className="border border-border rounded-md p-4 bg-background"
      aria-label="Memuat data kunjungan..."
      role="status"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-10 w-28 rounded-sm" />
        <Skeleton className="h-10 w-24 rounded-sm" />
      </div>
    </div>
  );
}

/** Skeleton untuk grid jadwal dokter */
export function DoctorScheduleSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Memuat jadwal dokter...">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-border rounded-md p-4 bg-background">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
