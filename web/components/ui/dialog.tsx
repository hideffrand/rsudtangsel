"use client";

/**
 * Dialog - RSU Tangsel Care
 * Desktop: modal Dialog | Mobile: bottom Sheet (Design.md §3)
 * Konfirmasi eksplisit sebelum aksi penting (Design.md §5.1)
 * Trap focus + Escape to close (Design.md §5.2)
 */

import {
  useEffect,
  useRef,
  useId,
  type ReactNode,
} from "react";
import { Button } from "./button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Judul untuk footer tombol utama */
  confirmLabel?: string;
  /** Judul untuk footer tombol batal */
  cancelLabel?: string;
  onConfirm?: () => void;
  /** Apakah dialog ini tidak boleh ditutup dengan klik overlay / Escape */
  disableEscapeClose?: boolean;
  confirmVariant?: "primary" | "destructive";
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  disableEscapeClose = false,
  confirmVariant = "primary",
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const titleId = `dialog-title-${generatedId.replace(/:/g, "")}`;

  // Autofocus only once on open
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  // Trap focus & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !disableEscapeClose) {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Lock scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, disableEscapeClose, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={disableEscapeClose ? undefined : onClose}
      />

      {/* Dialog (desktop) / Sheet bottom (mobile via sm:) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
        className="
          fixed z-50 inset-x-4 bottom-0 sm:inset-0
          sm:flex sm:items-center sm:justify-center
          outline-none
        "
      >
        <div
          className="
            w-full sm:max-w-lg
            bg-background border border-border
            rounded-t-md sm:rounded-md
            shadow-lg
            flex flex-col
            max-h-[90vh] sm:max-h-[85vh]
            animate-[slideUp_0.2s_ease-out] sm:animate-none
          "
        >
          {/* Title */}
          <div className="px-6 pt-6 pb-3 shrink-0">
            <h2 id={titleId} className="text-xl font-semibold text-foreground">
              {title}
            </h2>
          </div>

          {/* Content — scrollable */}
          <div className="px-6 pb-2 text-base text-muted-foreground leading-relaxed overflow-y-auto flex-1">
            {children}
          </div>

          {/* Footer actions */}
          {(confirmLabel || cancelLabel) && (
            <div className="px-6 pb-6 pt-4 shrink-0 flex flex-col-reverse sm:flex-row gap-2 border-t border-border/50 mt-2">
              {cancelLabel && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  {cancelLabel}
                </Button>
              )}
              {confirmLabel && onConfirm && (
                <Button
                  variant={confirmVariant}
                  className="flex-1"
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Slide-up animation (mobile) */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
