"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ConflictResolutionPreferenceProps {
  value: "same" | "compatible" | null;
  onChange: (value: "same" | "compatible" | null) => void;
  disabled?: boolean;
  label?: string; // Custom label for the preference
}

/**
 * ConflictResolutionPreference Component
 *
 * Special preference selector for Q25 (Conflict Resolution).
 * Options: "same" | "compatible" | "doesn't matter"
 *
 * "Compatible" uses the compatibility matrix from the matching algorithm
 * to find complementary conflict resolution styles (e.g., Solution-focused
 * pairs well with Analysis-focused).
 */
export function ConflictResolutionPreference({
  value,
  onChange,
  disabled = false,
  label,
}: ConflictResolutionPreferenceProps) {
  const options: Array<{
    value: "same" | "compatible" | null;
    label: string;
    description: string;
  }> = [
    {
      value: "same",
      label: "Same",
      description: "Exact match of conflict styles",
    },
    {
      value: "compatible",
      label: "Compatible",
      description: "Complementary approaches that work well together",
    },
  ];

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-sm font-medium text-slate-700 block">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value || "null"}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={cn(
              "w-full text-left px-4 py-3 rounded-md transition-all",
              "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500",
              value === option.value
                ? "bg-pink-600 text-white border-pink-600"
                : "bg-white text-slate-700 border-slate-300 hover:border-pink-400 hover:bg-pink-50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="font-medium text-sm">{option.label}</div>
            <div
              className={cn(
                "text-xs mt-1",
                value === option.value ? "text-pink-100" : "text-slate-500"
              )}
            >
              {option.description}
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500 italic">
        💡 Tip: &quot;Compatible&quot; allows for complementary styles based on
        research (e.g., Solution-focused + Analysis-focused work well together)
      </p>
    </div>
  );
}
