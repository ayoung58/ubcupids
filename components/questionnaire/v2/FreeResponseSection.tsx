"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FreeResponseConfig } from "@/types/questionnaire-v2";

interface FreeResponseSectionProps {
  questions: FreeResponseConfig[];
  values: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
}

/**
 * FreeResponseSection Component
 *
 * Section for free response text questions at the end of the questionnaire.
 * - 2 mandatory questions at top
 * - 3 optional questions below (clearly labeled)
 * - Character counter for each (max from config, typically 300)
 */
export function FreeResponseSection({
  questions,
  values,
  onChange,
}: FreeResponseSectionProps) {
  const mandatoryQuestions = questions.filter((q) => q.required);
  const optionalQuestions = questions.filter((q) => !q.required);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Free Response Questions
        </h2>
        <p className="text-slate-600">
          Tell us more about yourself in your own words
        </p>
      </div>

      {/* Mandatory Questions */}
      {mandatoryQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
              Required
            </span>
          </div>

          {mandatoryQuestions.map((question) => (
            <div key={question.id} className="space-y-3">
              <label
                htmlFor={question.id}
                className="block text-base font-semibold text-slate-900"
              >
                {question.questionText}
                <span className="text-red-600 ml-1">*</span>
              </label>

              <textarea
                id={question.id}
                value={values[question.id] || ""}
                onChange={(e) => onChange(question.id, e.target.value)}
                placeholder={question.placeholder}
                maxLength={question.maxLength}
                rows={4}
                className={cn(
                  "w-full px-4 py-3 border rounded-md text-sm resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent",
                  "placeholder:text-slate-400",
                  values[question.id]?.length === question.maxLength
                    ? "border-amber-400"
                    : "border-slate-300"
                )}
              />

              {/* Character Counter */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {question.helpText || question.placeholder}
                </span>
                <span
                  className={cn(
                    "font-medium",
                    values[question.id]?.length === question.maxLength
                      ? "text-amber-600"
                      : "text-slate-500"
                  )}
                >
                  {values[question.id]?.length || 0} / {question.maxLength}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Optional Questions */}
      {optionalQuestions.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
              Optional
            </span>
            <span className="text-xs text-slate-500">
              These won&apos;t affect your match score but can help your cupid
            </span>
          </div>

          {optionalQuestions.map((question) => (
            <div key={question.id} className="space-y-3">
              <label
                htmlFor={question.id}
                className="block text-base font-medium text-slate-700"
              >
                {question.questionText}
              </label>

              <textarea
                id={question.id}
                value={values[question.id] || ""}
                onChange={(e) => onChange(question.id, e.target.value)}
                placeholder={question.placeholder}
                maxLength={question.maxLength}
                rows={4}
                className={cn(
                  "w-full px-4 py-3 border rounded-md text-sm resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent",
                  "placeholder:text-slate-400",
                  values[question.id]?.length === question.maxLength
                    ? "border-amber-400"
                    : "border-slate-300"
                )}
              />

              {/* Character Counter */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {question.helpText || question.placeholder}
                </span>
                <span
                  className={cn(
                    "font-medium",
                    values[question.id]?.length === question.maxLength
                      ? "text-amber-600"
                      : "text-slate-500"
                  )}
                >
                  {values[question.id]?.length || 0} / {question.maxLength}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
