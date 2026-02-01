/**
 * Client-side deadline utilities
 * These functions check if various deadlines have passed
 * Matches the server-side config for consistency
 */

// Deadline dates (must match lib/matching/config.ts)
export const QUESTIONNAIRE_DEADLINE_DATE = new Date(
  "2026-02-01T00:10:00-08:00",
);
export const SIGNUP_DEADLINE_DATE = new Date("2026-02-01T00:00:00-08:00");

/**
 * Check if the questionnaire deadline has passed
 */
export function hasQuestionnaireDeadlinePassed(): boolean {
  return new Date() > QUESTIONNAIRE_DEADLINE_DATE;
}

/**
 * Check if the signup/account linking deadline has passed
 */
export function hasSignupDeadlinePassed(): boolean {
  return new Date() > SIGNUP_DEADLINE_DATE;
}

/**
 * Get formatted deadline message for questionnaire
 */
export function getQuestionnaireDeadlineMessage(): string {
  return "The questionnaire submission deadline has passed (February 1, 2026 at 12:10 AM PST). Submissions are no longer being accepted.";
}

/**
 * Get formatted deadline message for signup/linking
 */
export function getSignupDeadlineMessage(): string {
  return "The deadline for registration and account linking has passed (February 1, 2026 at 12:10 AM PST).";
}
