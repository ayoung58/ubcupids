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
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}

      {options.map((option) => (
        <label
          key={option.value || "null"}
          className={cn(
            "flex items-center justify-between gap-3 p-3 rounded-md border-2 cursor-pointer transition-all",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "hover:bg-purple-50",
            value === option.value
              ? "border-purple-500 bg-purple-50"
              : "border-slate-200"
          )}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="conflict-preference"
              value={option.value || ""}
              checked={value === option.value}
              onChange={(e) =>
                onChange((e.target.value as "same" | "compatible") || null)
              }
              disabled={disabled}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">
                {option.label}
              </span>
              <p className="text-xs text-slate-500">{option.description}</p>
            </div>
          </div>
        </label>
      ))}

      <p className="text-xs text-slate-500 italic">
        💡 Tip: &quot;Compatible&quot; allows for complementary styles based on
        research (e.g., Solution-focused + Analysis-focused work well together)
      </p>
    </div>
  );
}
