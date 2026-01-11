"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface DealBreakerToggleProps {
  questionId: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  onConfirm?: () => void; // Callback for confirmation modal
}

/**
 * DealBreakerToggle Component
 *
 * Checkbox that marks a preference as a dealbreaker (hard filter).
 * When checked:
 * - Automatically disqualifies potential matches who don't meet the requirement
 * - Applied in Phase 1 of matching algorithm (before scoring)
 * - Shows warning icon to indicate severity
 *
 * Disabled when:
 * - "Doesn't Matter" button is active
 * - Question is read-only/submitted
 *
 * Shows confirmation modal when first checked to prevent accidental dealbreakers.
 */
export function DealBreakerToggle({
  questionId,
  checked,
  onChange,
  disabled = false,
  onConfirm,
}: DealBreakerToggleProps) {
  const handleChange = (newChecked: boolean) => {
    // If checking for first time and confirmation callback provided, show modal
    if (newChecked && !checked && onConfirm) {
      onConfirm();
    } else {
      onChange(newChecked);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`dealbreaker-${questionId}`}
        checked={checked}
        onCheckedChange={handleChange}
        disabled={disabled}
        className={`
          ${checked ? "border-red-500 bg-red-500" : "border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      />
      <Label
        htmlFor={`dealbreaker-${questionId}`}
        className={`
          text-sm font-medium flex items-center gap-1
          ${checked ? "text-red-600" : "text-gray-700"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {checked && <AlertTriangle className="h-3.5 w-3.5" />}
        Dealbreaker
      </Label>
    </div>
  );
}
