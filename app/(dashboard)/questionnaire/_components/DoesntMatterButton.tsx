"use client";

import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

interface DoesntMatterButtonProps {
  isActive: boolean;
  onChange: (isActive: boolean) => void;
  disabled?: boolean;
}

/**
 * DoesntMatterButton Component
 *
 * Toggle button that allows users to indicate a preference "doesn't matter" to them.
 * When active:
 * - Sets weight to 0 in matching algorithm
 * - Disables importance selector
 * - Disables dealbreaker toggle
 * - Excludes question from scoring calculations
 *
 * Used on the right side (preference panel) of split-screen questions.
 */
export function DoesntMatterButton({
  isActive,
  onChange,
  disabled = false,
}: DoesntMatterButtonProps) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={() => onChange(!isActive)}
      disabled={disabled}
      className={`
        transition-all duration-200
        ${
          isActive
            ? "bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
            : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <XCircle className="h-4 w-4 mr-1.5" />
      Doesn&apos;t Matter
    </Button>
  );
}
