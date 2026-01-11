"use client";

import {
  Question,
  QuestionResponse,
  ResponseValue,
} from "@/src/lib/questionnaire-types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PreferenceSelector, PREFERENCE_OPTIONS } from "./PreferenceSelector";
import { ImportanceSelectorV2 } from "./ImportanceSelectorV2";
import { DealBreakerToggle } from "./DealBreakerToggle";
import { DoesntMatterButton } from "./DoesntMatterButton";
import { DealBreakerConfirmDialog } from "./DealBreakerConfirmDialog";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";

interface QuestionRendererV2Props {
  question: Question;
  value: QuestionResponse | undefined;
  onChange: (value: QuestionResponse) => void;
  disabled?: boolean;
  validationError?: string;
  questionNumber?: number;
}

/**
 * QuestionRendererV2 Component
 *
 * Renders questions in split-screen format:
 * - Left side: User's own answer
 * - Right side: Preference for match + importance + dealbreaker
 *
 * Special cases:
 * - Q1-Q2, Q4: Hard filters (no preference panel)
 * - Q9: Drug use (compound: substances + frequency)
 * - Q21: Love languages (top 2 show + top 2 receive)
 * - Q25: Conflict resolution (compatibility matrix)
 * - Q29: Sleep schedule ("Flexible" wildcard)
 * - Q37-Q38: Free response (no preference panel)
 */
