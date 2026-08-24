"use client";

/**
 * Toast - RSU Tangsel Care
 * Notifikasi hasil aksi: auto-dismiss + close manual (Design.md §3)
 * Posisi bottom-center di mobile, bottom-right di desktop.
 *
 * API imperatif ala react-hot-toast — bisa dipanggil dari mana saja
 * (event handler, service, dsb.) tanpa hook:
 *
 *   toast("Pesan info");
 *   toast.success("Tersimpan!");
 *   toast.error("Gagal menyimpan");
 *   toast.warning("Kuota hampir habis");
 *   const id = toast.loading("Memproses...");
 *   toast.dismiss(id);
 *   await toast.promise(api.post(...), {
 *     loading: "Menyimpan...",
 *     success: "Berhasil disimpan",
 *     error: (err) => err.message,
 *   });
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastOptions {
  /** Durasi tampil (ms). Default 4000, loading = tanpa auto-dismiss. */
  duration?: number;
}

// ─── Store imperatif (module-level) ───────────────────────────────────────────

let counter = 0;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<(toasts: Toast[]) => void>();
let items: Toast[] = [];

function notify() {
  for (const listener of listeners) listener([...items]);
}

function set(id: string, type: ToastType, message: string, duration?: number) {
  const existing = timers.get(id);
  if (existing) clearTimeout(existing);
  timers.delete(id);
  items = items.map((t) => (t.id === id ? { ...t, type, message } : t));
  if (!items.some((t) => t.id === id)) {
    items = [...items, { id, type, message }];
  }
  notify();
  if (duration !== undefined && duration !== Infinity) {
    timers.set(
      id,
      setTimeout(() => dismissToast(id), duration),
    );
  }
}

const DEFAULT_DURATION = 4000;

function push(type: ToastType, message: string, opts?: ToastOptions): string {
  counter += 1;
  const id = `toast-${Date.now()}-${counter}`;
  items = [...items, { id, type, message }];
  notify();
  const duration =
    opts?.duration ?? (type === "loading" ? Infinity : DEFAULT_DURATION);
  if (duration !== Infinity) {
    timers.set(
      id,
      setTimeout(() => dismissToast(id), duration),
    );
  }
  return id;
}

export function dismissToast(id?: string) {
  if (id) {
    const timer = timers.get(id);
    if (timer) clearTimeout(timer);
    timers.delete(id);
    items = items.filter((t) => t.id !== id);
  } else {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    items = [];
  }
  notify();
}

// ─── toast() ──────────────────────────────────────────────────────────────────

export interface PromiseMessages<T> {
  loading?: string;
  success?: string | ((data: T) => string);
  error?: string | ((err: Error) => string);
}

function resolveMessage<T>(
  msg: string | ((arg: T) => string) | undefined,
  arg: T,
  fallback: string,
): string {
  if (typeof msg === "function") return msg(arg);
  return msg ?? fallback;
}

export function toast(message: string, opts?: ToastOptions): string;
export function toast(type: ToastType, message: string, opts?: ToastOptions): string;
export function toast(
  a: string,
  b?: string | ToastOptions,
  c?: ToastOptions,
): string {
  // toast("pesan") / toast("pesan", { duration })
  if (typeof b !== "string") return push("info", a, b);
  // toast("success", "pesan", opts?)
  return push(a as ToastType, b, c);
}

toast.success = (message: string, opts?: ToastOptions) =>
  push("success", message, opts);
toast.error = (message: string, opts?: ToastOptions) =>
  push("error", message, opts);
toast.warning = (message: string, opts?: ToastOptions) =>
  push("warning", message, opts);
toast.info = (message: string, opts?: ToastOptions) =>
  push("info", message, opts);

/** Loading tanpa auto-dismiss; kembalikan id untuk toast.dismiss(id). */
toast.loading = (message: string, opts?: ToastOptions) =>
  push("loading", message, opts);

toast.dismiss = dismissToast;

/**
 * toast.promise — loading → success/error otomatis mengganti toast yang sama.
 */
toast.promise = function promiseToast<T>(
  promise: Promise<T> | (() => Promise<T>),
  msgs: PromiseMessages<T>,
  opts?: Omit<ToastOptions, "duration">,
): Promise<T> {
  const p = typeof promise === "function" ? promise() : promise;
  const id = toast.loading(msgs.loading ?? "Memproses...", opts);
  p.then(
    (data) => {
      set(
        id,
        "success",
        resolveMessage(msgs.success, data, "Berhasil"),
        DEFAULT_DURATION,
      );
    },
    (err: unknown) => {
      set(
        id,
        "error",
        resolveMessage(
          msgs.error,
          err instanceof Error ? err : new Error(String(err)),
          "Terjadi kesalahan",
        ),
        DEFAULT_DURATION,
      );
    },
  );
  return p;
};

// ─── Provider + Hook (kompatibilitas pemakaian lama) ─────────────────────────

interface ToastContextType {
  showToast: (message: string, type?: Exclude<ToastType, "loading">) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>(items);

  const showToast = useCallback(
    (message: string, type?: Exclude<ToastType, "loading">) => {
      push(type ?? "info", message);
    },
    [],
  );

  useEffect(() => {
    const listener = (next: Toast[]) => setToasts(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:left-auto sm:w-80 z-50 flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Hook lama — sekarang delegasi ke API imperatif toast(). */
export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return ctx;
}

// ─── Toast item ───────────────────────────────────────────────────────────────

const toastConfig: Record<
  ToastType,
  { bgClass: string; icon: ReactNode; ariaLabel: string }
> = {
  success: {
    bgClass: "bg-green-50 border-green-200 text-green-800",
    ariaLabel: "Berhasil",
    icon: (
      <svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bgClass: "bg-red-50 border-red-200 text-red-800",
    ariaLabel: "Terjadi kesalahan",
    icon: (
      <svg className="w-4 h-4 text-destructive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  warning: {
    bgClass: "bg-amber-50 border-amber-200 text-amber-800",
    ariaLabel: "Peringatan",
    icon: (
      <svg className="w-4 h-4 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  info: {
    bgClass: "bg-blue-50 border-blue-200 text-blue-800",
    ariaLabel: "Informasi",
    icon: (
      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  loading: {
    bgClass: "bg-gray-50 border-gray-200 text-gray-800",
    ariaLabel: "Sedang memproses",
    icon: (
      <svg className="w-4 h-4 text-gray-500 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    ),
  },
};

function ToastItem({
  toast: item,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id?: string) => void;
}) {
  const config = toastConfig[item.type];

  return (
    <div
      role="alert"
      aria-label={config.ariaLabel}
      className={`
        flex items-start gap-3 p-4
        border rounded-sm
        shadow-md text-sm
        ${config.bgClass}
        animate-[fadeIn_0.2s_ease-out]
      `}
    >
      {config.icon}
      <p className="flex-1 leading-snug">{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="Tutup notifikasi"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
