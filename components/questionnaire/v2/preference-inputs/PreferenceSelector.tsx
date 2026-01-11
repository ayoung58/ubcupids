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
  disabled?: boolean;
}

/**
 * PreferenceSelector Component
 *
 * Routes to the correct preference input component based on question type.
 * Handles:
 * - Same/Similar/Different selector
 * - Multi-select preferences
 * - Age range input
 * - Special cases (Q9, Q21, Q25, Q29)
 */
export function PreferenceSelector({
  questionType,
  preferenceType,
  preferenceValue,
  onPreferenceChange,
  answerOptions,
  disabled = false,
}: PreferenceSelectorProps) {
  // Age range (Q4)
  if (
    questionType === QuestionType.CATEGORICAL_NO_PREFERENCE &&
    answerOptions === undefined
  ) {
    type AgeRange = { min: number; max: number };
    const ageRange: AgeRange =
      preferenceValue &&
      typeof preferenceValue === "object" &&
      "min" in preferenceValue
        ? (preferenceValue as AgeRange)
        : { min: 18, max: 40 };

    return (
      <AgeRangeInput
        minAge={ageRange.min}
        maxAge={ageRange.max}
        onMinChange={(min) => onPreferenceChange({ min, max: ageRange.max })}
        onMaxChange={(max) => onPreferenceChange({ min: ageRange.min, max })}
      />
    );
  }

  // Multi-select preference (Q5, Q6, Q8, Q13, Q14, Q15, Q19, Q20, etc.)
  if (
    Array.isArray(preferenceValue) &&
    answerOptions &&
    answerOptions.length > 0
  ) {
    return (
      <MultiSelectPreference
        options={answerOptions}
        values={preferenceValue ?? []}
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
