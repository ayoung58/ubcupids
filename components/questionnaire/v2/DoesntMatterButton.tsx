"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DoesntMatterButtonProps {
  active: boolean;
  onToggle: (active: boolean) => void;
}

/**
 * DoesntMatterButton Component
 *
 * Toggle button for "Doesn't matter" preference.
 * When active:
 * - Disables all other preference selections
 * - Disables importance scale
 * - Sets question weight to 0.0
 * - Excludes question from matching calculation
 */
export function DoesntMatterButton({
  active,
  onToggle,
}: DoesntMatterButtonProps) {
  return (
    <div className="pt-4 border-t border-slate-200">
      <button
        type="button"
        onClick={() => onToggle(!active)}
        className={cn(
          "w-full px-4 py-3 rounded-md text-sm font-medium transition-all",
          "border-2 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          active
            ? "bg-slate-600 text-white border-slate-600 shadow-sm"
            : "bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
        )}
      >
        {active ? "✓ This doesn't matter to me" : "This doesn't matter to me"}
      </button>
      {active && (
        <p className="text-xs text-slate-500 mt-2 text-center">
          This question won&apos;t affect your matches
        </p>
      )}
    </div>
  );
}
