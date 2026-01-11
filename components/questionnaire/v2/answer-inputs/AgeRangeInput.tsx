"use client";

import React from "react";
import { AGE_LIMITS } from "@/lib/questionnaire/v2/constants";

interface AgeRangeInputProps {
  minAge: number | null;
  maxAge: number | null;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}

/**
 * AgeRangeInput Component
 *
 * Dual numeric input for age range preference (Q4).
 * Validates: min >= 18, max <= 40, min < max
 */
export function AgeRangeInput({
  minAge,
  maxAge,
  onMinChange,
  onMaxChange,
}: AgeRangeInputProps) {
  const handleMinChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= AGE_LIMITS.MIN && num <= AGE_LIMITS.MAX) {
      onMinChange(num);
    }
  };

  const handleMaxChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= AGE_LIMITS.MIN && num <= AGE_LIMITS.MAX) {
      onMaxChange(num);
    }
  };

  const isValid =
    minAge !== null &&
    maxAge !== null &&
    minAge < maxAge &&
    minAge >= AGE_LIMITS.MIN &&
    maxAge <= AGE_LIMITS.MAX;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700">
        My match should be between:
      </label>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="number"
            min={AGE_LIMITS.MIN}
            max={AGE_LIMITS.MAX}
            value={minAge ?? ""}
            onChange={(e) => handleMinChange(e.target.value)}
            placeholder="Min"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <span className="text-slate-500 text-sm">and</span>

        <div className="flex-1">
          <input
            type="number"
            min={AGE_LIMITS.MIN}
            max={AGE_LIMITS.MAX}
            value={maxAge ?? ""}
            onChange={(e) => handleMaxChange(e.target.value)}
            placeholder="Max"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <span className="text-slate-500 text-sm">years old</span>
      </div>

      {/* Validation Feedback */}
      {minAge !== null && maxAge !== null && !isValid && (
        <p className="text-xs text-red-600">
          ⚠️ Min age must be less than max age (range: {AGE_LIMITS.MIN}-
          {AGE_LIMITS.MAX})
        </p>
      )}

      {isValid && (
        <p className="text-xs text-green-600">
          ✓ Age range: {minAge}-{maxAge} years old
        </p>
      )}
    </div>
  );
}
