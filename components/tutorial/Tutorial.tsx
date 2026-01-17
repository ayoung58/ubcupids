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
  position?: "top" | "bottom" | "left" | "right" | "center";
  offset?: { x: number; y: number };
  hideArrow?: boolean; // Option to hide the directional arrow
}

interface TutorialProps {
  steps: TutorialStep[];
  tutorialId: string; // Unique ID to track completion
  initialCompleted?: boolean; // Server-provided completion status
  onComplete?: () => void;
  onSkip?: () => void;
}

export function Tutorial({
  steps,
  tutorialId,
  initialCompleted = false,
  onComplete,
  onSkip,
}: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  // Use server-provided completion status
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

        // Calculate tooltip position
        const tooltipElement = tooltipRef.current;
        if (tooltipElement) {
          const tooltipRect = tooltipElement.getBoundingClientRect();
          let top = 0;
          let left = 0;

          const offset = step.offset || { x: 0, y: 0 };

          switch (step.position || "bottom") {
            case "center":
              // Center the tooltip on screen
              top = window.innerHeight / 2 - tooltipRect.height / 2 + offset.y;
              left = window.innerWidth / 2 - tooltipRect.width / 2 + offset.x;
              setArrowPosition("bottom"); // Default, but won't show if hideArrow is true
              break;
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

    // Scroll element into view first
    const targetElement = document.querySelector(step.target);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

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

  // Block body scroll when tutorial is active
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isVisible]);

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

  const handleSkip = async () => {
    setIsVisible(false);

    // Update server
    try {
      await fetch("/api/tutorial/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialId }),
      });
    } catch (error) {
      console.error("Error updating tutorial completion:", error);
    }

    onSkip?.();
  };

  const handleComplete = async () => {
    setIsVisible(false);

    // Update server
    try {
      await fetch("/api/tutorial/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialId }),
      });
    } catch (error) {
      console.error("Error updating tutorial completion:", error);
    }

    onComplete?.();
  };

  if (!isVisible || currentStep >= steps.length) return null;

  const step = steps[currentStep];

  // Get arrow character based on position (arrow points from tooltip to target)
  const getArrowChar = (pos: string) => {
    if (pos.includes("left")) return "→"; // tooltip is left, points right to element
    if (pos.includes("right")) return "←"; // tooltip is right, points left to element
    if (pos.includes("top")) return "↓"; // tooltip is above, points down to element
    if (pos.includes("bottom")) return "↑"; // tooltip is below, points up to element
    return "";
  };

  return (
    <>
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
              {!step.hideArrow && getArrowChar(step.position || "bottom")}{" "}
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
