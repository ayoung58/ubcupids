"use client";

import React from "react";
import { ImportanceLevel } from "@/types/questionnaire-v2";
import { cn } from "@/lib/utils";

interface ImportanceScaleProps {
  value: ImportanceLevel | null;
  onChange: (value: ImportanceLevel) => void;
  onDealbreakerToggle: (isDealer: boolean) => void;
  isDealer: boolean;
  disabled?: boolean;
}

/**
 * ImportanceScale Component
 *
 * Horizontal radio button scale for importance levels:
 * - NOT_IMPORTANT (0.0)
 * - SOMEWHAT_IMPORTANT (0.5)
 * - IMPORTANT (1.0)
 * - VERY_IMPORTANT (2.0)
 *
 * Plus a dealbreaker button that, when active:
 * - Marks this question as a hard filter
 * - Incompatible answers will eliminate the pair
 */
export function ImportanceScale({
  value,
  onChange,
  onDealbreakerToggle,
  isDealer,
  disabled = false,
}: ImportanceScaleProps) {
  const options = [
    {
      value: ImportanceLevel.NOT_IMPORTANT,
      label: "Not Important",
      shortLabel: "Not",
    },
    {
      value: ImportanceLevel.SOMEWHAT_IMPORTANT,
      label: "Somewhat Important",
      shortLabel: "Somewhat",
    },
    {
      value: ImportanceLevel.IMPORTANT,
      label: "Important",
      shortLabel: "Important",
    },
    {
      value: ImportanceLevel.VERY_IMPORTANT,
      label: "Very Important",
      shortLabel: "Very",
    },
  ];

  return (
    <div className="space-y-3" data-tutorial="importance-scale">
      <label className="text-sm font-medium text-slate-700">
        How important is it for your match to be as you specified?
      </label>

      {/* Importance Scale */}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value === option.value && !isDealer;
          const isDisabledByDealer = isDealer || disabled;
          return (
            <button
              key={option.value}
              type="button"
              disabled={isDisabledByDealer}
              onClick={() => {
                onChange(option.value);
                if (isDealer) {
                  onDealbreakerToggle(false);
                }
              }}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                "border-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2",
                isDisabledByDealer && "opacity-50 cursor-not-allowed",
                isSelected
                  ? "bg-pink-500 text-white border-pink-500"
                  : "bg-white text-slate-700 border-slate-300 hover:border-pink-400"
              )}
            >
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">{option.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Dealbreaker Button */}
      <div className="pt-2" data-tutorial="dealbreaker-button">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDealbreakerToggle(!isDealer)}
          className={cn(
            "w-full px-4 py-3 rounded-md text-sm font-semibold transition-all",
            "border-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed",
            isDealer
              ? "bg-red-500 text-white border-red-500 shadow-md"
              : "bg-white text-red-600 border-red-300 hover:border-red-400 hover:bg-red-50"
          )}
        >
          {isDealer ? "✓ This is a Dealbreaker" : "Mark as Dealbreaker"}
        </button>
        {!disabled && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            ⚠️ Dealbreakers should be used sparingly. This will immediately
            exclude potential matches.
          </p>
        )}
      </div>
    </div>
  );
}
