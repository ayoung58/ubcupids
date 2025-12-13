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
import { useState } from "react";

interface QuestionRendererProps {
  question: Question;
  value: ResponseValue | undefined;
  onChange: (value: ResponseValue) => void;
  importance: ImportanceLevel;
  onImportanceChange: (importance: ImportanceLevel) => void;
  disabled?: boolean;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  importance,
  onImportanceChange,
  disabled = false,
}: QuestionRendererProps) {
  const [otherText, setOtherText] = useState<string>("");

  // Wrapper to include importance selector with each question type
  const wrapWithImportance = (content: React.ReactNode) => (
    <div className="space-y-1">
      {content}
      <ImportanceSelector
        questionId={question.id}
        value={importance}
        onChange={onImportanceChange}
        disabled={disabled}
      />
    </div>
  );

  switch (question.type) {
    case "single-choice":
      return wrapWithImportance(
        <div
          className="space-y-3"
          role="group"
          aria-labelledby={`${question.id}-label`}
        >
          <Label id={`${question.id}-label`} className="text-base font-medium">
            {question.text}
            {question.required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
          <RadioGroup
            value={(value as string) || ""}
            onValueChange={onChange}
            disabled={disabled}
            className="space-y-2"
            aria-required={question.required}
          >
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-start space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`${question.id}-${option.value}`}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`${question.id}-${option.value}`}
                    className="font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                  {option.hasTextInput && value === option.value && (
                    <Input
                      placeholder="Please specify..."
                      className="mt-2"
                      disabled={disabled}
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                    />
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case "multi-choice":
      const multiValue = (value as string[]) || [];
      return wrapWithImportance(
        <div
          className="space-y-3"
          role="group"
          aria-labelledby={`${question.id}-label`}
        >
          <Label id={`${question.id}-label`} className="text-base font-medium">
            {question.text}
            {question.required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
          <div className="space-y-2" role="list">
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-start space-x-2">
                <Checkbox
                  id={`${question.id}-${option.value}`}
                  checked={multiValue.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...multiValue, option.value]);
                    } else {
                      onChange(multiValue.filter((v) => v !== option.value));
                    }
                  }}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`${question.id}-${option.value}`}
                  className="font-normal cursor-pointer flex-1"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      );

    case "textarea":
      const textareaValue = (value as string) || "";
      return wrapWithImportance(
        <div className="space-y-2">
          <Label className="text-base font-medium">
            {question.text}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
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
        <div className="space-y-3">
          <Label htmlFor={question.id} className="text-base font-medium">
            {question.text}
            {question.required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
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
        >
          <Label id={`${question.id}-label`} className="text-base font-medium">
            {question.text}
            {question.required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
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
