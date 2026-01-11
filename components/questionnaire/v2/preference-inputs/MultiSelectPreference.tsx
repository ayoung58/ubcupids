"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectPreferenceProps {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * MultiSelectPreference Component
 *
 * Checkbox group for multi-select preferences (right side).
 * Matches the options from the left side answer.
 * Used for questions like Q8 (Alcohol), Q14 (Field of Study), etc.
 */
export function MultiSelectPreference({
  options,
  values,
  onChange,
  label = "I prefer my match to be:",
  disabled = false,
}: MultiSelectPreferenceProps) {
  const handleToggle = (optionValue: string) => {
    if (values.includes(optionValue)) {
      // Remove
      onChange(values.filter((v) => v !== optionValue));
    } else {
      // Add
      onChange([...values, optionValue]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>

      {options.map((option) => {
        const isChecked = values.includes(option.value);

        return (
          <label
            key={option.value}
            className={cn(
              "flex items-center gap-3 p-3 rounded-md border-2 transition-all",
              disabled && "opacity-50 cursor-not-allowed",
              !disabled && "cursor-pointer hover:bg-purple-50",
              isChecked ? "border-purple-500 bg-purple-50" : "border-slate-200"
            )}
          >
            <input
              type="checkbox"
              checked={isChecked}
              disabled={disabled}
              onChange={() => handleToggle(option.value)}
              className={cn(
                "h-4 w-4 text-purple-600 rounded focus:ring-purple-500",
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              )}
            />
            <span className="text-sm text-slate-700">{option.label}</span>
          </label>
        );
      })}

      {values.length > 0 && (
        <p className="text-xs text-slate-600 mt-2">
          {values.length} option{values.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
