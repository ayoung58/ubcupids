"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AGE_LIMITS } from "@/lib/questionnaire/v2/constants";

export interface AgeValue {
  userAge: number | null;
  minAge: number | null;
  maxAge: number | null;
}

interface AgeInputProps {
  value: AgeValue;
  onChange: (value: AgeValue) => void;
  showPreference?: boolean; // If true, show only preference; if false, show only user age
}

/**
 * AgeInput Component (Q4)
 *
 * Special age input with validation:
 * - User's age (single input) - shown on left side
 * - Preference: Min and Max age range - shown on right side
 * - Validation: 18-40 range, min < max
 * - Red outline on invalid input
 *
 * Props:
 * - showPreference: If true, show only preference inputs; if false, show only user age
 */
export function AgeInput({
  value,
  onChange,
  showPreference = false,
}: AgeInputProps) {
  const handleUserAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const age = val === "" ? null : parseInt(val, 10);
    onChange({ ...value, userAge: age });
  };

  const handleMinAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const age = val === "" ? null : parseInt(val, 10);
    onChange({ ...value, minAge: age });
  };

  const handleMaxAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const age = val === "" ? null : parseInt(val, 10);
    onChange({ ...value, maxAge: age });
  };

  // Validation
  const isUserAgeValid =
    value.userAge !== null &&
    value.userAge >= AGE_LIMITS.MIN &&
    value.userAge <= AGE_LIMITS.MAX;

  const isMinAgeValid =
    value.minAge === null ||
    (value.minAge >= AGE_LIMITS.MIN && value.minAge <= AGE_LIMITS.MAX);

  const isMaxAgeValid =
    value.maxAge === null ||
    (value.maxAge >= AGE_LIMITS.MIN && value.maxAge <= AGE_LIMITS.MAX);

  const isRangeValid =
    value.minAge !== null && value.maxAge !== null
      ? value.minAge < value.maxAge
      : true;

  const hasUserAgeError = value.userAge !== null && !isUserAgeValid;
  const hasMinAgeError =
    value.minAge !== null && (!isMinAgeValid || !isRangeValid);
  const hasMaxAgeError =
    value.maxAge !== null && (!isMaxAgeValid || !isRangeValid);

  // Show only user age (left side)
  if (!showPreference) {
    return (
      <div className="min-h-[120px] flex flex-col justify-center">
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Your age
        </label>
        <Input
          type="number"
          min={AGE_LIMITS.MIN}
          max={AGE_LIMITS.MAX}
          value={value.userAge ?? ""}
          onChange={handleUserAgeChange}
          placeholder="Enter your age"
          className={cn(
            "w-32",
            hasUserAgeError &&
              "border-red-500 ring-2 ring-red-200 focus:ring-red-500"
          )}
        />
        {hasUserAgeError && (
          <p className="text-sm text-red-600 mt-1">
            Age must be between {AGE_LIMITS.MIN} and {AGE_LIMITS.MAX}
          </p>
        )}
      </div>
    );
  }

  // Show only preference (right side)
  return (
    <div className="min-h-[120px]">
      <label className="text-sm font-medium text-slate-700 mb-3 block">
        Preferred age range
      </label>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            type="number"
            min={AGE_LIMITS.MIN}
            max={AGE_LIMITS.MAX}
            value={value.minAge ?? ""}
            onChange={handleMinAgeChange}
            placeholder="Min"
            className={cn(
              "w-full",
              hasMinAgeError &&
                "border-red-500 ring-2 ring-red-200 focus:ring-red-500"
            )}
          />
        </div>
        <span className="text-slate-500 font-medium">to</span>
        <div className="flex-1">
          <Input
            type="number"
            min={AGE_LIMITS.MIN}
            max={AGE_LIMITS.MAX}
            value={value.maxAge ?? ""}
            onChange={handleMaxAgeChange}
            placeholder="Max"
            className={cn(
              "w-full",
              hasMaxAgeError &&
                "border-red-500 ring-2 ring-red-200 focus:ring-red-500"
            )}
          />
        </div>
      </div>
      {(hasMinAgeError || hasMaxAgeError) && (
        <p className="text-sm text-red-600 mt-2">
          {!isRangeValid
            ? "Min age must be less than max age"
            : `Ages must be between ${AGE_LIMITS.MIN} and ${AGE_LIMITS.MAX}`}
        </p>
      )}
    </div>
  );
}
