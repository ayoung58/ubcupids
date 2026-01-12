"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DirectionalPreferenceProps {
  value: "more" | "less" | "similar" | "same" | null;
  onChange: (value: "more" | "less" | "similar" | "same") => void;
  disabled?: boolean;
  labels?: {
    more?: string;
    less?: string;
    similar?: string;
    same?: string;
  };
}

/**
 * DirectionalPreference Component
 *
 * For questions like Exercise (Q10/Q11) where user can specify if they want
 * their match to have MORE, LESS, SIMILAR, or THE SAME level as them.
 *
 * Used for ordinal/Likert questions where directional preferences make sense
 * (e.g., "I want my match to exercise MORE than me")
 */
export function DirectionalPreference({
  value,
  onChange,
  disabled = false,
  labels = {
    less: "Less",
    similar: "Similar",
    more: "More",
    same: "The same",
  },
}: DirectionalPreferenceProps) {
  const options: Array<{
    value: "less" | "similar" | "more" | "same";
    label: string;
  }> = [
    { value: "less", label: labels.less || "Less" },
    { value: "similar", label: labels.similar || "Similar" },
    { value: "more", label: labels.more || "More" },
    { value: "same", label: labels.same || "The same" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500",
              value === option.value
                ? "bg-pink-600 text-white border-pink-600"
                : "bg-white text-slate-700 border-slate-300 hover:border-pink-400 hover:bg-pink-50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
