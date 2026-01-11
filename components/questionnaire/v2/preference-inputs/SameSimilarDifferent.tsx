"use client";

import React from "react";
import { cn } from "@/lib/utils";

type PreferenceOption = "same" | "similar" | "different";

interface SameSimilarDifferentProps {
  value: PreferenceOption | null;
  onChange: (value: PreferenceOption) => void;
  options?: PreferenceOption[]; // Allow customizing which options to show
  disabled?: boolean;
}

/**
 * SameSimilarDifferent Component
 *
 * 3-option preference selector (same/similar/different).
 * Default is "similar" for most questions.
 * Can be customized to show only specific options (e.g., only "same" for Q11).
 */
export function SameSimilarDifferent({
  value,
  onChange,
  options = ["same", "similar", "different"],
  disabled = false,
}: SameSimilarDifferentProps) {
  const optionLabels: Record<PreferenceOption, string> = {
    same: "Same",
    similar: "Similar",
    different: "Different",
  };

  const optionDescriptions: Record<PreferenceOption, string> = {
    same: "Exactly the same as me",
    similar: "Close to my answer",
    different: "Opposite or complementary",
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">
        I prefer my match to be:
      </label>

      {options.map((option) => (
        <label
          key={option}
          className={cn(
            "flex items-center justify-between gap-3 p-3 rounded-md border-2 cursor-pointer transition-all",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "hover:bg-purple-50",
            value === option
              ? "border-purple-500 bg-purple-50"
              : "border-slate-200"
          )}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="preference"
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value as PreferenceOption)}
              disabled={disabled}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">
                {optionLabels[option]}
              </span>
              <p className="text-xs text-slate-500">
                {optionDescriptions[option]}
              </p>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}