export function QuestionRendererV2({
  question,
  value,
  onChange,
  disabled = false,
  validationError,
  questionNumber,
}: QuestionRendererV2Props) {
  // State for "other" text input fields
  const [otherText, setOtherText] = useState<string>("");

  // State for dealbreaker confirmation dialog
  const [showDealBreakerConfirm, setShowDealBreakerConfirm] = useState(false);

  // Initialize default values if none exists
  useEffect(() => {
    if (!value && !disabled) {
      // Create default response structure
      onChange({
        ownAnswer: undefined,
        preference: {
          type: "similar",
          doesntMatter: false,
        },
        importance: 3, // Default to "Important"
        dealbreaker: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Hard filter questions (no preference panel)
  const isHardFilter = ["q1", "q2", "q4"].includes(question.id);

  // Free response questions (no preference panel)
  const isFreeResponse = ["q37", "q38"].includes(question.id);

  // Show split screen for all questions except hard filters and free response
  const showSplitScreen = !isHardFilter && !isFreeResponse;

  // Helper to update own answer
  const updateOwnAnswer = (newAnswer: ResponseValue) => {
    onChange({
      ...value,
      ownAnswer: newAnswer,
      preference: value?.preference || { type: "similar", doesntMatter: false },
      importance: value?.importance || 3,
      dealbreaker: value?.dealbreaker || false,
    });
  };

  // Helper to update preference
  const updatePreference = (updates: Partial<QuestionResponse>) => {
    onChange({
      ownAnswer: value?.ownAnswer,
      preference: value?.preference || { type: "similar", doesntMatter: false },
      importance: value?.importance || 3,
      dealbreaker: value?.dealbreaker || false,
      ...updates,
    });
  };

  // Handle dealbreaker toggle with confirmation
  const handleDealBreakerChange = (checked: boolean) => {
    if (checked && !value?.dealbreaker) {
      // Show confirmation dialog for first-time dealbreaker
      setShowDealBreakerConfirm(true);
    } else {
      updatePreference({ dealbreaker: checked });
    }
  };

  const confirmDealbreaker = () => {
    updatePreference({ dealbreaker: true });
    setShowDealBreakerConfirm(false);
  };

  const cancelDealbreaker = () => {
    setShowDealBreakerConfirm(false);
  };

  // Validation error display
  const validationErrorDisplay = validationError && (
    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <p className="flex-1">{validationError}</p>
    </div>
  );

  // Question header
  const questionHeader = (
    <h3 className="text-lg font-semibold text-gray-900">
      {questionNumber !== undefined && (
        <span className="text-gray-500 mr-2">{questionNumber}.</span>
      )}
      {question.text}
      {question.required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </h3>
  );

  // Render own answer input (left side)
  const renderOwnAnswerInput = () => {
    const ownAnswer = value?.ownAnswer;

    switch (question.type) {
      case "single-choice":
        return (
          <RadioGroup
            value={
              typeof ownAnswer === "object" && ownAnswer && "value" in ownAnswer
                ? ownAnswer.value
                : (ownAnswer as string) || ""
            }
            onValueChange={(selectedValue) => {
              const selectedOption = question.options?.find(
                (opt) => opt.value === selectedValue
              );
              if (selectedOption?.hasTextInput) {
                updateOwnAnswer({ value: selectedValue, text: otherText });
              } else {
                updateOwnAnswer(selectedValue);
              }
            }}
            disabled={disabled}
            className="space-y-2"
          >
            {question.options?.map((option) => (
              <div key={option.value} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`${question.id}-own-${option.value}`}
                  />
                  <Label
                    htmlFor={`${question.id}-own-${option.value}`}
                    className="font-normal cursor-pointer flex-1"
                  >
                    {option.label}
                  </Label>
                </div>
                {option.hasTextInput &&
                  ((typeof ownAnswer === "object" &&
                    ownAnswer &&
                    "value" in ownAnswer &&
                    ownAnswer.value === option.value) ||
                    ownAnswer === option.value) && (
                    <Input
                      placeholder="Please specify..."
                      className="ml-6"
                      disabled={disabled}
                      value={otherText}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setOtherText(newText);
                        updateOwnAnswer({ value: option.value, text: newText });
                      }}
                    />
                  )}
              </div>
            ))}
          </RadioGroup>
        );

      case "multi-choice":
        const multiValue = (ownAnswer as string[]) || [];
        const maxSelections = question.maxSelections || Infinity;

        return (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const isChecked = multiValue.includes(option.value);
              const isDisabled =
                disabled || (!isChecked && multiValue.length >= maxSelections);

              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-own-${option.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked && multiValue.length < maxSelections) {
                        updateOwnAnswer([...multiValue, option.value]);
                      } else if (!checked) {
                        updateOwnAnswer(
                          multiValue.filter((v) => v !== option.value)
                        );
                      }
                    }}
                    disabled={isDisabled}
                  />
                  <Label
                    htmlFor={`${question.id}-own-${option.value}`}
                    className={`font-normal cursor-pointer flex-1 ${
                      isDisabled && !isChecked
                        ? "text-gray-400 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {option.label}
                  </Label>
                </div>
              );
            })}
            {maxSelections < Infinity && (
              <p className="text-xs text-gray-500 mt-2">
                Select up to {maxSelections} option
                {maxSelections !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        );

      case "scale":
        return (
          <div className="space-y-2">
            <Input
              type="number"
              value={(ownAnswer as number) || ""}
              onChange={(e) => updateOwnAnswer(Number(e.target.value))}
              min={question.min}
              max={question.max}
              step={question.step}
              disabled={disabled}
              className="w-32"
            />
            {question.options && question.options.length > 0 && (
              <div className="text-sm text-gray-600 space-y-1">
                {question.options.map((opt) => (
                  <div key={opt.value}>
                    <strong>{opt.value}:</strong> {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "textarea":
        const textareaValue = (ownAnswer as string) || "";
        return (
          <div className="space-y-2">
            <Textarea
              value={textareaValue}
              onChange={(e) => updateOwnAnswer(e.target.value)}
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
          </div>
        );

      case "text":
        return (
          <Input
            value={(ownAnswer as string) || ""}
            onChange={(e) => updateOwnAnswer(e.target.value)}
            placeholder={question.placeholder}
            disabled={disabled}
            maxLength={question.maxLength}
            type={question.id === "q4" ? "number" : "text"}
            min={question.id === "q4" ? question.min : undefined}
            max={question.id === "q4" ? question.max : undefined}
          />
        );

      default:
        return <div className="text-red-500">Unsupported question type</div>;
    }
  };

  // Render preference panel (right side)
  const renderPreferencePanel = () => {
    if (!showSplitScreen) return null;

    const doesntMatter = value?.preference?.doesntMatter || false;
    const preferenceType = value?.preference?.type || "similar";
    const importance = value?.importance || 3;
    const dealbreaker = value?.dealbreaker || false;

    // Determine preference options based on question
    let preferenceOptions = PREFERENCE_OPTIONS.SAME_SIMILAR;

    if (
      ["q10", "q22", "q24", "q27", "q30", "q31", "q33", "q34"].includes(
        question.id
      )
    ) {
      // Directional Likert questions
      preferenceOptions = PREFERENCE_OPTIONS.DIRECTIONAL;
    } else if (
      ["q7", "q16", "q17", "q28", "q35", "q36"].includes(question.id)
    ) {
      // Questions with same/similar/different
      preferenceOptions = PREFERENCE_OPTIONS.SAME_SIMILAR_DIFFERENT;
    } else if (question.id === "q25") {
      // Conflict resolution
      preferenceOptions = PREFERENCE_OPTIONS.CONFLICT_RESOLUTION;
    }

    return (
      <div className="bg-blue-50 rounded-lg p-4 space-y-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-blue-900">
            My Preference for My Match
          </h4>
          <DoesntMatterButton
            isActive={doesntMatter}
            onChange={(active) =>
              updatePreference({
                preference: {
                  ...value?.preference,
                  type: preferenceType,
                  doesntMatter: active,
                },
              })
            }
            disabled={disabled}
          />
        </div>

        {!doesntMatter && (
          <>
            {/* Preference Selector */}
            <PreferenceSelector
              questionId={question.id}
              value={preferenceType}
              onChange={(type) =>
                updatePreference({
                  preference: {
                    ...value?.preference,
                    type,
                    doesntMatter: false,
                  },
                })
              }
              disabled={disabled}
              options={preferenceOptions}
            />

            {/* Importance and Dealbreaker */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <ImportanceSelectorV2
                  questionId={question.id}
                  value={importance}
                  onChange={(imp) => updatePreference({ importance: imp })}
                  disabled={disabled}
                />
              </div>
              <DealBreakerToggle
                questionId={question.id}
                checked={dealbreaker}
                onChange={handleDealBreakerChange}
                disabled={disabled}
              />
            </div>
          </>
        )}

        {doesntMatter && (
          <p className="text-sm text-gray-600 italic">
            This preference won&apos;t affect your matches.
          </p>
        )}
      </div>
    );
  };

  // Special case: Q21 Love Languages (split layout within question)
  if (question.id === "q21") {
    // Love languages stores data as { show: string[], receive: string[] }
    const loveLangsData = value?.ownAnswer as
      | { show?: string[]; receive?: string[] }
      | undefined;
    const showLangs = loveLangsData?.show || [];
    const receiveLangs = (value?.preference?.value as string[]) || [];

    return (
      <div className="space-y-4">
        {questionHeader}
        {validationErrorDisplay}
        {question.helpText && (
          <p className="text-sm text-gray-600">{question.helpText}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Top 2 you SHOW */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900">
              Top 2 Love Languages I SHOW
            </h4>
            <div className="space-y-2">
              {question.options?.map((option) => {
                const isChecked = showLangs.includes(option.value);
                const isDisabled =
                  disabled || (!isChecked && showLangs.length >= 2);

                return (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`${question.id}-show-${option.value}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        let newShow: string[];
                        if (checked && showLangs.length < 2) {
                          newShow = [...showLangs, option.value];
                        } else if (!checked) {
                          newShow = showLangs.filter((v) => v !== option.value);
                        } else {
                          return;
                        }
                        updateOwnAnswer({
                          show: newShow,
                          receive: receiveLangs,
                        } as unknown as ResponseValue);
                      }}
                      disabled={isDisabled}
                    />
                    <Label
                      htmlFor={`${question.id}-show-${option.value}`}
                      className={`font-normal cursor-pointer flex-1 ${
                        isDisabled && !isChecked ? "text-gray-400" : ""
                      }`}
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}
              <p className="text-xs text-gray-500 mt-2">Select up to 2</p>
            </div>
          </div>

          {/* Right: Top 2 you RECEIVE */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900">
              Top 2 Love Languages I Like to RECEIVE
            </h4>
            <div className="space-y-2">
              {question.options?.map((option) => {
                const isChecked = receiveLangs.includes(option.value);
                const isDisabled =
                  disabled || (!isChecked && receiveLangs.length >= 2);

                return (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`${question.id}-receive-${option.value}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        let newReceive: string[];
                        if (checked && receiveLangs.length < 2) {
                          newReceive = [...receiveLangs, option.value];
                        } else if (!checked) {
                          newReceive = receiveLangs.filter(
                            (v) => v !== option.value
                          );
                        } else {
                          return;
                        }
                        updatePreference({
                          preference: {
                            type: "similar",
                            value: newReceive,
                            doesntMatter: false,
                          },
                        });
                      }}
                      disabled={isDisabled}
                    />
                    <Label
                      htmlFor={`${question.id}-receive-${option.value}`}
                      className={`font-normal cursor-pointer flex-1 ${
                        isDisabled && !isChecked ? "text-gray-400" : ""
                      }`}
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}
              <p className="text-xs text-gray-500 mt-2">Select up to 2</p>
            </div>
          </div>
        </div>

        {/* Standard preference controls below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div></div>
          <div className="bg-blue-50 rounded-lg p-4 space-y-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-blue-900">
                Importance
              </h4>
              <DoesntMatterButton
                isActive={value?.preference?.doesntMatter || false}
                onChange={(active) =>
                  updatePreference({
                    preference: {
                      ...value?.preference,
                      type: "similar",
                      doesntMatter: active,
                    },
                  })
                }
                disabled={disabled}
              />
            </div>
            {!value?.preference?.doesntMatter && (
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <ImportanceSelectorV2
                    questionId={question.id}
                    value={value?.importance || 3}
                    onChange={(imp) => updatePreference({ importance: imp })}
                    disabled={disabled}
                  />
                </div>
                <DealBreakerToggle
                  questionId={question.id}
                  checked={value?.dealbreaker || false}
                  onChange={handleDealBreakerChange}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>

        {/* Dealbreaker confirm dialog */}
        <DealBreakerConfirmDialog
          isOpen={showDealBreakerConfirm}
          onConfirm={confirmDealbreaker}
          onCancel={cancelDealbreaker}
          questionText={question.text}
        />
      </div>
    );
  }

  // Standard split-screen layout
  if (showSplitScreen) {
    return (
      <div className="space-y-4">
        {questionHeader}
        {validationErrorDisplay}
        {question.helpText && (
          <p className="text-sm text-gray-600">{question.helpText}</p>
        )}

        {/* Split screen layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side: Own answer */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900">My Answer</h4>
            {renderOwnAnswerInput()}
          </div>

          {/* Right side: Preference panel */}
          {renderPreferencePanel()}
        </div>

        {/* Dealbreaker confirm dialog */}
        <DealBreakerConfirmDialog
          isOpen={showDealBreakerConfirm}
          onConfirm={confirmDealbreaker}
          onCancel={cancelDealbreaker}
          questionText={question.text}
        />
      </div>
    );
  }

  // Hard filters and free response (no split screen)
  return (
    <div className="space-y-4">
      {questionHeader}
      {validationErrorDisplay}
      {question.helpText && (
        <p className="text-sm text-gray-600">{question.helpText}</p>
      )}
      {renderOwnAnswerInput()}
    </div>
  );
}
