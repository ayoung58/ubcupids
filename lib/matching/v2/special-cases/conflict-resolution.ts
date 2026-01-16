/**
 * Matching Algorithm V2.2 - Special Case: Q25 Conflict Resolution
 *
 * Conflict resolution styles have varying compatibility levels.
 * Uses a compatibility matrix to determine how well two styles work together.
 *
 * Users can select up to 2 conflict resolution styles (multi-select).
 * Preference types:
 * - "same": User wants partner with exact same style(s)
 * - "compatible": User wants partner with compatible style(s) (uses matrix + overlap)
 *
 * @see Matching Algorithm V2.2 Special Cases - Type I3
 */

import { CONFLICT_COMPATIBILITY_MATRIX, MatchingConfig } from "../config";

/**
 * Conflict resolution styles (matching config.ts CONFLICT_RESOLUTION_OPTIONS)
 */
export type ConflictResolutionStyle =
  | "compromise"
  | "solution"
  | "emotion"
  | "analysis"
  | "space"
  | "direct";

/**
 * Preference for partner's conflict style
 */
export type ConflictResolutionPreference = "same" | "compatible";

/**
 * Q25 response structure (updated for multi-select)
 */
export interface ConflictResolutionResponse {
  answer: ConflictResolutionStyle[]; // Array of 1-2 styles
  preference: ConflictResolutionPreference;
}

/**
 * Result of conflict resolution compatibility calculation
 */
export interface ConflictResolutionCompatibilityResult {
  overlapScore: number; // Direct overlap [0, 1]
  avgCompatibility: number; // Average cross-compatibility from matrix [0, 1]
  finalScore: number; // Final similarity score [0, 1]
  bothWantSame: boolean; // Diagnostic: both users want "same" style
}

/**
 * Calculates conflict resolution compatibility between two users
 *
 * Logic (per Matching Algorithm V2.2 Type I3):
 *
 * If preference = "same":
 *   similarity = 1.0 if match's answer set = user's answer set (exact match)
 *   similarity = 0.0 otherwise
 *
 * If preference = "compatible":
 *   Step 1: Calculate Direct Overlap
 *     overlap_score = |user ∩ match| / max(|user|, |match|)
 *   Step 2: Calculate Cross-Compatibility
 *     compatibility_scores = [MATRIX[u][m] for u in user for m in match]
 *     avg_compatibility = mean(compatibility_scores)
 *   Step 3: Combined Similarity
 *     similarity = 0.6 × overlap_score + 0.4 × avg_compatibility
 *
 * Examples:
 *   User A: [Solution-focused, Direct-address] + "compatible"
 *   User B: [Solution-focused, Space-first]
 *   Overlap: 1/2 = 0.5
 *   Compatibility: [1.0, 0.6, 0.8, 0.6] avg = 0.75
 *   Final: 0.6 × 0.5 + 0.4 × 0.75 = 0.60
 *
 * @param userAResponse - User A's conflict resolution response
 * @param userBResponse - User B's conflict resolution response
 * @param config - Matching configuration (not used in v2.2, kept for compatibility)
 * @returns Compatibility score and diagnostics
 */
export function calculateConflictResolutionCompatibility(
  userAResponse: ConflictResolutionResponse,
  userBResponse: ConflictResolutionResponse,
  config: MatchingConfig
): ConflictResolutionCompatibilityResult {
  const aStyles = userAResponse.answer || [];
  const bStyles = userBResponse.answer || [];
  const aPreference = userAResponse.preference;
  const bPreference = userBResponse.preference;

  // Handle empty arrays
  if (aStyles.length === 0 || bStyles.length === 0) {
    return {
      overlapScore: 0,
      avgCompatibility: 0.5,
      finalScore: 0.5,
      bothWantSame: false,
    };
  }

  // Calculate for User A's perspective (how well B satisfies A)
  let aScore: number;
  if (aPreference === "same") {
    // Exact match required
    const setsEqual =
      aStyles.length === bStyles.length &&
      aStyles.every((style) => bStyles.includes(style));
    aScore = setsEqual ? 1.0 : 0.0;
  } else {
    // "compatible" preference
    aScore = calculateCompatibleScore(aStyles, bStyles);
  }

  // Calculate for User B's perspective (how well A satisfies B)
  let bScore: number;
  if (bPreference === "same") {
    const setsEqual =
      bStyles.length === aStyles.length &&
      bStyles.every((style) => aStyles.includes(style));
    bScore = setsEqual ? 1.0 : 0.0;
  } else {
    // "compatible" preference
    bScore = calculateCompatibleScore(bStyles, aStyles);
  }

  // Return average of both perspectives
  const finalScore = (aScore + bScore) / 2;

  // Calculate diagnostics
  const intersection = aStyles.filter((s) => bStyles.includes(s));
  const overlapScore =
    intersection.length / Math.max(aStyles.length, bStyles.length);

  const compatibilityScores: number[] = [];
  for (const aStyle of aStyles) {
    for (const bStyle of bStyles) {
      compatibilityScores.push(getMatrixCompatibility(aStyle, bStyle));
    }
  }
  const avgCompatibility =
    compatibilityScores.length > 0
      ? compatibilityScores.reduce((sum, val) => sum + val, 0) /
        compatibilityScores.length
      : 0.5;

  const bothWantSame = aPreference === "same" && bPreference === "same";

  return {
    overlapScore,
    avgCompatibility,
    finalScore,
    bothWantSame,
  };
}

/**
 * Calculates "compatible" score for conflict resolution
 *
 * Formula: 0.6 × overlap_score + 0.4 × avg_compatibility
 *
 * @param userStyles - User's selected conflict styles
 * @param matchStyles - Match's selected conflict styles
 * @returns Compatibility score [0, 1]
 */
function calculateCompatibleScore(
  userStyles: ConflictResolutionStyle[],
  matchStyles: ConflictResolutionStyle[]
): number {
  // Step 1: Calculate overlap
  const intersection = userStyles.filter((s) => matchStyles.includes(s));
  const overlapScore =
    intersection.length / Math.max(userStyles.length, matchStyles.length);

  // Step 2: Calculate cross-compatibility from matrix
  const compatibilityScores: number[] = [];
  for (const userStyle of userStyles) {
    for (const matchStyle of matchStyles) {
      compatibilityScores.push(getMatrixCompatibility(userStyle, matchStyle));
    }
  }

  const avgCompatibility =
    compatibilityScores.length > 0
      ? compatibilityScores.reduce((sum, val) => sum + val, 0) /
        compatibilityScores.length
      : 0.5;

  // Step 3: Weighted combination
  return 0.6 * overlapScore + 0.4 * avgCompatibility;
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
