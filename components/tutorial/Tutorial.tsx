"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the element to highlight
  position?: "top" | "bottom" | "left" | "right";
  offset?: { x: number; y: number };
}

interface TutorialProps {
  steps: TutorialStep[];
  tutorialId: string; // Unique ID to track completion
  onComplete?: () => void;
  onSkip?: () => void;
}

export function Tutorial({
  steps,
  tutorialId,
  onComplete,
  onSkip,
}: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  // Check if tutorial has been completed on initialization
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(`tutorial-${tutorialId}`);
      return !completed;
    }
    return false;
  });
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const updatePosition = () => {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setHighlightRect(rect);

        // Calculate tooltip position
        const tooltipElement = tooltipRef.current;
        if (tooltipElement) {
          const tooltipRect = tooltipElement.getBoundingClientRect();
          let top = 0;
          let left = 0;

          const offset = step.offset || { x: 0, y: 0 };

          switch (step.position || "bottom") {
            case "top":
              top = rect.top - tooltipRect.height - 20 + offset.y;
              left =
                rect.left + rect.width / 2 - tooltipRect.width / 2 + offset.x;
              break;
            case "bottom":
              top = rect.bottom + 20 + offset.y;
              left =
                rect.left + rect.width / 2 - tooltipRect.width / 2 + offset.x;
              break;
            case "left":
              top =
                rect.top + rect.height / 2 - tooltipRect.height / 2 + offset.y;
              left = rect.left - tooltipRect.width - 20 + offset.x;
              break;
            case "right":
              top =
                rect.top + rect.height / 2 - tooltipRect.height / 2 + offset.y;
              left = rect.right + 20 + offset.x;
              break;
          }

          // Ensure tooltip stays within viewport
          top = Math.max(
            20,
            Math.min(top, window.innerHeight - tooltipRect.height - 20)
          );
          left = Math.max(
            20,
            Math.min(left, window.innerWidth - tooltipRect.width - 20)
          );

          setTooltipPosition({ top, left });
        }
      }
    };

    // Initial position calculation
    setTimeout(updatePosition, 100);

    // Recalculate on scroll and resize
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem(`tutorial-${tutorialId}`, "skipped");
    onSkip?.();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem(`tutorial-${tutorialId}`, "completed");
    onComplete?.();
  };

  if (!isVisible || currentStep >= steps.length) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[9998]"
        style={{ pointerEvents: "none" }}
      />

      {/* Highlight cutout */}
      {highlightRect && (
        <div
          className="fixed border-4 border-white rounded-lg shadow-2xl z-[9999] pointer-events-none"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
          }}
        />
      )}

      {/* Tooltip */}
      <Card
        ref={tooltipRef}
        className="fixed z-[10000] w-[380px] shadow-2xl"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900">
              {step.title}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-slate-600 mb-4">{step.content}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {currentStep + 1} of {steps.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button variant="outline" size="sm" onClick={handleSkip}>
                Skip Help
              </Button>
              <Button size="sm" onClick={handleNext} className="bg-primary">
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                {currentStep !== steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
