"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  allowCustomInput?: boolean;
  exclusive?: boolean;
}

interface MultiSelectInputProps {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
  disabled?: boolean;
}

/**
 * MultiSelectInput Component
 *
 * Checkbox group for multi-select questions.
 * Supports max selection limit (e.g., Q21: exactly 2, Q25: max 2).
 * Optionally includes "Other" with text input.
 */
export function MultiSelectInput({
  options,
  values,
  onChange,
  maxSelections,
  disabled = false,
}: MultiSelectInputProps) {
  // Ensure values is always an array (defensive programming)
  const safeValues = Array.isArray(values) ? values : [];

  const isMaxReached =
    maxSelections !== undefined && safeValues.length >= maxSelections;

  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    const selectedOption = options.find((o) => o.value === optionValue);
    const isExclusive =
      selectedOption?.exclusive || optionValue === "prefer_not_to_answer";

    if (safeValues.includes(optionValue)) {
      // Remove
      onChange(safeValues.filter((v) => v !== optionValue));
    } else {
      // Handle mutually exclusive options ("prefer_not_to_answer" or options marked as exclusive)
      if (isExclusive) {
        // If selecting an exclusive option, deselect all other options
        onChange([optionValue]);
      } else {
        // If selecting any other option, deselect all exclusive options
        let newValues = safeValues.filter((v) => {
          const opt = options.find((o) => o.value === v);
          return v !== "prefer_not_to_answer" && !opt?.exclusive;
        });

        // Add (if not at max)
        if (maxSelections === undefined || newValues.length < maxSelections) {
          newValues = [...newValues, optionValue];
        }

        onChange(newValues);
      }
    }
  };

  return (
    <div className="space-y-2">
      {maxSelections && (
        <p className="text-xs text-slate-600 mb-3">
          {maxSelections === safeValues.length
            ? `✓ Selected ${safeValues.length}/${maxSelections}`
            : `(${safeValues.length}/${maxSelections} selected)`}
        </p>
      )}

      {options.map((option) => {
        const isChecked = safeValues.includes(option.value);
        const isDisabledOption = !isChecked && (isMaxReached || disabled);

        return (
          <label
            key={option.value}
            className={cn(
              "flex items-center gap-3 p-3 rounded-md border-2 transition-all",
              isDisabledOption
                ? "opacity-50 cursor-not-allowed border-slate-200"
                : "cursor-pointer hover:bg-slate-50",
              isChecked ? "border-blue-500 bg-blue-50" : "border-slate-200"
            )}
          >
            <input
              type="checkbox"
              checked={isChecked}
              disabled={isDisabledOption}
              onChange={() => handleToggle(option.value)}
              className={cn(
                "h-4 w-4 text-blue-600 rounded focus:ring-blue-500",
                isDisabledOption ? "cursor-not-allowed" : "cursor-pointer"
              )}
            />
            <span className="text-sm text-slate-700">{option.label}</span>
          </label>
        );
      })}

      {/* Custom input handling for options with allowCustomInput would go here */}
      {/* For now, options with allowCustomInput are treated as regular options */}
    </div>
  );
}
