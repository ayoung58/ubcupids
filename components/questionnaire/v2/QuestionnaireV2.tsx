"use client";

import React, { useState, useEffect } from "react";
import { ProgressBar } from "./ProgressBar";
import { FreeResponseSection } from "./FreeResponseSection";
import { QuestionCard } from "./QuestionCard";
import { QuestionMatrix } from "./QuestionMatrix";
import { SingleSelectInput } from "./answer-inputs/SingleSelectInput";
import { MultiSelectInput } from "./answer-inputs/MultiSelectInput";
import { LikertScale } from "./answer-inputs/LikertScale";
import { AgeInput } from "./answer-inputs/AgeInput";
import { ImportanceScale } from "./ImportanceScale";
import { DoesntMatterButton } from "./DoesntMatterButton";
import { PreferenceSelector } from "./preference-inputs/PreferenceSelector";
import { DrugUseQuestion } from "./special-questions/DrugUseQuestion";
import { LoveLanguagesQuestion } from "./special-questions/LoveLanguagesQuestion";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import {
  ALL_QUESTIONS,
  FREE_RESPONSE_QUESTIONS,
} from "@/lib/questionnaire/v2/config";
import {
  ImportanceLevel,
  QuestionType,
  QuestionnaireResponses,
  QuestionResponse,
  PreferenceType,
  QuestionOption,
} from "@/types/questionnaire-v2";
import { cn } from "@/lib/utils";
import { useAutosave } from "@/hooks/useAutosave";

/**
 * Map preferenceFormat from config to PreferenceType enum
 */
function mapPreferenceFormat(format: string): PreferenceType {
  switch (format) {
    case "same":
      return PreferenceType.SAME;
    case "same-or-similar":
      return PreferenceType.SAME_OR_SIMILAR;
    case "similar":
      return PreferenceType.SIMILAR;
    case "directional":
      return PreferenceType.MORE; // Default to MORE for directional
    case "multi-select":
      return PreferenceType.SAME; // Default for multi-select
    case "special":
      return PreferenceType.SAME; // Default for special
    default:
      return PreferenceType.SAME;
  }
}

interface QuestionnaireV2Props {
  initialResponses?: Partial<QuestionnaireResponses>;
}

/**
 * QuestionnaireV2 Component
 *
 * Main questionnaire page for V2.
 * Features:
 * - Q1/Q2 side-by-side special layout
 * - Progressive question rendering (Q3-Q36 + Q9b split)
 * - Section headers (Lifestyle Q1-20, Personality Q21-36)
 * - Free response section (2 mandatory + 3 optional)
 * - Navigation (prev/next buttons)
 * - Progress tracking (38 total views: Q1+Q2, Q3-Q36+Q9b, Free Response)
 * - Autosave (debounced 3 seconds)
 * - Load existing responses on mount
 *
 * Note: Q9 is split into Q9a (substances) and Q9b (frequency) as separate views
 */
