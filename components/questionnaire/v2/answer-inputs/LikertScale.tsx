"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LikertScaleProps {
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  leftLabel: string;
  rightLabel: string;
  centerLabel?: string;
}

/**
 * LikertScale Component
 *
 * 1-5 scale with labeled anchors (typically left = 1, center = 3, right = 5).
 * Used for ordinal questions like Political Leaning, Exercise Level, etc.
 */
export function LikertScale({
  value,
  onChange,
  min = 1,
  max = 5,
  leftLabel,
  rightLabel,
  centerLabel,
}: LikertScaleProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-4">
      {/* Scale Labels */}
      <div className="flex justify-between text-xs text-slate-600 px-1">
        <span className="text-left max-w-[30%]">{leftLabel}</span>
        {centerLabel && <span className="text-center">{centerLabel}</span>}
        <span className="text-right max-w-[30%]">{rightLabel}</span>
      </div>

      {/* Scale Buttons */}
      <div className="flex justify-between gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "flex-1 h-12 rounded-md text-sm font-semibold transition-all",
              "border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              value === option
                ? "bg-blue-500 text-white border-blue-500 scale-105 shadow-md"
                : "bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Current Selection Display */}
      {value !== null && (
        <p className="text-sm text-slate-600 text-center">
          Selected: <span className="font-semibold">{value}</span>
        </p>
      )}
    </div>
  );
}
