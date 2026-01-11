"use client";

import React from "react";
import { MultiSelectInput } from "../answer-inputs/MultiSelectInput";
import { LoveLanguagesAnswer } from "@/types/questionnaire-v2";

interface LoveLanguagesQuestionProps {
  value: LoveLanguagesAnswer;
  onChange: (value: LoveLanguagesAnswer) => void;
}

/**
 * LoveLanguagesQuestion Component (Q21)
 *
 * Special two-part question:
 * - Top 2 love languages you SHOW
 * - Top 2 love languages you like to RECEIVE
 *
 * Both require exactly 2 selections.
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

  const handleShowChange = (show: string[]) => {
    onChange({
      ...value,
      show,
    });
  };

  const handleReceiveChange = (receive: string[]) => {
    onChange({
      ...value,
      receive,
    });
  };

  return (
    <div className="space-y-6">
      {/* Show */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Which 2 love languages best describe how you{" "}
          <span className="font-semibold text-blue-600">show</span> affection?
        </label>
        <p className="text-xs text-slate-500 mb-3">Select exactly 2 options</p>
        <MultiSelectInput
          options={loveLanguageOptions}
          values={value.show}
          onChange={handleShowChange}
          maxSelections={2}
        />
      </div>

      {/* Receive */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Which 2 love languages best describe how you like to{" "}
          <span className="font-semibold text-purple-600">receive</span>{" "}
          affection?
        </label>
        <p className="text-xs text-slate-500 mb-3">Select exactly 2 options</p>
        <MultiSelectInput
          options={loveLanguageOptions}
          values={value.receive}
          onChange={handleReceiveChange}
          maxSelections={2}
        />
      </div>

      {/* Validation Feedback */}
      {(value.show.length < 2 || value.receive.length < 2) && (
        <p className="text-sm text-amber-600">
          ⚠️ Please select exactly 2 options for both showing and receiving
        </p>
      )}
    </div>
  );
}
