"use client";

import React, { useState, useEffect, useRef } from "react";
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

interface TutorialV2Props {
  tutorialId: string; // Unique ID to track completion (e.g., "questionnaire-v2")
  steps: TutorialStep[];
  initialCompleted?: boolean; // Server-provided completion status
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * TutorialV2 Component
 *
 * Interactive tutorial overlay system for V2 questionnaire.
 * Features:
 * - Positioned tooltips that point to specific elements
 * - Spotlight effect on target elements
 * - Step-by-step navigation
 * - Skip and complete actions
 * - Persists completion state
 */
export function TutorialV2({
  tutorialId,
  steps,
  initialCompleted = false,
  onComplete,
  onSkip,
}: TutorialV2Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(!initialCompleted);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<
    "top" | "bottom" | "left" | "right"
  >("bottom");
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const updatePosition = () => {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();

        // Scroll element into view
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });

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
              setArrowPosition("bottom");
              break;
            case "bottom":
              top = rect.bottom + 20 + offset.y;
              left =
                rect.left + rect.width / 2 - tooltipRect.width / 2 + offset.x;
              setArrowPosition("top");
              break;
            case "left":
              top =
                rect.top + rect.height / 2 - tooltipRect.height / 2 + offset.y;
              left = rect.left - tooltipRect.width - 20 + offset.x;
              setArrowPosition("right");
              break;
            case "right":
              top =
                rect.top + rect.height / 2 - tooltipRect.height / 2 + offset.y;
              left = rect.right + 20 + offset.x;
              setArrowPosition("left");
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

    // Update position on mount and when window resizes
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [currentStep, isVisible, steps]);

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

  const handleSkip = async () => {
    setIsVisible(false);
    if (onSkip) {
      onSkip();
    }
    // Mark as completed so it doesn't show again
    await markTutorialComplete();
  };

  const handleComplete = async () => {
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
    await markTutorialComplete();
  };

  const markTutorialComplete = async () => {
    try {
      console.log("Marking tutorial as complete:", tutorialId);
      const response = await fetch("/api/tutorial/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialId }),
      });

      const data = await response.json();
      console.log("Tutorial completion response:", {
        status: response.status,
        data,
      });

      if (!response.ok) {
        console.error("Failed to mark tutorial complete:", data.error);
        return false;
      }

      console.log("Tutorial marked complete successfully");
      return true;
    } catch (error) {
      console.error("Failed to mark tutorial as complete:", error);
      return false;
    }
  };

  if (!isVisible || currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];
  const targetElement = document.querySelector(step.target);

  return (
    <>
      {/* Overlay with spotlight effect */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Spotlight on target element */}
        {targetElement && (
          <div
            className="absolute bg-transparent border-4 border-white rounded-lg shadow-2xl pointer-events-none"
            style={{
              top: targetElement.getBoundingClientRect().top - 8,
              left: targetElement.getBoundingClientRect().left - 8,
              width: targetElement.getBoundingClientRect().width + 16,
              height: targetElement.getBoundingClientRect().height + 16,
              boxShadow:
                "0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)",
            }}
          />
        )}
      </div>

      {/* Tutorial Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] pointer-events-auto"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        <Card className="w-80 sm:w-96 shadow-2xl border-2 border-pink-200">
          <CardContent className="p-6">
            {/* Close Button */}
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close tutorial"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Step Counter */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-pink-600 bg-pink-50 px-2 py-1 rounded">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-slate-900 mb-2 pr-8">
              {step.title}
            </h3>

            {/* Content */}
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {step.content}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Skip Tutorial
              </button>

              <div className="flex gap-2">
                <Button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="bg-pink-500 hover:bg-pink-600 gap-1"
                >
                  {currentStep === steps.length - 1 ? (
                    "Finish"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? "w-6 bg-pink-500"
                      : "w-1.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Arrow pointing to target */}
        <div
          className={`absolute w-4 h-4 bg-white border-2 border-pink-200 transform rotate-45 ${
            arrowPosition === "top"
              ? "-top-2 left-1/2 -translate-x-1/2"
              : arrowPosition === "bottom"
                ? "-bottom-2 left-1/2 -translate-x-1/2"
                : arrowPosition === "left"
                  ? "-left-2 top-1/2 -translate-y-1/2"
                  : "-right-2 top-1/2 -translate-y-1/2"
          }`}
        />
      </div>
    </>
  );
}
