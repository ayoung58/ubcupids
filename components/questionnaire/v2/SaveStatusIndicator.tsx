import React from "react";
import { SaveStatus } from "@/hooks/useAutosave";
import { CheckCircle2, AlertCircle, Loader2, Save } from "lucide-react";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSaved: Date | null;
  error: string | null;
  onManualSave?: () => void;
}

/**
 * SaveStatusIndicator Component
 *
 * Displays the current save status with appropriate icon and message.
 * Shows last saved time when available.
 */
export function SaveStatusIndicator({
  status,
  lastSaved,
  error,
  onManualSave,
}: SaveStatusIndicatorProps) {
  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 10) return "just now";
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="flex flex-col items-center gap-1 text-sm"
      data-tutorial="save-indicator"
    >
      {/* Status Icon and Text for non-idle */}
      {status === "saving" && (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <span className="text-blue-600">Saving...</span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-600">{error || "Failed to save"}</span>
          {onManualSave && (
            <button
              onClick={onManualSave}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Manual Save Button */}
      {onManualSave && status !== "saving" && (
        <button
          onClick={onManualSave}
          className="text-xs px-2 py-1 rounded border-2 border-slate-300 hover:bg-slate-50 transition-colors"
        >
          Save Now
        </button>
      )}

      {/* Status text below the button */}
      {status === "saved" && (
        <span className="text-green-600">
          Saved{lastSaved ? ` (${formatLastSaved(lastSaved)})` : ""}
        </span>
      )}

      {status === "idle" && lastSaved && (
        <span className="text-slate-600">
          Last saved {formatLastSaved(lastSaved)}
        </span>
      )}

      {status === "idle" && !lastSaved && (
        <span className="text-slate-500">Not saved</span>
      )}
    </div>
  );
}
