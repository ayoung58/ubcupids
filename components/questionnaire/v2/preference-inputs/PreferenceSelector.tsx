"use client";

import React from "react";
import {
  QuestionType,
  PreferenceType,
  QuestionPreference,
} from "@/types/questionnaire-v2";
import { SameSimilarDifferent } from "./SameSimilarDifferent";
import { MultiSelectPreference } from "./MultiSelectPreference";
import { DirectionalPreference } from "./DirectionalPreference";
import { ConflictResolutionPreference } from "./ConflictResolutionPreference";
import { AgeRangeInput } from "../answer-inputs/AgeRangeInput";

interface Option {
  value: string;
  label: string;
}

interface PreferenceSelectorProps {
  questionType: QuestionType;
  preferenceType: PreferenceType;
  preferenceValue: QuestionPreference;
  onPreferenceChange: (value: QuestionPreference) => void;
  answerOptions?: Option[]; // For multi-select preference (mirror left side options)
  preferenceFormat?: string; // The raw preference format from config
  disabled?: boolean;
}

/**
 * PreferenceSelector Component
 *
 * Routes to the correct preference input component based on question configuration.
 * Uses preferenceFormat from config to determine which input to show.
 */
export function PreferenceSelector({
  questionType,
  preferenceType,
  preferenceValue,
  onPreferenceChange,
  answerOptions,
  preferenceFormat,
  disabled = false,
}: PreferenceSelectorProps) {
  // Q4 Age - handled by AgeInput component (includes preference range inputs)
  if (questionType === QuestionType.SPECIAL_AGE) {
    // Age range is handled within AgeInput, so no preference input needed here
    return null;
  }

  // Q25 Conflict Resolution - special "same/compatible" preference
  if (
    questionType === QuestionType.SPECIAL_CONFLICT_RESOLUTION ||
    preferenceFormat === "special"
  ) {
    const stringValue =
      typeof preferenceValue === "string"
        ? (preferenceValue as "same" | "compatible")
        : null;

    return (
      <ConflictResolutionPreference
        value={stringValue}
        onChange={onPreferenceChange}
        disabled={disabled}
      />
    );
  }

  // Directional preference (Q10 Exercise - more/less/similar/same)
  if (
    questionType === QuestionType.LIKERT_DIRECTIONAL ||
    preferenceFormat === "directional"
  ) {
    const stringValue =
      typeof preferenceValue === "string"
        ? (preferenceValue as "more" | "less" | "similar" | "same")
        : null;

    return (
      <DirectionalPreference
        value={stringValue}
        onChange={onPreferenceChange}
        disabled={disabled}
      />
    );
  }

  // Multi-select preference (Q3, Q5, Q8, Q9a, Q13, Q14, Q15, Q19, Q20, Q21)
  if (preferenceFormat === "multi-select" && answerOptions) {
    return (
      <MultiSelectPreference
        options={answerOptions}
        values={Array.isArray(preferenceValue) ? preferenceValue : []}
        onChange={onPreferenceChange}
        disabled={disabled}
      />
    );
  }

  // Same/Similar/Different selector (most Likert and ordinal questions)
  if (
    preferenceType === PreferenceType.SIMILAR ||
    preferenceType === PreferenceType.SAME ||
    preferenceType === PreferenceType.DIFFERENT ||
    preferenceType === PreferenceType.SAME_OR_SIMILAR
  ) {
    let allowedOptions: ("same" | "similar" | "different")[] = [
      "same",
      "similar",
      "different",
    ];

    if (preferenceType === PreferenceType.SAME_OR_SIMILAR) {
      allowedOptions = ["same", "similar"];
    }

    const stringValue =
      typeof preferenceValue === "string" ? preferenceValue : null;

    return (
      <SameSimilarDifferent
        value={stringValue as "same" | "similar" | "different" | null}
        onChange={onPreferenceChange}
        options={allowedOptions}
        disabled={disabled}
      />
    );
  }

  // Fallback: No preference input (hard filter questions)
  return (
    <p className="text-sm text-slate-500 italic">
      No preference configuration for this question type.
    </p>
  );
}
