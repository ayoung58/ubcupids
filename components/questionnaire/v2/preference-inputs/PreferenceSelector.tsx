"use client";

import React from "react";
import {
  QuestionType,
  PreferenceType,
  QuestionPreference,
} from "@/types/questionnaire-v2";
import { SameSimilarDifferent } from "./SameSimilarDifferent";
import { MultiSelectPreference } from "./MultiSelectPreference";
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
  if (
    questionType === QuestionType.SPECIAL_AGE ||
    preferenceFormat === "special"
  ) {
    // Age range is handled within AgeInput, so no preference input needed here
    // Special cases like Q25 will have custom components
    return null;
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
