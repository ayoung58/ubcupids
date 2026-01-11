"use client";

import { PreferenceType } from "@/src/lib/questionnaire-types";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PreferenceSelectorProps {
  questionId: string;
  value: PreferenceType;
  onChange: (value: PreferenceType) => void;
  disabled?: boolean;
  options: PreferenceOption[];
  label?: string;
}

interface PreferenceOption {
  value: PreferenceType;
  label: string;
  description?: string;
}

/**
 * PreferenceSelector Component
 *
 * Button group for selecting preference type (same, similar, different, more, less, etc.).
 * Used in V2 questionnaire on the right side (preference panel).
 *
 * Common preference patterns:
 * - same/similar/different: For categorical and ordinal questions
 * - same_or_similar: Shorthand for values close to user's own
 * - more/less: For directional Likert scales (exercise, ambition, etc.)
 * - compatible: For special cases like conflict resolution
 * - specific_values: When user selects from multi-select options
 *
 * Default option varies by question type (typically "similar").
 */
export function PreferenceSelector({
  questionId,
  value,
  onChange,
  disabled = false,
  options,
  label = "I prefer my match to:",
}: PreferenceSelectorProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={`preference-${questionId}`}
        className={`text-xs font-medium ${
          disabled ? "text-gray-400" : "text-gray-700"
        }`}
      >
        {label}
      </label>
      <div
        id={`preference-${questionId}`}
        className="flex flex-wrap gap-2"
        role="radiogroup"
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={`
                transition-all duration-200 relative
                ${
                  isSelected
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
              title={option.description}
            >
              {isSelected && (
                <Check className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              )}
              {option.label}
            </Button>
          );
        })}
      </div>
      {/* Show description for selected option if available */}
      {value && (
        <p className="text-xs text-gray-500 mt-1">
          {options.find((opt) => opt.value === value)?.description}
        </p>
      )}
    </div>
  );
}

/**
 * Predefined preference option sets for common question types
 */
export const PREFERENCE_OPTIONS = {
  // For categorical questions (religion, relationship style, etc.)
  SAME_SIMILAR: [
    {
      value: "same" as PreferenceType,
      label: "Same",
      description: "Exactly the same as mine",
    },
    {
      value: "similar" as PreferenceType,
      label: "Similar",
      description: "Close to mine, but can vary",
    },
  ],

  // For ordinal/Likert scales with direction
  SAME_SIMILAR_DIFFERENT: [
    {
      value: "same" as PreferenceType,
      label: "Same",
      description: "Exactly the same as mine",
    },
    {
      value: "similar" as PreferenceType,
      label: "Similar",
      description: "Close to mine",
    },
    {
      value: "different" as PreferenceType,
      label: "Different",
      description: "Opposite or contrasting",
    },
  ],

  // For directional preferences (exercise, activity level, etc.)
  DIRECTIONAL: [
    {
      value: "less" as PreferenceType,
      label: "Less",
      description: "Lower than mine",
    },
    {
      value: "same" as PreferenceType,
      label: "Same",
      description: "About the same as mine",
    },
    {
      value: "similar" as PreferenceType,
      label: "Similar",
      description: "Close to mine",
    },
    {
      value: "more" as PreferenceType,
      label: "More",
      description: "Higher than mine",
    },
  ],

  // For conflict resolution (uses compatibility matrix)
  CONFLICT_RESOLUTION: [
    {
      value: "same" as PreferenceType,
      label: "Same",
      description: "Approach conflict the same way",
    },
    {
      value: "compatible" as PreferenceType,
      label: "Compatible",
      description: "Complementary approaches",
    },
  ],
};
