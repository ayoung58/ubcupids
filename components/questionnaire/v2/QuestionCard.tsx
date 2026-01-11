"use client";

import React from "react";
import { QuestionType } from "@/types/questionnaire-v2";

interface QuestionCardProps {
  questionNumber: number;
  questionText: string;
  questionType: QuestionType;
  leftSide: React.ReactNode;
  rightSide: React.ReactNode;
  showSplitScreen?: boolean; // Some questions (Q1, Q2) don't have split screen
}

/**
 * QuestionCard Component
 *
 * Container for each question in the V2 questionnaire.
 * Layout:
 * - Desktop: 50/50 split (left: user's answer, right: preferences)
 * - Mobile: Stacked (left on top, right below)
 *
 * Questions without split screen (Q1, Q2) only show left side.
 */
export function QuestionCard({
  questionNumber,
  questionText,
  questionType,
  leftSide,
  rightSide,
  showSplitScreen = true,
}: QuestionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-pink-600 bg-pink-50 px-2 py-1 rounded">
            Q{questionNumber}
          </span>
          <span className="text-xs text-slate-500 uppercase tracking-wide">
            {questionType}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{questionText}</h3>
      </div>

      {/* Main Content */}
      {showSplitScreen ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - User's Answer */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-0.5 w-8 bg-blue-500"></div>
              <span className="text-sm font-medium text-slate-700">
                About You
              </span>
            </div>
            {leftSide}
          </div>

          {/* Right Side - Preferences */}
          <div className="space-y-4 lg:border-l lg:pl-6 pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-0.5 w-8 bg-purple-500"></div>
              <span className="text-sm font-medium text-slate-700">
                Your Preferences
              </span>
            </div>
            {rightSide}
          </div>
        </div>
      ) : (
        // No split screen (Q1, Q2)
        <div className="space-y-4">{leftSide}</div>
      )}
    </div>
  );
}
