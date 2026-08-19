"use client";
import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  disableDismiss?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  disableDismiss = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Trap focus & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !disableDismiss) {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
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
    // Auto-focus panel saat buka
    panelRef.current?.focus();
    // Lock scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, disableDismiss, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={disableDismiss ? undefined : onClose}
      />

      {/* Floating panel */}
      <div
        role="dialog"
        aria-modal="true"
        ref={panelRef}
        tabIndex={-1}
        className="
          fixed z-100 inset-x-4 bottom-0 sm:inset-0
          sm:flex sm:items-center sm:justify-center
          outline-none
        "
      >
        <div
          className={`
            w-full sm:max-w-md
            bg-background border border-border
            rounded-t-md sm:rounded-md
            shadow-lg
            animate-[slideUp_0.2s_ease-out] sm:animate-none
            ${className}
          `}
        >
          {children}
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
