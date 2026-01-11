"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SingleSelectInputProps {
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  includeOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}

/**
 * SingleSelectInput Component
 *
 * Radio button group for single-select questions.
 * Optionally includes "Other" with text input.
 */
export function SingleSelectInput({
  options,
  value,
  onChange,
  includeOther = false,
  otherValue = "",
  onOtherChange,
}: SingleSelectInputProps) {
  const isOtherSelected = value === "other";

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex items-center gap-3 p-3 rounded-md border-2 cursor-pointer transition-all",
            "hover:bg-slate-50",
            value === option.value
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200"
          )}
        >
          <input
            type="radio"
            name="single-select"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm text-slate-700">{option.label}</span>
        </label>
      ))}

      {/* Other option */}
      {includeOther && (
        <div className="space-y-2">
          <label
            className={cn(
              "flex items-center gap-3 p-3 rounded-md border-2 cursor-pointer transition-all",
              "hover:bg-slate-50",
              isOtherSelected
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200"
            )}
          >
            <input
              type="radio"
              name="single-select"
              value="other"
              checked={isOtherSelected}
              onChange={(e) => onChange(e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
