/**
 * Matching Algorithm V2.2 - Special Case: Q21 Love Languages
 *
 * Love languages have two components:
 * 1. How you show love (what you naturally do)
 * 2. How you prefer to receive love (what makes you feel loved)
 *
 * Compatibility logic:
 * - User A's "receive" preferences should match User B's "show" behaviors
 * - User B's "receive" preferences should match User A's "show" behaviors
 * - Apply weights: Show (60%), Receive (40%)
 *
 * @see Matching Algorithm V2.2 Special Cases
 */

import { MatchingConfig } from "../config";

/**
 * Love language types
 */
export type LoveLanguage =
  | "words-of-affirmation"
  | "quality-time"
  | "physical-touch"
  | "acts-of-service"
  | "receiving-gifts";

/**
 * Q21 response structure
 */
export interface LoveLanguageResponse {
  show: LoveLanguage[]; // Top 2 ways user shows love
  receive: LoveLanguage[]; // Top 2 ways user prefers to receive love
}

/**
 * Result of love language compatibility calculation
 */
export interface LoveLanguageCompatibilityResult {
  showCompatibility: number; // How well A's show matches B's receive [0, 1]
  receiveCompatibility: number; // How well B's show matches A's receive [0, 1]
  weightedScore: number; // Weighted average using show/receive weights [0, 1]
  mutualMatches: number; // Count of mutual matches (0-4)
}

/**
 * Calculates love language compatibility between two users
 *
 * Formula:
 * - Show compatibility = |A.show ∩ B.receive| / 2
 * - Receive compatibility = |B.show ∩ A.receive| / 2
 * - Weighted score = (show_compat × 0.6) + (receive_compat × 0.4)
 *
 * Example:
 * User A: show=[touch, time], receive=[words, touch]
 * User B: show=[touch, words], receive=[time, touch]
 *
 * Show compat: A.show ∩ B.receive = [touch, time] ∩ [time, touch] = 2 matches → 1.0
 * Receive compat: B.show ∩ A.receive = [touch, words] ∩ [words, touch] = 2 matches → 1.0
 * Weighted: (1.0 × 0.6) + (1.0 × 0.4) = 1.0
 *
 * @param userAResponse - User A's love language response
 * @param userBResponse - User B's love language response
 * @param config - Matching configuration with love language weights
 * @returns Compatibility score and diagnostics
 */
export function calculateLoveLanguageCompatibility(
  userAResponse: LoveLanguageResponse,
  userBResponse: LoveLanguageResponse,
  config: MatchingConfig
): LoveLanguageCompatibilityResult {
  // Defensive check for invalid responses
  if (!userAResponse || !userBResponse) {
    return {
      showCompatibility: 0.5,
      receiveCompatibility: 0.5,
      weightedScore: 0.5,
      mutualMatches: 0,
    };
  }

  // Calculate how many of A's "show" languages match B's "receive" preferences
  const aShowMatchesBReceive = countMatches(
    userAResponse.show,
    userBResponse.receive
  );

  // Calculate how many of B's "show" languages match A's "receive" preferences
  const bShowMatchesAReceive = countMatches(
    userBResponse.show,
    userAResponse.receive
  );

  // Normalize to [0, 1] scale (max 2 matches each direction)
  const showCompatibility = aShowMatchesBReceive / 2;
  const receiveCompatibility = bShowMatchesAReceive / 2;

  // Apply weights (default: show 60%, receive 40%)
  const weightedScore =
    showCompatibility * config.LOVE_LANGUAGE_WEIGHTS.SHOW +
    receiveCompatibility * config.LOVE_LANGUAGE_WEIGHTS.RECEIVE;

  // Count total mutual matches for diagnostics
  const mutualMatches = aShowMatchesBReceive + bShowMatchesAReceive;

  return {
    showCompatibility,
    receiveCompatibility,
    weightedScore,
    mutualMatches,
  };
}

/**
 * Counts how many items from array A are present in array B
 *
 * @param arrayA - First array
 * @param arrayB - Second array
 * @returns Count of matching items
 */
function countMatches(arrayA: LoveLanguage[], arrayB: LoveLanguage[]): number {
  // Defensive check for undefined/null arrays
  if (!arrayA || !Array.isArray(arrayA) || !arrayB || !Array.isArray(arrayB)) {
    return 0;
  }
  const setB = new Set(arrayB);
  return arrayA.filter((item) => setB.has(item)).length;
}
