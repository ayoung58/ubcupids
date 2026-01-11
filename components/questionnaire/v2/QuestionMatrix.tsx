"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ALL_QUESTIONS,
  FREE_RESPONSE_QUESTIONS,
} from "@/lib/questionnaire/v2/config";

interface QuestionStatus {
  id: string;
  number: string;
  completed: boolean;
  hasErrors: boolean;
}

interface QuestionMatrixProps {
  currentStep: number;
  responses: Record<string, unknown>;
  freeResponseValues: Record<string, string>;
  onNavigate: (step: number) => void;
}

/**
 * QuestionMatrix Component
 *
 * Collapsible navigation matrix showing all questions with completion status.
 * Features:
 * - ~10 buttons per row (responsive: 8 on tablet, 6 on mobile)
 * - Color coding: Green (complete), Hollow (incomplete), Red (has errors)
 * - Tooltips on hover
 * - Jump-to-question functionality
 * - Shows Q1+Q2 as one button, Q9a and Q9b as separate buttons
 *
 * Total buttons: 37 views (Q1+Q2, Q3-Q8, Q9a, Q9b, Q10-Q36, FR)
 */
export function QuestionMatrix({
  currentStep,
  responses,
  freeResponseValues,
  onNavigate,
}: QuestionMatrixProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if a question is completed
  const isQuestionComplete = (questionId: string): boolean => {
    const response = responses[questionId] as
      | Record<string, unknown>
      | undefined;
    if (!response) return false;

    // Must have answer
    if (!response.answer) return false;

    // Hard filters (Q1, Q2) only need answer
    if (questionId === "q1" || questionId === "q2") {
      return true;
    }

    // Q4 Age special case - needs answer and (preference or doesn't matter), no importance required
    if (questionId === "q4") {
      const ageAnswer = response.answer as {
        userAge: number | null;
        minAge: number | null;
        maxAge: number | null;
      };
      if (!ageAnswer) return false;

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

        return isUserAgeValid && hasValidPreference;
      } else {
        return isUserAgeValid;
      }
    }

    // Q21 Love Languages - special check for exactly 2 selections
    if (questionId === "q21") {
      const answerArray = Array.isArray(response.answer) ? response.answer : [];
      const preferenceArray = Array.isArray(response.preference)
        ? response.preference
        : [];
      const doesntMatter = response.doesntMatter === true;

      // Need exactly 2 on left (answer)
      if (answerArray.length !== 2) return false;

      // Need (exactly 2 on right OR doesn't matter)
      if (!doesntMatter && preferenceArray.length !== 2) return false;

      // Need (importance OR doesn't matter OR dealbreaker)
      const hasImportance =
        response.importance !== null && response.importance !== undefined;
      const hasDealer =
        response.isDealer === true || response.dealbreaker === true;
      if (!hasImportance && !doesntMatter && !hasDealer) return false;

      return true;
    }

    // Must have (preference OR doesn't matter)
    const hasPreference =
      response.preference !== null && response.preference !== undefined;
    const doesntMatter = response.doesntMatter === true;
    if (!hasPreference && !doesntMatter) return false;

    // Must have (importance OR doesn't matter OR dealbreaker)
    const hasImportance =
      response.importance !== null && response.importance !== undefined;
    const hasDealer =
      response.isDealer === true || response.dealbreaker === true;
    if (!hasImportance && !doesntMatter && !hasDealer) return false;

    return true;
  };

  // Check if free response is completed
  const isFreeResponseComplete = (): boolean => {
    const mandatory = FREE_RESPONSE_QUESTIONS.filter((q) => q.required);
    return mandatory.every((q) => {
      const value = freeResponseValues[q.id];
      return value && value.trim().length > 0;
    });
  };

  // Build question status array with actual question numbers
  const questionStatuses: QuestionStatus[] = [];

  // Q1+Q2 combined button (step 0)
  const q1Complete = isQuestionComplete("q1");
  const q2Complete = isQuestionComplete("q2");
  questionStatuses.push({
    id: "q1-q2",
    number: "1-2",
    completed: q1Complete && q2Complete,
    hasErrors: false,
  });

  // Q3-Q36 + Q9a, Q9b (steps 1-35)
  // Map: Q3=3, Q4=4, Q5=5, Q6=6, Q7=7, Q8=8, Q9a=9, Q9b=10, Q10=11, ..., Q36=37
  let displayNumber = 3; // Start at Q3
  ALL_QUESTIONS.slice(2).forEach((question) => {
    const isComplete = isQuestionComplete(question.id);

    // Check for validation errors (Q4 age)
    let hasErrors = false;
    if (question.id === "q4") {
      const response = responses[question.id] as any;
      if (response?.answer) {
        const ageAnswer = response.answer as {
          userAge: number | null;
          minAge: number | null;
          maxAge: number | null;
        };
        // Check for age validation errors
        const hasUserAgeError =
          ageAnswer.userAge !== null &&
          (ageAnswer.userAge < 18 || ageAnswer.userAge > 40);
        const hasRangeError =
          ageAnswer.minAge !== null &&
          ageAnswer.maxAge !== null &&
          (ageAnswer.minAge < 18 ||
            ageAnswer.maxAge > 40 ||
            ageAnswer.minAge >= ageAnswer.maxAge);
        hasErrors = hasUserAgeError || hasRangeError;
      }
    }

    questionStatuses.push({
      id: question.id,
      number: displayNumber.toString(),
      completed: isComplete,
      hasErrors,
    });
    displayNumber++;
  });

  // Free Response (step 36)
  questionStatuses.push({
    id: "free-response",
    number: "FR",
    completed: isFreeResponseComplete(),
    hasErrors: false,
  });

  return (
    <div className="bg-slate-50 border-t border-slate-200">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">
          {isExpanded ? "Hide" : "Show"} Question Matrix
        </span>
        <svg
          className={cn(
            "w-5 h-5 text-slate-500 transition-transform",
            isExpanded && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Matrix Grid */}
      {isExpanded && (
        <div className="px-6 pb-4">
          <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-12 lg:grid-cols-12 gap-1">
            {questionStatuses.map((status, index) => {
              const isCurrent = index === currentStep;
              const stepNumber = index;

              return (
                <button
                  key={status.id}
                  onClick={() => onNavigate(stepNumber)}
                  className={cn(
                    "relative h-7 px-1.5 rounded text-[10px] font-semibold transition-all",
                    "focus:outline-none focus:ring-1 focus:ring-pink-400 focus:ring-offset-1",
                    // Current question
                    isCurrent && "ring-2 ring-pink-500 ring-offset-1",
                    // Completed (green)
                    status.completed &&
                      !isCurrent &&
                      "bg-green-500 text-white hover:bg-green-600",
                    // Incomplete (hollow)
                    !status.completed &&
                      !status.hasErrors &&
                      !isCurrent &&
                      "bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50",
                    // Has errors (red)
                    status.hasErrors &&
                      !isCurrent &&
                      "bg-red-500 text-white hover:bg-red-600",
                    // Current question overlay
                    isCurrent && status.completed && "bg-green-500 text-white",
                    isCurrent &&
                      !status.completed &&
                      "bg-white border-2 border-pink-500 text-pink-600"
                  )}
                  title={`${status.id === "q1-q2" ? "Questions 1-2" : status.id === "free-response" ? "Free Response" : `Question ${status.number}`} - ${status.completed ? "Complete" : "Incomplete"}`}
                >
                  {status.number}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Complete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-slate-300 bg-white" />
              <span>Incomplete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-pink-500 bg-white" />
              <span>Current</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
