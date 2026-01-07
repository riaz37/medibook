"use client";

import { ChevronRightIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PROGRESS_STEPS = ["Select Doctor", "Choose Time", "Confirm", "Payment"];

function ProgressSteps({ 
  currentStep, 
  skipFirstStep = false 
}: { 
  currentStep: number;
  skipFirstStep?: boolean;
}) {
  const displaySteps = skipFirstStep ? PROGRESS_STEPS.slice(1) : PROGRESS_STEPS;
  const adjustedStep = skipFirstStep ? currentStep - 1 : currentStep;
  const progressPercentage = ((adjustedStep - 1) / (displaySteps.length - 1)) * 100;

  return (
    <div className="mb-8 space-y-4">
      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {displaySteps.map((stepName, index) => {
          const stepNumber = index + 1;
          const isActive = adjustedStep >= stepNumber;
          const isCurrent = adjustedStep === stepNumber;
          const isCompleted = adjustedStep > stepNumber;

          return (
            <div key={stepNumber} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                {/* step circle */}
                <div
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 touch-manipulation",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isActive && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* step name - hidden on mobile, shown on larger screens */}
                <span
                  className={cn(
                    "text-xs sm:text-sm text-center font-medium transition-colors hidden sm:block truncate w-full",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {stepName}
                </span>
              </div>

              {/* arrow (not shown for last step) */}
              {stepNumber < PROGRESS_STEPS.length && (
                <ChevronRightIcon className="w-4 h-4 text-muted-foreground hidden sm:block flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Label (Mobile) */}
      <div className="sm:hidden text-center">
        <p className="text-sm font-medium text-foreground">
          Step {adjustedStep} of {displaySteps.length}: {displaySteps[adjustedStep - 1]}
        </p>
      </div>
    </div>
  );
}
export default ProgressSteps;