export function QuestionnaireV2({
  initialResponses = {},
}: QuestionnaireV2Props) {
  const [currentStep, setCurrentStep] = useState(0); // 0 = Q1+Q2, 1-35 = Q3-Q36 individually, 36 = free response
  const [responses, setResponses] =
    useState<Partial<QuestionnaireResponses>>(initialResponses);
  const [freeResponseValues, setFreeResponseValues] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Total steps: Q1+Q2 together (1), Q3-Q8 (6), Q9a (1), Q9b (1), Q10-Q36 (27), Free Response (1) = 37 steps (0-36)
  // Questions: Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9a, Q9b, Q10-Q36 = 37 questions
  // Step 0 = Q1+Q2, Steps 1-35 = Q3-Q36+Q9a+Q9b (35 questions), Step 36 = Free Response
  const totalSteps = 36;
  const totalQuestions = 39; // Q1+Q2 (2) + Q3-Q8 (6) + Q9a+Q9b (2) + Q10-Q36 (27) + 2 mandatory free response = 39

  // Load existing responses on mount
  useEffect(() => {
    const loadResponses = async () => {
      try {
        const response = await fetch("/api/questionnaire/v2/load");

        if (response.status === 404) {
          // No existing responses, start fresh
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load questionnaire");
        }

        const data = await response.json();

        if (data.success) {
          setResponses(data.responses || {});
          setFreeResponseValues({
            freeResponse1: data.freeResponses?.freeResponse1 || "",
            freeResponse2: data.freeResponses?.freeResponse2 || "",
            freeResponse3: data.freeResponses?.freeResponse3 || "",
            freeResponse4: data.freeResponses?.freeResponse4 || "",
            freeResponse5: data.freeResponses?.freeResponse5 || "",
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading questionnaire:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load questionnaire"
        );
        setIsLoading(false);
      }
    };

    loadResponses();
  }, []);

  // Calculate completed questions with proper completion logic
  // A question is complete when: answer + (preference OR doesn't matter) + (importance OR doesn't matter OR dealbreaker)
  const calculateCompletedCount = (): number => {
    let count = 0;

    // Check each question for completion
    ALL_QUESTIONS.forEach((question) => {
      const questionId = question.id as keyof QuestionnaireResponses;
      const response = responses[questionId];
      if (!response) return;

      // Hard filters (Q1, Q2) only need answer
      if (!question.hasPreference) {
        if (response.answer) count++;
        return;
      }

      // Q4 Age needs valid values and preference
      if (question.type === QuestionType.SPECIAL_AGE) {
        const ageAnswer = response.answer as unknown as {
          userAge: number | null;
          minAge: number | null;
          maxAge: number | null;
        };
        if (!ageAnswer) return;

        // Check if user age is valid (18-40)
        const isUserAgeValid =
          ageAnswer.userAge !== null &&
          ageAnswer.userAge >= 18 &&
          ageAnswer.userAge <= 40;

        // Check if preference is filled and valid (unless doesn't matter)
        const doesntMatter = response.doesntMatter === true;
        if (!doesntMatter) {
          const hasValidPreference =
            ageAnswer.minAge !== null &&
            ageAnswer.maxAge !== null &&
            ageAnswer.minAge >= 18 &&
            ageAnswer.maxAge <= 40 &&
            ageAnswer.minAge < ageAnswer.maxAge;

          if (isUserAgeValid && hasValidPreference) count++;
        } else {
          if (isUserAgeValid) count++;
        }
        return;
      }

      // Regular questions need full completion
      // 1. Must have answer
      if (!response.answer) return;

      // Q21 Love Languages - special check for array answer and preference
      if (question.id === "q21") {
        const answerArray = Array.isArray(response.answer)
          ? response.answer
          : [];
        const preferenceArray = Array.isArray(response.preference)
          ? response.preference
          : [];
        const doesntMatter = response.doesntMatter === true;

        // Need exactly 2 on left (answer)
        if (answerArray.length !== 2) return;

        // Need (exactly 2 on right OR doesn't matter)
        if (!doesntMatter && preferenceArray.length !== 2) return;

        // Need (importance OR doesn't matter OR dealbreaker)
        const hasImportance =
          response.importance !== null && response.importance !== undefined;
        const hasDealer =
          response.isDealer === true || response.dealbreaker === true;
        if (!hasImportance && !doesntMatter && !hasDealer) return;

        count++;
        return;
      }

      // 2. Must have (preference OR doesn't matter)
      const hasPreference =
        response.preference !== null && response.preference !== undefined;
      const doesntMatter = response.doesntMatter === true;
      if (!hasPreference && !doesntMatter) return;

      // 3. Must have (importance OR doesn't matter OR dealbreaker)
      const hasImportance =
        response.importance !== null && response.importance !== undefined;
      const hasDealer =
        response.isDealer === true || response.dealbreaker === true;
      if (!hasImportance && !doesntMatter && !hasDealer) return;

      count++;
    });

    // Add mandatory free response completions
    FREE_RESPONSE_QUESTIONS.filter((q) => q.required).forEach((q) => {
      if (freeResponseValues[q.id]?.trim()) {
        count++;
      }
    });

    return count;
  };

  const completedCount = calculateCompletedCount();

  // Autosave hook
  const {
    saveStatus,
    lastSaved,
    error: saveError,
    manualSave,
  } = useAutosave({
    responses,
    freeResponseValues,
    questionsCompleted: completedCount,
    debounceMs: 3000,
    enabled: !isLoading,
  });

  // Get current question(s)
  const getCurrentContent = () => {
    // Step 0: Q1 + Q2 side-by-side
    if (currentStep === 0) {
      return renderQ1Q2();
    }

    // Step 36: Free Response
    if (currentStep === totalSteps) {
      return (
        <div className="max-w-3xl mx-auto">
          <FreeResponseSection
            questions={FREE_RESPONSE_QUESTIONS}
            values={freeResponseValues}
            onChange={(id, value) =>
              setFreeResponseValues((prev) => ({ ...prev, [id]: value }))
            }
          />
        </div>
      );
    }

    // Steps 1-35: Individual questions Q3-Q36 + Q9b
    const questionIndex = currentStep + 1; // Step 1 = Q3 (index 2), Step 2 = Q4 (index 3), etc.
    const question = ALL_QUESTIONS[questionIndex];

    if (!question) {
      return (
        <div>
          Question not found (step {currentStep}, index {questionIndex})
        </div>
      );
    }

    return renderQuestion(question, questionIndex + 1);
  };

  // Render Q1 + Q2 side-by-side
  const renderQ1Q2 = () => {
    const q1 = ALL_QUESTIONS[0]; // Gender Identity
    const q2 = ALL_QUESTIONS[1]; // Gender Preference

    return (
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Section 1: Lifestyle & Surface Compatibility
          </h2>
          <p className="text-slate-600">
            Let&apos;s start with some basic information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Q1: Gender Identity */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="mb-4">
              <span className="text-sm font-semibold text-pink-600 bg-pink-50 px-2 py-1 rounded">
                Q1
              </span>
              <h3 className="text-lg font-semibold text-slate-900 mt-2">
                {q1.questionText}
              </h3>
            </div>

            <SingleSelectInput
              options={q1.options ?? []}
              value={
                ((responses.q1 as QuestionResponse)?.answer as string) ?? null
              }
              onChange={(value) => updateResponse("q1", { answer: value })}
              includeOther={
                q1.options?.some((o) => o.allowCustomInput) ?? false
              }
            />
          </div>

          {/* Q2: Gender Preference */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="mb-4">
              <span className="text-sm font-semibold text-pink-600 bg-pink-50 px-2 py-1 rounded">
                Q2
              </span>
              <h3 className="text-lg font-semibold text-slate-900 mt-2">
                {q2.questionText}
              </h3>
            </div>

            <MultiSelectInput
              options={q2.options ?? []}
              values={
                Array.isArray((responses.q2 as QuestionResponse)?.answer)
                  ? ((responses.q2 as QuestionResponse).answer as string[])
                  : []
              }
              onChange={(value) => updateResponse("q2", { answer: value })}
            />
          </div>
        </div>

        <p className="text-sm text-slate-500 text-center mt-4">
          These are hard filters - we&apos;ll only match you with people who
          meet these criteria
        </p>
      </div>
    );
  };

  // Render a regular question
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderQuestion = (question: any, questionNumber: number) => {
    const questionId = question.id as keyof QuestionnaireResponses;
    const response = responses[questionId];

    // Show section header for Q21 (start of Section 2)
    const showSection2Header = questionNumber === 21;

    return (
      <div className="max-w-6xl mx-auto">
        {showSection2Header && (
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Section 2: Personality & Interaction Style
            </h2>
            <p className="text-slate-600">
              Now let&apos;s explore how you connect with others
            </p>
          </div>
        )}

        <QuestionCard
          questionNumber={questionNumber}
          questionText={question.questionText}
          questionType={question.type}
          showSplitScreen={question.hasPreference}
          leftSide={renderAnswerInput(question, response)}
          rightSide={
            question.hasPreference
              ? renderPreferenceInput(question, response)
              : null
          }
        />
      </div>
    );
  };

  // Render the answer input (left side)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderAnswerInput = (question: any, response: any) => {
    // Special: Age input (Q4) - only show user age on left
    if (question.type === QuestionType.SPECIAL_AGE) {
      return (
        <AgeInput
          value={
            response?.answer ?? { userAge: null, minAge: null, maxAge: null }
          }
          onChange={(value) =>
            updateResponse(question.id, { ...response, answer: value })
          }
          showPreference={false}
        />
      );
    }

    // Special: Drug Use (Q9 - will be removed after split)
    if (question.type === QuestionType.COMPOUND_SUBSTANCES_FREQUENCY) {
      return (
        <DrugUseQuestion
          value={response ?? { substances: [], frequency: "never" }}
          onChange={(value) => updateResponse(question.id, value)}
        />
      );
    }

    // Special: Love Languages (Q21) - now uses multi-select with max 2
    if (question.id === "q21") {
      return (
        <LoveLanguagesQuestion
          value={Array.isArray(response?.answer) ? response.answer : []}
          onChange={(value) =>
            updateResponse(question.id, { ...response, answer: value })
          }
        />
      );
    }

    // Likert scale questions
    if (
      question.type === QuestionType.LIKERT_SAME_SIMILAR ||
      question.type === QuestionType.LIKERT_DIRECTIONAL ||
      question.type === QuestionType.LIKERT_DIFFERENT
    ) {
      return (
        <LikertScale
          value={response?.answer ?? null}
          onChange={(value) =>
            updateResponse(question.id, { ...response, answer: value })
          }
          leftLabel={question.likertConfig?.minLabel ?? ""}
          rightLabel={question.likertConfig?.maxLabel ?? ""}
          centerLabel={question.likertConfig?.midLabel}
        />
      );
    }

    // Multi-select questions
    if (question.type === QuestionType.MULTI_SELECT_WITH_PREFERENCE) {
      return (
        <MultiSelectInput
          options={question.options ?? []}
          values={response?.answer ?? []}
          onChange={(value) =>
            updateResponse(question.id, { ...response, answer: value })
          }
          maxSelections={question.validation?.maxSelections}
          includeOther={
            question.options?.some((o: QuestionOption) => o.allowCustomInput) ??
            false
          }
        />
      );
    }

    // Single-select questions
    return (
      <SingleSelectInput
        options={question.options ?? []}
        value={response?.answer ?? null}
        onChange={(value) =>
          updateResponse(question.id, { ...response, answer: value })
        }
        includeOther={
          question.options?.some((o: QuestionOption) => o.allowCustomInput) ??
          false
        }
      />
    );
  };

  // Render the preference input (right side)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPreferenceInput = (question: any, response: any) => {
    const doesntMatter = response?.doesntMatter ?? false;

    // Q21 Love Languages - special format (select 2 you like to RECEIVE)
    if (question.id === "q21") {
      return (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Left: Which 2 love languages you like to receive (preference) */}
            <div className="flex-[2] w-full">
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Which 2 love languages do you like to{" "}
                <span className="font-semibold text-green-600">receive</span>?
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Select exactly 2 options
              </p>
              <MultiSelectInput
                options={[
                  {
                    value: "words_of_affirmation",
                    label: "Words of affirmation",
                  },
                  { value: "quality_time", label: "Quality time" },
                  { value: "acts_of_service", label: "Acts of service" },
                  { value: "physical_touch", label: "Physical touch" },
                  { value: "receiving_gifts", label: "Receiving gifts" },
                ]}
                values={
                  Array.isArray(response?.preference) ? response.preference : []
                }
                onChange={(value) =>
                  updateResponse(question.id, {
                    ...response,
                    preference: value,
                  })
                }
                maxSelections={2}
                disabled={doesntMatter}
              />
              {!doesntMatter &&
                Array.isArray(response?.preference) &&
                response.preference.length < 2 &&
                response.preference.length > 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    Please select exactly 2 options
                  </p>
                )}
            </div>

            {/* Right: Importance Scale */}
            {!doesntMatter && (
              <div className="flex-1 w-full">
                <ImportanceScale
                  value={response?.importance ?? null}
                  onChange={(value) =>
                    updateResponse(question.id, {
                      ...response,
                      importance: value,
                    })
                  }
                  onDealbreakerToggle={(isDealer) =>
                    updateResponse(question.id, {
                      ...response,
                      isDealer,
                      importance: isDealer
                        ? ImportanceLevel.VERY_IMPORTANT
                        : (response?.importance ??
                          ImportanceLevel.NOT_IMPORTANT),
                    })
                  }
                  isDealer={response?.isDealer ?? false}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Q4 Age - show only age preference on right side (no importance scale)
    if (question.type === QuestionType.SPECIAL_AGE) {
      return (
        <div className="space-y-4">
          <AgeInput
            value={
              response?.answer ?? { userAge: null, minAge: null, maxAge: null }
            }
            onChange={(value) =>
              updateResponse(question.id, { ...response, answer: value })
            }
            showPreference={true}
          />

          {/* Doesn't Matter Button */}
          <DoesntMatterButton
            active={doesntMatter}
            onToggle={(newActive) => {
              if (newActive) {
                // Clear preference when activated
                updateResponse(question.id, {
                  ...response,
                  doesntMatter: true,
                  answer: {
                    ...response?.answer,
                    minAge: null,
                    maxAge: null,
                  },
                });
              } else {
                // Re-enable preference
                updateResponse(question.id, {
                  ...response,
                  doesntMatter: false,
                });
              }
            }}
          />
        </div>
      );
    }

    // Determine if this question uses multi-select preference
    const usesMultiSelectPreference =
      question.preferenceFormat === "multi-select";
    const preferenceOptions = usesMultiSelectPreference
      ? (question.preferenceOptions ?? question.options ?? [])
      : undefined;

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-start">
          {/* Left: Preference Selector */}
          <div className="flex-1 w-full md:border-r md:border-slate-200 md:pr-6">
            <PreferenceSelector
              questionType={question.type}
              preferenceType={
                question.preferenceFormat
                  ? mapPreferenceFormat(question.preferenceFormat)
                  : PreferenceType.SAME
              }
              preferenceValue={response?.preference ?? null}
              onPreferenceChange={(value) =>
                updateResponse(question.id, { ...response, preference: value })
              }
              answerOptions={preferenceOptions}
              preferenceFormat={question.preferenceFormat}
              disabled={doesntMatter}
            />
            {/* Doesn't Matter Button - below preference selector */}
            <DoesntMatterButton
              active={doesntMatter}
              onToggle={(active) =>
                updateResponse(question.id, {
                  ...response,
                  doesntMatter: active,
                  preference: active ? null : (response?.preference ?? null),
                  importance: active
                    ? ImportanceLevel.NOT_IMPORTANT
                    : (response?.importance ?? ImportanceLevel.NOT_IMPORTANT),
                  isDealer: false,
                })
              }
            />
          </div>

          {/* Right: Importance Scale */}
          {!doesntMatter && (
            <div className="flex-1 w-full md:pl-6">
              <ImportanceScale
                value={response?.importance ?? null}
                onChange={(value) =>
                  updateResponse(question.id, {
                    ...response,
                    importance: value,
                  })
                }
                onDealbreakerToggle={(isDealer) =>
                  updateResponse(question.id, {
                    ...response,
                    isDealer,
                    importance: isDealer
                      ? ImportanceLevel.VERY_IMPORTANT
                      : (response?.importance ?? ImportanceLevel.NOT_IMPORTANT),
                  })
                }
                isDealer={response?.isDealer ?? false}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Update response helper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateResponse = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Navigation
  const canGoNext = currentStep < totalSteps;
  const canGoPrev = currentStep > 0;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Calculate current question number for progress bar
  // After Q9 split: Q1-Q8, Q9a, Q9b, Q10-Q36 = 37 questions total
  let currentQuestionNumber = 1;
  if (currentStep === 0) {
    currentQuestionNumber = 1; // Q1+Q2 view
  } else if (currentStep === totalSteps) {
    currentQuestionNumber = 39; // Free response (counts as 2 for progress)
  } else {
    // Steps 1-35 map to question indices 2-36
    // Display as "Question X of 38 views"
    currentQuestionNumber = currentStep + 1;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mb-4"></div>
          <p className="text-slate-600">Loading your questionnaire...</p>
        </div>
      </div>
    );
  }

  // Show load error state
  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-red-600 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Failed to Load Questionnaire
          </h2>
          <p className="text-slate-600 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Progress Bar with Back to Dashboard button and Save Status */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-slate-200">
        <a
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          ← Dashboard
        </a>
        <div className="flex-1">
          <ProgressBar
            currentQuestion={currentQuestionNumber}
            totalQuestions={totalQuestions}
            completedQuestions={completedCount}
          />
        </div>
        <SaveStatusIndicator
          status={saveStatus}
          lastSaved={lastSaved}
          error={saveError}
          onManualSave={manualSave}
        />
      </div>

      {/* Question Matrix */}
      <QuestionMatrix
        currentStep={currentStep}
        responses={responses}
        freeResponseValues={freeResponseValues}
        onNavigate={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Main Content - takes remaining space */}
      <div className="flex-1 py-8 px-4">{getCurrentContent()}</div>

      {/* Navigation Buttons - sticks to bottom */}
      <div className="bg-white border-t border-slate-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-all",
              "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2",
              canGoPrev
                ? "border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-400"
                : "border-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            ← Previous
          </button>

          <div className="text-sm text-slate-500">
            Step {currentStep + 1} of {totalSteps + 1}
          </div>

          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-all",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              canGoNext
                ? "bg-pink-600 text-white hover:bg-pink-700 focus:ring-pink-500"
                : "bg-pink-300 text-white cursor-not-allowed"
            )}
          >
            {currentStep === totalSteps ? "Complete" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
