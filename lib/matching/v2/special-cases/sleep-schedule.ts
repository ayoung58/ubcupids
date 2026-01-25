/**
 * Matching Algorithm V2.2 - Special Case: Q29 Sleep Schedule
 *
 * Sleep schedule compatibility with flexibility bonus:
 * - If either user selected "Flexible/Adaptable" → automatic 1.0 similarity
 * - Otherwise, exact match required for high compatibility
 * - Flexibility provides bonus to avoid penalizing adaptable users
 *
 * @see Matching Algorithm V2.2 Special Cases
 */

import { MatchingConfig } from "../config";

/**
 * Sleep schedule types
 */
export type SleepSchedule =
  | "early-bird" // Early to bed, early to rise
  | "night-owl" // Late to bed, late to rise
  | "flexible" // Adaptable to different schedules
  | "irregular"; // Inconsistent sleep patterns

/**
 * Q29 response structure
 */
export interface SleepScheduleResponse {
  answer: SleepSchedule;
}

/**
 * Result of sleep schedule compatibility calculation
 */
export interface SleepScheduleCompatibilityResult {
  similarity: number; // Base similarity score [0, 1]
  isFlexible: boolean; // Whether either user is flexible
  appliedFlexibilityBonus: boolean; // Whether bonus was applied
  finalScore: number; // Final compatibility score [0, 1]
}

/**
 * Calculates sleep schedule compatibility between two users
 *
 * Logic:
 * 1. If either user is "flexible" → similarity = 1.0 (perfect compatibility)
 * 2. If both have same schedule → similarity = 1.0
 * 3. If schedules differ and neither is flexible → similarity = 0.3 (incompatible)
 *
 * Rationale:
 * - Flexibility is valuable and should be rewarded
 * - Mismatched rigid schedules (early-bird + night-owl) cause daily conflicts
 * - "Irregular" matches well with "flexible" but poorly with rigid schedules
 *
 * @param userAResponse - User A's sleep schedule response
 * @param userBResponse - User B's sleep schedule response
 * @param config - Matching configuration (for potential future bonus adjustments)
 * @returns Compatibility score and diagnostics
 */
export function calculateSleepScheduleCompatibility(
  userAResponse: SleepScheduleResponse,
  userBResponse: SleepScheduleResponse,
  config: MatchingConfig
): SleepScheduleCompatibilityResult {
  // Defensive check for invalid responses
  if (!userAResponse?.answer || !userBResponse?.answer) {
    return {
      similarity: 0.5,
      isFlexible: false,
      appliedFlexibilityBonus: false,
      finalScore: 0.5,
    };
  }

  const aSchedule = userAResponse.answer;
  const bSchedule = userBResponse.answer;

  // Check if either user is flexible
  const aIsFlexible = aSchedule === "flexible";
  const bIsFlexible = bSchedule === "flexible";
  const isFlexible = aIsFlexible || bIsFlexible;

  let similarity: number;
  let appliedFlexibilityBonus = false;

  // Case 1: Either user is flexible → perfect compatibility
  if (isFlexible) {
    similarity = 1.0;
    appliedFlexibilityBonus = true;
  }
  // Case 2: Both have same schedule → perfect compatibility
  else if (aSchedule === bSchedule) {
    similarity = 1.0;
  }
  // Case 3: Different schedules, neither flexible → low compatibility
  else {
    // Special case: irregular + irregular might work together
    if (aSchedule === "irregular" && bSchedule === "irregular") {
      similarity = 0.6; // Moderate compatibility
    }
    // Mismatched rigid schedules
    else {
      similarity = 0.3; // Low compatibility
    }
  }

  return {
    similarity,
    isFlexible,
    appliedFlexibilityBonus,
    finalScore: similarity,
  };
}
