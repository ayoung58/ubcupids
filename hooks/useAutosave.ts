/**
 * Autosave hook for Questionnaire V2
 *
 * Automatically saves questionnaire responses after 3 seconds of inactivity.
 * Provides save status feedback and error handling.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { QuestionnaireResponses } from "@/types/questionnaire-v2";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutosaveOptions {
  responses: Partial<QuestionnaireResponses>;
  freeResponseValues: Record<string, string>;
  questionsCompleted: number;
  debounceMs?: number;
  enabled?: boolean;
}

interface AutosaveResult {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  error: string | null;
  manualSave: () => Promise<void>;
}

export function useAutosave({
  responses,
  freeResponseValues,
  questionsCompleted,
  debounceMs = 3000,
  enabled = true,
}: AutosaveOptions): AutosaveResult {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>("");

  // Save function
  const save = useCallback(async () => {
    try {
      setSaveStatus("saving");
      setError(null);

      const response = await fetch("/api/questionnaire/v2/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses,
          freeResponses: {
            freeResponse1: freeResponseValues.freeResponse1 || "",
            freeResponse2: freeResponseValues.freeResponse2 || "",
            freeResponse3: freeResponseValues.freeResponse3 || "",
            freeResponse4: freeResponseValues.freeResponse4 || "",
            freeResponse5: freeResponseValues.freeResponse5 || "",
          },
          questionsCompleted,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save questionnaire");
      }

      setSaveStatus("saved");
      setLastSaved(new Date());

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (err) {
      console.error("Autosave error:", err);
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save");

      // Reset error after 5 seconds
      setTimeout(() => {
        setSaveStatus("idle");
        setError(null);
      }, 5000);
    }
  }, [responses, freeResponseValues, questionsCompleted]);

  // Debounced autosave effect
  useEffect(() => {
    if (!enabled) return;

    // Convert data to string for comparison
    const currentData = JSON.stringify({
      responses,
      freeResponseValues,
      questionsCompleted,
    });

    // Skip if data hasn't changed
    if (currentData === previousDataRef.current) {
      return;
    }

    previousDataRef.current = currentData;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    responses,
    freeResponseValues,
    questionsCompleted,
    debounceMs,
    enabled,
    save,
  ]);

  // Manual save function
  const manualSave = useCallback(async () => {
    // Cancel debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save();
  }, [save]);

  return {
    saveStatus,
    lastSaved,
    error,
    manualSave,
  };
}
