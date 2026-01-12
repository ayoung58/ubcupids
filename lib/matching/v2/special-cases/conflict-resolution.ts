/**
 * Matching Algorithm V2.2 - Special Case: Q25 Conflict Resolution
 *
 * Conflict resolution styles have varying compatibility levels.
 * Uses a compatibility matrix to determine how well two styles work together.
 *
 * Preference types:
 * - "same": User wants partner with exact same style
 * - "compatible": User wants partner with compatible style (uses matrix)
 *
 * @see Matching Algorithm V2.2 Special Cases
 */

import { CONFLICT_COMPATIBILITY_MATRIX, MatchingConfig } from "../config";

/**
 * Conflict resolution styles
 */
export type ConflictResolutionStyle =
  | "direct" // Address issues head-on immediately
  | "space" // Need time alone before discussing
  | "humor" // Use lightheartedness to ease tension
  | "compromise"; // Meet in the middle on decisions

/**
 * Preference for partner's conflict style
 */
export type ConflictResolutionPreference = "same" | "compatible";

/**
 * Q25 response structure
 */
export interface ConflictResolutionResponse {
  answer: ConflictResolutionStyle;
  preference: ConflictResolutionPreference;
}

/**
 * Result of conflict resolution compatibility calculation
 */
export interface ConflictResolutionCompatibilityResult {
  baseCompatibility: number; // Raw compatibility from matrix [0, 1]
  userAPreferenceMet: boolean; // Whether A's preference is satisfied
  userBPreferenceMet: boolean; // Whether B's preference is satisfied
  finalScore: number; // Final compatibility score [0, 1]
  bothWantSame: boolean; // Diagnostic: both users want "same" style
}

/**
 * Calculates conflict resolution compatibility between two users
 *
 * Logic:
 * 1. Get base compatibility from matrix (e.g., direct+space = 0.3)
 * 2. Check if each user's preference is met:
 *    - "same" preference: requires exact match (answer === partner's answer)
 *    - "compatible" preference: requires matrix value ≥ threshold (default 0.5)
 * 3. Final score considers both base compatibility and preference satisfaction
 *
 * Formula:
 * - If both preferences met: finalScore = baseCompatibility
 * - If one preference met: finalScore = baseCompatibility × 0.7
 * - If neither preference met: finalScore = baseCompatibility × 0.4
 *
 * Example:
 * User A: direct style, "compatible" preference
 * User B: compromise style, "compatible" preference
 * Matrix: direct+compromise = 0.8
 * Both preferences met (0.8 ≥ 0.5) → finalScore = 0.8
 *
 * @param userAResponse - User A's conflict resolution response
 * @param userBResponse - User B's conflict resolution response
 * @param config - Matching configuration with compatibility threshold
 * @returns Compatibility score and diagnostics
 */
export function calculateConflictResolutionCompatibility(
  userAResponse: ConflictResolutionResponse,
  userBResponse: ConflictResolutionResponse,
  config: MatchingConfig
): ConflictResolutionCompatibilityResult {
  const aStyle = userAResponse.answer;
  const bStyle = userBResponse.answer;
  const aPreference = userAResponse.preference;
  const bPreference = userBResponse.preference;

  // Get base compatibility from matrix
  const baseCompatibility = getMatrixCompatibility(aStyle, bStyle);

  // Check if User A's preference is met
  let userAPreferenceMet: boolean;
  if (aPreference === "same") {
    userAPreferenceMet = aStyle === bStyle;
  } else {
    // "compatible" preference
    userAPreferenceMet =
      baseCompatibility >= config.CONFLICT_COMPATIBILITY_THRESHOLD;
  }

  // Check if User B's preference is met
  let userBPreferenceMet: boolean;
  if (bPreference === "same") {
    userBPreferenceMet = aStyle === bStyle;
  } else {
    // "compatible" preference
    userBPreferenceMet =
      baseCompatibility >= config.CONFLICT_COMPATIBILITY_THRESHOLD;
  }

  // Calculate final score based on preference satisfaction
  let finalScore: number;
  if (userAPreferenceMet && userBPreferenceMet) {
    // Both preferences met: full compatibility
    finalScore = baseCompatibility;
  } else if (userAPreferenceMet || userBPreferenceMet) {
    // One preference met: moderate penalty
    finalScore = baseCompatibility * 0.7;
  } else {
    // Neither preference met: significant penalty
    finalScore = baseCompatibility * 0.4;
  }

  const bothWantSame = aPreference === "same" && bPreference === "same";

  return {
    baseCompatibility,
    userAPreferenceMet,
    userBPreferenceMet,
    finalScore,
    bothWantSame,
  };
}

/**
 * Retrieves compatibility score from the matrix
 *
 * @param styleA - First user's conflict resolution style
 * @param styleB - Second user's conflict resolution style
 * @returns Compatibility score [0, 1]
 */
function getMatrixCompatibility(
  styleA: ConflictResolutionStyle,
  styleB: ConflictResolutionStyle
): number {
  return CONFLICT_COMPATIBILITY_MATRIX[styleA][styleB];
}
