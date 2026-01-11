"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectInputProps {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
  includeOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
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
  includeOther = false,
  otherValue = "",
  onOtherChange,
  disabled = false,
}: MultiSelectInputProps) {
  const isOtherSelected = values.includes("other");
  const isMaxReached =
    maxSelections !== undefined && values.length >= maxSelections;

  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    if (values.includes(optionValue)) {
      // Remove
      onChange(values.filter((v) => v !== optionValue));
    } else {
      // Add (if not at max)
      if (!isMaxReached) {
        onChange([...values, optionValue]);
      }
    }
  };

  return (
    <div className="space-y-2">
      {maxSelections && (
        <p className="text-xs text-slate-600 mb-3">
          {maxSelections === values.length
            ? `✓ Selected ${values.length}/${maxSelections}`
            : `Select up to ${maxSelections} option${maxSelections > 1 ? "s" : ""} (${values.length}/${maxSelections} selected)`}
        </p>
      )}

      {options.map((option) => {
        const isChecked = values.includes(option.value);
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

      {/* Other option */}
      {includeOther && (
        <div className="space-y-2">
          <label
            className={cn(
              "flex items-center gap-3 p-3 rounded-md border-2 transition-all",
              !isOtherSelected && isMaxReached
                ? "opacity-50 cursor-not-allowed border-slate-200"
                : "cursor-pointer hover:bg-slate-50",
              isOtherSelected
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200"
            )}
          >
            <input
              type="checkbox"
              checked={isOtherSelected}
              disabled={!isOtherSelected && isMaxReached}
              onChange={() => handleToggle("other")}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm text-slate-700">Other</span>
          </label>

          {isOtherSelected && (
            <input
              type="text"
              value={otherValue}
              onChange={(e) => onOtherChange?.(e.target.value)}
              placeholder="Please specify..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      )}
    </div>
  );
}
