/**
 * Button — RSU Tangsel Care
 * Pola shadcn/ui: variant + size, min 44×44px (Design.md §5.1)
 */

import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  isLoading?: boolean;
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 " +
  "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs active:scale-[0.99]";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover border border-transparent " +
    "rounded-sm font-semibold",
  outline:
    "border border-border bg-white text-foreground hover:bg-muted hover:border-slate-300 " +
    "rounded-sm font-medium",
  ghost:
    "bg-transparent text-foreground hover:bg-muted " +
    "rounded-sm font-medium",
  destructive:
    "bg-destructive text-white hover:opacity-90 border border-transparent " +
    "rounded-sm font-semibold",
};

// min-height 44px untuk semua ukuran (Design.md §5.1 — tap target)
const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-11 px-4 text-sm",     // 44px height
  md: "h-11 px-5 text-base",
  lg: "h-12 px-6 text-base",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className = "",
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      children,
      isLoading = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

