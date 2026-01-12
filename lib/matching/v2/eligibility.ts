/**
 * Matching Algorithm V2.2 - Phase 7: Eligibility Thresholding
 *
 * Filters pairs based on absolute and relative thresholds to ensure
 * both users have a reasonably high match quality.
 *
 * Eligibility criteria:
 * 1. Absolute threshold: pair_score ≥ T_MIN (default 50)
 * 2. Relative threshold: score(A→B) ≥ β × best_score(A)
 * 3. Relative threshold: score(B→A) ≥ β × best_score(B)
 *
 * This prevents:
 * - Low-quality matches (absolute threshold)
 * - "Settling" for significantly worse matches (relative threshold)
 *
 * @see Matching Algorithm V2.2 Phase 7
 */

import { MatchingConfig } from "./config";

/**
 * Best scores for a user across all potential matches
 */
export interface UserBestScores {
  userId: string;
  bestScore: number; // Highest pair score this user achieved
  bestMatchId: string; // User ID of best match
}

/**
 * Result of eligibility check
 */
export interface EligibilityResult {
  isEligible: boolean;
  passedAbsoluteThreshold: boolean; // pair_score ≥ T_MIN
  passedUserARelativeThreshold: boolean; // A→B ≥ β × best_A
  passedUserBRelativeThreshold: boolean; // B→A ≥ β × best_B
  absoluteThreshold: number; // T_MIN value used
  relativeThreshold: number; // β value used (default 0.6)
  failureReasons: string[]; // Why pair was rejected (if applicable)
}

/**
 * Checks if a pair meets eligibility thresholds
 *
 * Three conditions must all be met:
 * 1. pair_score ≥ T_MIN (default 50)
 * 2. score(A→B) ≥ β × best_score(A) (default β=0.6)
 * 3. score(B→A) ≥ β × best_score(B) (default β=0.6)
 *
 * Rationale:
 * - Absolute threshold ensures minimum compatibility
 * - Relative threshold prevents users from being matched with someone
 *   significantly worse than their best option (prevents "settling")
 * - β=0.6 means you can't be matched with someone scoring less than
 *   60% of your best match's score
 *
 * Example:
 * User A's best match scores 85 → A can be matched with anyone scoring ≥ 51 (85×0.6)
 * User B's best match scores 70 → B can be matched with anyone scoring ≥ 42 (70×0.6)
 * Pair score = 55, A→B = 55, B→A = 53
 * Result: Eligible (55≥50, 55≥51, 53≥42 ✓)
 *
 * @param pairScore - Combined pair score (0-100)
 * @param userAToB - User A's score for User B (0-100)
 * @param userBToA - User B's score for User A (0-100)
 * @param userABestScore - User A's best score across all matches (0-100)
 * @param userBBestScore - User B's best score across all matches (0-100)
 * @param config - Matching configuration with T_MIN
 * @param beta - Relative threshold multiplier (default 0.6)
 * @returns Eligibility result with diagnostics
 */
export function checkEligibility(
  pairScore: number,
  userAToB: number,
  userBToA: number,
  userABestScore: number,
  userBBestScore: number,
  config: MatchingConfig,
  beta: number = 0.6
): EligibilityResult {
  const failureReasons: string[] = [];

  // Check 1: Absolute threshold
  const passedAbsoluteThreshold = pairScore >= config.T_MIN;
  if (!passedAbsoluteThreshold) {
    failureReasons.push(
      `Pair score ${pairScore.toFixed(1)} below minimum threshold ${config.T_MIN}`
    );
  }

  // Check 2: User A relative threshold
  const userAThreshold = userABestScore * beta;
  const passedUserARelativeThreshold = userAToB >= userAThreshold;
  if (!passedUserARelativeThreshold) {
    failureReasons.push(
      `User A score ${userAToB.toFixed(1)} below relative threshold ${userAThreshold.toFixed(1)} (${beta}× best score ${userABestScore.toFixed(1)})`
    );
  }

  // Check 3: User B relative threshold
  const userBThreshold = userBBestScore * beta;
  const passedUserBRelativeThreshold = userBToA >= userBThreshold;
  if (!passedUserBRelativeThreshold) {
    failureReasons.push(
      `User B score ${userBToA.toFixed(1)} below relative threshold ${userBThreshold.toFixed(1)} (${beta}× best score ${userBBestScore.toFixed(1)})`
    );
  }

  const isEligible =
    passedAbsoluteThreshold &&
    passedUserARelativeThreshold &&
    passedUserBRelativeThreshold;

  return {
    isEligible,
    passedAbsoluteThreshold,
    passedUserARelativeThreshold,
    passedUserBRelativeThreshold,
    absoluteThreshold: config.T_MIN,
    relativeThreshold: beta,
    failureReasons,
  };
}

/**
 * Finds best scores for all users in a batch
 *
 * @param pairScores - Map of "userA_userB" to pair scores
 * @returns Map of user IDs to their best scores
 */
export function findBestScores(
  pairScores: Record<string, { score: number; partnerUserId: string }>
): Map<string, UserBestScores> {
  const bestScores = new Map<string, UserBestScores>();

  for (const [pairKey, { score, partnerUserId }] of Object.entries(
    pairScores
  )) {
    const [userAId, userBId] = pairKey.split("_");

    // Update User A's best score
    const currentBestA = bestScores.get(userAId);
    if (!currentBestA || score > currentBestA.bestScore) {
      bestScores.set(userAId, {
        userId: userAId,
        bestScore: score,
        bestMatchId: userBId,
      });
    }

    // Update User B's best score
    const currentBestB = bestScores.get(userBId);
    if (!currentBestB || score > currentBestB.bestScore) {
      bestScores.set(userBId, {
        userId: userBId,
        bestScore: score,
        bestMatchId: userAId,
      });
    }
  }

  return bestScores;
}
