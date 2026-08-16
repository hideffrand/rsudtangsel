/**
 * Card — RSU Tangsel Care
 * Border tipis + shadow minimal (Design.md §2.3, §3)
 * Radius 12px untuk card, bukan rounded-3xl yang berlebihan
 */

import { type HTMLAttributes, type ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-background border border-border rounded-md shadow-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }: CardHeaderProps) {
  return (
    <div className={`px-5 py-4 border-b border-border ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "", ...props }: CardBodyProps) {
  return (
    <div className={`px-5 py-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...props }: CardFooterProps) {
  return (
    <div className={`px-5 py-4 border-t border-border bg-muted/30 rounded-b-md ${className}`} {...props}>
      {children}
    </div>
  );
}
