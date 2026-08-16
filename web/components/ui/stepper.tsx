/**
 * Stepper — RSU Tangsel Care
 * Angka langkah + label teks (bukan hanya ikon — Design.md §3)
 * Aksesibel: aria-current untuk step aktif
 */

interface StepperProps {
  steps: string[];       // label per step
  currentStep: number;   // 0-indexed
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Langkah pendaftaran">
      <ol className="flex items-start w-full">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <li
              key={index}
              className="flex flex-1 flex-col items-center relative"
              aria-current={isActive ? "step" : undefined}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    absolute top-4 left-1/2 w-full h-[2px]
                    ${isCompleted ? "bg-primary" : "bg-border"}
                    transition-colors duration-300
                  `}
                  aria-hidden="true"
                />
              )}

              {/* Step circle */}
              <div
                className={`
                  relative z-10 w-9 h-9 rounded-full flex items-center justify-center
                  text-sm font-semibold border-2 transition-all duration-300 shadow-xs
                  ${
                    isCompleted
                      ? "bg-primary border-primary text-white"
                      : isActive
                      ? "bg-white border-primary text-primary font-bold shadow-sm"
                      : "bg-white border-border text-muted-foreground"
                  }
                `}
              >
                {isCompleted ? (
                  // Checkmark untuk step selesai
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>

              {/* Step label */}
              <span
                className={`
                  mt-2 text-xs text-center leading-tight max-w-[80px]
                  ${
                    isActive
                      ? "text-primary font-semibold"
                      : isCompleted
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }
                `}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
