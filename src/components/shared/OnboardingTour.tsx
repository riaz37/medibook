"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface OnboardingTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

const TOUR_STORAGE_KEY = "onboarding_tours_completed";

export function OnboardingTour({
  tourId,
  steps,
  onComplete,
  onSkip,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if tour was already completed
    const completedTours = JSON.parse(
      localStorage.getItem(TOUR_STORAGE_KEY) || "[]"
    );
    if (!completedTours.includes(tourId)) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setIsOpen(true);
      }, 500);
    }
  }, [tourId]);

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (!step.target) {
      setHighlightRect(null);
      setTooltipPosition(null);
      return;
    }

    const updateHighlight = () => {
      const element = document.querySelector(step.target!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);

        // Calculate tooltip position based on step position preference
        const position = step.position || "bottom";
        const tooltipWidth = 320; // Approximate tooltip width
        const tooltipHeight = 200; // Approximate tooltip height
        const spacing = 16;

        let top = 0;
        let left = 0;

        switch (position) {
          case "top":
            top = rect.top - tooltipHeight - spacing;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "bottom":
            top = rect.bottom + spacing;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - spacing;
            break;
          case "right":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + spacing;
            break;
          case "center":
            top = window.innerHeight / 2 - tooltipHeight / 2;
            left = window.innerWidth / 2 - tooltipWidth / 2;
            break;
        }

        // Keep tooltip within viewport
        top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

        setTooltipPosition({ top, left });

        // Scroll element into view
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      } else {
        setHighlightRect(null);
        setTooltipPosition(null);
      }
    };

    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight, true);

    return () => {
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight, true);
    };
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const completedTours = JSON.parse(
      localStorage.getItem(TOUR_STORAGE_KEY) || "[]"
    );
    completedTours.push(tourId);
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(completedTours));
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    setIsOpen(false);
    onSkip?.();
  };

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay with spotlight */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 transition-opacity duration-300"
        style={{
          clipPath: highlightRect
            ? `polygon(
                0% 0%, 
                0% 100%, 
                ${highlightRect.left}px 100%, 
                ${highlightRect.left}px ${highlightRect.top}px, 
                ${highlightRect.right}px ${highlightRect.top}px, 
                ${highlightRect.right}px ${highlightRect.bottom}px, 
                ${highlightRect.left}px ${highlightRect.bottom}px, 
                ${highlightRect.left}px 100%, 
                100% 100%, 
                100% 0%
              )`
            : undefined,
        }}
        onClick={handleSkip}
      />

      {/* Highlight border */}
      {highlightRect && (
        <div
          className="fixed z-[9999] pointer-events-none border-2 border-primary rounded-lg shadow-[0_0_0_4px_rgba(59,130,246,0.1),0_0_20px_rgba(59,130,246,0.3)] animate-pulse"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[10000] bg-background border-2 border-primary rounded-lg shadow-2xl p-6 w-80 transition-all duration-300",
          tooltipPosition ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={
          tooltipPosition
            ? {
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
              }
            : undefined
        }
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="h-6 w-6 flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2 mb-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
            <Button size="sm" onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
              {currentStep < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
