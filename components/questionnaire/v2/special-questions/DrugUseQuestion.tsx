"use client";

import React from "react";
import { MultiSelectInput } from "../answer-inputs/MultiSelectInput";
import { SingleSelectInput } from "../answer-inputs/SingleSelectInput";
import { DrugUseAnswer } from "@/types/questionnaire-v2";

interface DrugUseQuestionProps {
  value: DrugUseAnswer;
  onChange: (value: DrugUseAnswer) => void;
}

/**
 * DrugUseQuestion Component (Q9)
 *
 * Special compound question with:
 * - Substances (multi-select): Cannabis, Cigarettes, Vaping, Other drugs, None
 * - Frequency (single-select): Never, Occasionally, Regularly
 *
 * If "None" is selected, frequency is automatically set to "Never"
 */
export function DrugUseQuestion({ value, onChange }: DrugUseQuestionProps) {
  const substanceOptions = [
    { value: "cannabis", label: "Cannabis" },
    { value: "cigarettes", label: "Cigarettes" },
    { value: "vaping", label: "Vaping" },
    { value: "other_drugs", label: "Other recreational drugs" },
    { value: "none", label: "None" },
  ];

  const frequencyOptions = [
    { value: "never", label: "Never" },
    { value: "occasionally", label: "Occasionally" },
    { value: "regularly", label: "Regularly" },
  ];

  const handleSubstanceChange = (substances: string[]) => {
    // If "none" is selected, clear other substances and set frequency to "never"
    if (substances.includes("none")) {
      onChange({
        substances: ["none"],
        frequency: "never",
      });
    } else {
      // If substances are selected but frequency is "never", update to "occasionally"
      const newFrequency =
        substances.length > 0 && value.frequency === "never"
          ? "occasionally"
          : value.frequency;

      onChange({
        substances,
        frequency: newFrequency,
      });
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    onChange({
      ...value,
      frequency: frequency as "never" | "occasionally" | "regularly",
    });
  };

  const isNoneSelected = value.substances?.includes("none") ?? false;
  const hasSubstancesSelected =
    (value.substances?.length ?? 0) > 0 && !isNoneSelected;

  return (
    <div className="space-y-6">
      {/* Substances */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-3 block">
          Which of the following do you use?
        </label>
        <MultiSelectInput
          options={substanceOptions}
          values={value.substances}
          onChange={handleSubstanceChange}
        />
      </div>

      {/* Frequency (only if substances selected) */}
      {hasSubstancesSelected && (
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            How often do you use these?
          </label>
          <SingleSelectInput
            options={frequencyOptions}
            value={value.frequency}
            onChange={handleFrequencyChange}
          />
        </div>
      )}

      {isNoneSelected && (
        <p className="text-sm text-slate-500 italic">
          Frequency automatically set to &quot;Never&quot;
        </p>
      )}
    </div>
  );
}
