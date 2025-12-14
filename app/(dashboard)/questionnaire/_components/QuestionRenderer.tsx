"use client";

import {
  Question,
  ResponseValue,
  ImportanceLevel,
} from "@/src/lib/questionnaire-types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImportanceSelector } from "./ImportanceSelector";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";

interface QuestionRendererProps {
  question: Question;
  value: ResponseValue | undefined;
  onChange: (value: ResponseValue) => void;
  importance: ImportanceLevel;
  onImportanceChange: (importance: ImportanceLevel) => void;
  disabled?: boolean;
  validationError?: string; // Error message to display
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  importance,
  onImportanceChange,
  disabled = false,
  validationError,
}: QuestionRendererProps) {
  const [otherText, setOtherText] = useState<string>("");

  // Initialize otherText from value if it's an object with text
  useEffect(() => {
    if (value && typeof value === "object" && "text" in value) {
      setOtherText(value.text);
    } else {
      setOtherText("");
    }
  }, [value]);

  // Reusable CSS classes for consistent styling
  const questionContainerClass = "space-y-3";
  const optionListClass = "space-y-2";
  const optionItemClass = "flex items-center space-x-2";
  const optionLabelClass = "font-normal cursor-pointer flex-1";
  const disabledLabelClass = "text-gray-400 cursor-not-allowed";
  const radioItemClass = "flex-shrink-0";
  const textInputClass = "ml-6";
  const validationErrorClass =
    "flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm";
  const shouldShowImportance = () => {
    // Don't show importance for textarea (open-ended) questions
    if (question.type === "textarea") {
      return false;
    }
    // Don't show importance for basic info questions (section 0)
    if (question.id.startsWith("q0.")) {
      return false;
    }
    return true;
  };

  // Wrapper to include importance selector with each question type
  const wrapWithImportance = (content: React.ReactNode) => (
    <div className="space-y-1">{content}</div>
  );

  // Create question header with importance selector inline (if applicable)
  const questionHeader = shouldShowImportance() ? (
    <div className="flex items-start justify-between gap-3">
      <Label
        id={`${question.id}-label`}
        className="text-base font-medium flex-1"
      >
        {question.text}
        {question.required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </Label>
      <ImportanceSelector
        questionId={question.id}
        value={importance}
        onChange={onImportanceChange}
        disabled={disabled}
      />
    </div>
  ) : (
    <Label id={`${question.id}-label`} className="text-base font-medium">
      {question.text}
      {question.required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </Label>
  );

  // Validation error display
  const validationErrorDisplay = validationError && (
    <div className={validationErrorClass}>
      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <p className="flex-1">{validationError}</p>
    </div>
  );

  switch (question.type) {
    case "single-choice":
      return wrapWithImportance(
        <div
          className="space-y-3"
          role="group"
          aria-labelledby={`${question.id}-label`}
          id={`question-${question.id}`}
        >
          {questionHeader}
          {validationErrorDisplay}
          <RadioGroup
            value={
              typeof value === "object" && value && "value" in value
                ? value.value
                : (value as string) || ""
            }
            onValueChange={(selectedValue) => {
              const selectedOption = question.options?.find(
                (opt) => opt.value === selectedValue
              );
              if (selectedOption?.hasTextInput) {
                onChange({ value: selectedValue, text: otherText });
              } else {
                onChange(selectedValue);
              }
            }}
            disabled={disabled}
            className={optionListClass}
            aria-required={question.required}
          >
            {question.options?.map((option) => (
              <div key={option.value} className="space-y-2">
                <div className={optionItemClass}>
                  <RadioGroupItem
                    value={option.value}
                    id={`${question.id}-${option.value}`}
                    className={radioItemClass}
                  />
                  <Label
                    htmlFor={`${question.id}-${option.value}`}
                    className={optionLabelClass}
                  >
                    {option.label}
                  </Label>
                </div>
                {option.hasTextInput &&
                  ((typeof value === "object" &&
                    value &&
                    "value" in value &&
                    value.value === option.value) ||
                    value === option.value) && (
                    <Input
                      placeholder="Please specify..."
                      className={textInputClass}
                      disabled={disabled}
                      value={otherText}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setOtherText(newText);
                        // Update the response with the new text
                        if (
                          typeof value === "object" &&
                          value &&
                          "value" in value
                        ) {
                          onChange({ value: value.value, text: newText });
                        } else if (value === option.value) {
                          onChange({ value: option.value, text: newText });
                        }
                      }}
                    />
                  )}
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case "multi-choice":
      const multiValue = (value as string[]) || [];
      // Special handling for love languages question (q39) - limit to 3 selections
      const isLoveLanguagesQuestion = question.id === "q39";
      const maxSelections = isLoveLanguagesQuestion ? 3 : Infinity;

      return wrapWithImportance(
        <div
          className={questionContainerClass}
          role="group"
          aria-labelledby={`${question.id}-label`}
          id={`question-${question.id}`}
        >
          {questionHeader}
          {validationErrorDisplay}
          <div className={optionListClass} role="list">
            {question.options?.map((option) => {
              const isChecked = multiValue.includes(option.value);
              const isDisabled =
                disabled || (!isChecked && multiValue.length >= maxSelections);

              return (
                <div key={option.value} className={optionItemClass}>
                  <Checkbox
                    id={`${question.id}-${option.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked && multiValue.length < maxSelections) {
                        onChange([...multiValue, option.value]);
                      } else if (!checked) {
                        onChange(multiValue.filter((v) => v !== option.value));
                      }
                    }}
                    disabled={isDisabled}
                    className={radioItemClass}
                  />
                  <Label
                    htmlFor={`${question.id}-${option.value}`}
                    className={`${optionLabelClass} ${isDisabled && !isChecked ? disabledLabelClass : ""}`}
                  >
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      );

    case "textarea":
      const textareaValue = (value as string) || "";
      return (
        <div className="space-y-2" id={`question-${question.id}`}>
          {questionHeader}
          {validationErrorDisplay}
          <Textarea
            value={textareaValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            maxLength={question.maxLength}
            disabled={disabled}
            className="min-h-[120px] resize-none"
          />
          {question.maxLength && (
            <p className="text-sm text-gray-500 text-right">
              {textareaValue.length} / {question.maxLength}
            </p>
          )}
          {question.minLength && (
            <p className="text-sm text-gray-500">
              Minimum {question.minLength} characters
            </p>
          )}
        </div>
      );

    case "text":
      return wrapWithImportance(
        <div className="space-y-3" id={`question-${question.id}`}>
          {questionHeader}
          {validationErrorDisplay}
          <Input
            id={question.id}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            disabled={disabled}
            maxLength={question.maxLength}
            aria-required={question.required}
            className="min-h-[44px]"
          />
        </div>
      );

    case "ranking":
      // For now, we'll implement a simple multi-select
      // TODO: Implement drag-and-drop ranking in future
      const rankingValue = (value as string[]) || [];
      return wrapWithImportance(
        <div
          className="space-y-3"
          role="group"
          aria-labelledby={`${question.id}-label`}
          id={`question-${question.id}`}
        >
          {questionHeader}
          {validationErrorDisplay}
          <p
            className="text-sm text-gray-600"
            id={`${question.id}-instructions`}
          >
            Select your top 3 in order of importance (click to select)
          </p>
          <div
            className="space-y-2"
            role="list"
            aria-describedby={`${question.id}-instructions`}
          >
            {question.options?.map((option) => {
              const selectedIndex = rankingValue.indexOf(option.value);
              const isSelected = selectedIndex !== -1;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  className={`flex items-center space-x-3 p-3 rounded-md border-2 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 w-full text-left ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    if (disabled) return;

                    if (isSelected) {
                      // Remove from ranking
                      onChange(rankingValue.filter((v) => v !== option.value));
                    } else {
                      // Add to ranking (max 3)
                      if (rankingValue.length < 3) {
                        onChange([...rankingValue, option.value]);
                      }
                    }
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${option.label}${isSelected ? `, ranked ${selectedIndex + 1}` : ""}`}
                >
                  {isSelected && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      {selectedIndex + 1}
                    </div>
                  )}
                  <Label className="font-normal cursor-pointer flex-1">
                    {option.label}
                  </Label>
                </button>
              );
            })}
          </div>
        </div>
      );

    case "scale":
      // Simple numeric input for now
      // TODO: Could use slider component in future
      return wrapWithImportance(
        <div className="space-y-2">
          <Label className="text-base font-medium">
            {question.text}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            type="number"
            value={(value as number) || ""}
            onChange={(e) => onChange(Number(e.target.value))}
            min={question.min}
            max={question.max}
            step={question.step}
            disabled={disabled}
          />
        </div>
      );

    default:
      return (
        <div className="text-red-500">
          Unsupported question type: {question.type}
        </div>
      );
  }
}
