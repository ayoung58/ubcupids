"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuestionnaireUpdateBannerProps {
  /**
   * Whether to show the banner initially
   * This should be controlled by user.needsQuestionnaireUpdate flag
   */
  show?: boolean;
}

/**
 * QuestionnaireUpdateBanner Component
 *
 * Displays a prominent banner at the top of the dashboard to notify users
 * that they need to complete the updated V2 questionnaire.
 *
 * Features:
 * - Dismissible (but reappears on next session until questionnaire is completed)
 * - Prominent pink/red styling to draw attention
 * - Direct link to /questionnaire
 * - Shows only when user.needsQuestionnaireUpdate = true
 *
 * Usage:
 * ```tsx
 * <QuestionnaireUpdateBanner show={user.needsQuestionnaireUpdate} />
 * ```
 */
export function QuestionnaireUpdateBanner({
  show = true,
}: QuestionnaireUpdateBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't render if dismissed or not supposed to show
  if (!show || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-5">
              Action Required: Complete Updated Questionnaire
            </p>
            <p className="text-xs text-pink-100 leading-4 mt-0.5">
              We&apos;ve updated our matching questionnaire with new questions to
              improve match quality. Please retake the questionnaire to continue
              matching.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex-shrink-0">
            <Link
              href="/questionnaire"
              className={cn(
                "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium",
                "bg-white text-pink-600 hover:bg-pink-50",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white",
                "transition-colors shadow-sm"
              )}
            >
              Complete Now
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => setIsDismissed(true)}
            className={cn(
              "flex-shrink-0 p-1 rounded-md",
              "hover:bg-pink-500/20 focus:outline-none focus:ring-2 focus:ring-white",
              "transition-colors"
            )}
            aria-label="Dismiss banner"
          >
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
