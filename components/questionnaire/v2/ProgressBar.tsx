"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentQuestion: number; // Current view number (1-37)
  totalQuestions: number; // Total completions for progress (39)
  completedQuestions: number; // How many have been completed
}

/**
 * ProgressBar Component
 *
 * Linear progress bar for V2 questionnaire.
 * Shows:
 * - Current view position
 * - Visual progress bar
 * - Completion percentage based on 39 total completions:
 *   - Q1 (1) + Q2 (1) + Q3-Q8 (6) + Q9a (1) + Q9b (1) + Q10-Q36 (27) + 2 mandatory free response (2) = 39
 *
 * Optional free response questions don't count toward progress.
 */
export function ProgressBar({
  currentQuestion,
  totalQuestions,
  completedQuestions,
}: ProgressBarProps) {
  const percentage = Math.round((completedQuestions / totalQuestions) * 100);

  return (
    <div className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto">
        {/* Progress Percentage (Primary) */}
        <div className="flex items-center justify-center mb-2">
          <span className="text-lg font-bold text-pink-600">
            {percentage}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute top-0 left-0 h-full transition-all duration-300 ease-out",
              "bg-gradient-to-r from-pink-500 to-rose-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Completed Count (Secondary) */}
        <p className="text-xs text-slate-500 mt-2 text-center">
          {completedQuestions} of {totalQuestions} completed
        </p>
      </div>
    </div>
  );
}
