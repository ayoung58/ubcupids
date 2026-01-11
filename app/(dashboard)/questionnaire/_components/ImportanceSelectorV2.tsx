"use client";

import { ImportanceLevel } from "@/src/lib/questionnaire-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImportanceSelectorV2Props {
  questionId: string;
  value: ImportanceLevel;
  onChange: (value: ImportanceLevel) => void;
  disabled?: boolean;
  label?: string; // Optional custom label
}

/**
 * ImportanceSelectorV2 Component
 *
 * Dropdown selector for importance ratings (1-4 scale).
 * Used in V2 questionnaire on the right side (preference panel).
 *
 * Importance weights in matching algorithm:
 * - 1 (Low): 0.25× weight
 * - 2 (Moderate): 0.5× weight
 * - 3 (Important): 0.75× weight
 * - 4 (Very Important): 1.0× weight
 *
 * Note: Disabled when "Doesn't Matter" is active OR when dealbreaker is checked.
 */
const IMPORTANCE_OPTIONS = [
  { value: 1, label: "Low Importance" },
  { value: 2, label: "Moderate Importance" },
  { value: 3, label: "Important" },
  { value: 4, label: "Very Important" },
] as const;

export function ImportanceSelectorV2({
  questionId,
  value,
  onChange,
  disabled = false,
  label = "How important is this?",
}: ImportanceSelectorV2Props) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`importance-${questionId}`}
        className={`text-xs font-medium ${
          disabled ? "text-gray-400" : "text-gray-700"
        }`}
      >
        {label}
      </label>
      <Select
        value={value.toString()}
        onValueChange={(val) => onChange(parseInt(val) as ImportanceLevel)}
        disabled={disabled}
      >
        <SelectTrigger
          id={`importance-${questionId}`}
          className={`
            w-full h-9 text-sm
            ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
          `}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {IMPORTANCE_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value.toString()}
              className="cursor-pointer"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
