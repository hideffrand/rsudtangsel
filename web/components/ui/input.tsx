/**
 * Input, Select, Textarea - RSU Tangsel Care
 * Label SELALU visible di atas input (bukan placeholder-only - Design.md §3)
 * Error message terhubung via aria-describedby (Design.md §5.2)
 */

import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";

// ─── Shared base styles ───────────────────────────────────────────────────────

const inputBaseStyles =
  "w-full h-11 px-3.5 text-base text-foreground bg-background " +
  "border border-border rounded-sm " +
  "placeholder:text-muted-foreground " +
  "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary " +
  "disabled:bg-muted disabled:cursor-not-allowed " +
  "transition-all duration-150 shadow-xs";

// ─── Label ────────────────────────────────────────────────────────────────────

interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}

export function Label({ htmlFor, children, required }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-foreground mb-1.5"
    >
      {children}
      {required && (
        <span className="text-destructive ml-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

// ─── FormField wrapper ────────────────────────────────────────────────────────

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ id, label, required, error, children }: FormFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-0">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs text-destructive flex items-center gap-1 font-medium"
        >
          {/* Ikon error - bukan hanya warna merah (Design.md §5.2) */}
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, className = "", ...props }, ref) => {
    const errorId = `${id}-error`;
    return (
      <FormField id={id} label={label} required={props.required} error={error}>
        <input
          ref={ref}
          id={id}
          className={`${inputBaseStyles} ${error ? "border-destructive focus:border-destructive focus:ring-destructive" : ""} ${className}`}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />
      </FormField>
    );
  }
);
Input.displayName = "Input";

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, label, options, placeholder, error, className = "", ...props }, ref) => {
    const errorId = `${id}-error`;
    return (
      <FormField id={id} label={label} required={props.required} error={error}>
        <select
          ref={ref}
          id={id}
          className={`${inputBaseStyles} bg-[image:none] ${error ? "border-destructive" : ""} ${className}`}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>
    );
  }
);
Select.displayName = "Select";

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, error, className = "", ...props }, ref) => {
    const errorId = `${id}-error`;
    return (
      <FormField id={id} label={label} required={props.required} error={error}>
        <textarea
          ref={ref}
          id={id}
          className={`
            w-full px-3.5 py-2.5 text-base text-foreground bg-background
            border border-border rounded-sm
            placeholder:text-muted-foreground
            focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
            disabled:bg-muted disabled:cursor-not-allowed
            transition-all duration-150 resize-y min-h-[80px] shadow-xs
            ${error ? "border-destructive" : ""}
            ${className}
          `}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />
      </FormField>
    );
  }
);
Textarea.displayName = "Textarea";
