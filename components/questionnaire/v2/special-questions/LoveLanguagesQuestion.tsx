"use client";

import React from "react";
import { MultiSelectInput } from "../answer-inputs/MultiSelectInput";

interface LoveLanguagesQuestionProps {
  value: string[];
  onChange: (value: string[]) => void;
}

/**
 * LoveLanguagesQuestion Component (Q21) - LEFT SIDE ONLY
 *
 * User selects which 2 love languages they SHOW.
 * The preference (which 2 they like to RECEIVE) is handled on the right side.
 * Max 2 selections.
 */
export function LoveLanguagesQuestion({
  value,
  onChange,
}: LoveLanguagesQuestionProps) {
  const loveLanguageOptions = [
    { value: "words_of_affirmation", label: "Words of affirmation" },
    { value: "quality_time", label: "Quality time" },
    { value: "acts_of_service", label: "Acts of service" },
    { value: "physical_touch", label: "Physical touch" },
    { value: "receiving_gifts", label: "Receiving gifts" },
  ];

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-2 block">
        Which 2 love languages best describe how you{" "}
        <span className="font-semibold text-blue-600">show</span> affection?
      </label>
      <p className="text-xs text-slate-500 mb-3">Select exactly 2 options</p>
      <MultiSelectInput
        options={loveLanguageOptions}
        values={value}
        onChange={onChange}
        maxSelections={2}
      />
      {value.length < 2 && value.length > 0 && (
        <p className="text-sm text-amber-600 mt-2">
          Please select exactly 2 options
        </p>
      )}
    </div>
  );
}
