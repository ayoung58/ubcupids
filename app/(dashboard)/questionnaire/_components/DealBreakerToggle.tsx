"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface DealBreakerToggleProps {
  questionId: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * DealBreakerToggle Component
 *
 * Checkbox that marks a preference as a dealbreaker (hard filter).
 * When checked:
 * - Automatically disqualifies potential matches who don't meet the requirement
 * - Applied in Phase 1 of matching algorithm (before scoring)
 * - Shows inline warning to indicate severity
 * - Sets importance to maximum (4)
 *
 * Disabled when:
 * - "Doesn't Matter" button is active
 * - Question is read-only/submitted
 */
export function DealBreakerToggle({
  questionId,
  checked,
  onChange,
  disabled = false,
}: DealBreakerToggleProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`dealbreaker-${questionId}`}
          checked={checked}
          onCheckedChange={onChange}
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
      {checked && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>
            This will automatically reject matches who don&apos;t meet this
            requirement.
          </span>
        </div>
      )}
    </div>
  );
}
