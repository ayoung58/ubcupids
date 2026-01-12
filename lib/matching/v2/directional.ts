/**
 * Matching Algorithm V2 - Phase 4: Directional Scoring
 *
 * Applies α/β multipliers for directional preferences (Q10: Exercise).
 *
 * Directional preferences: "more", "less", "similar", "same"
 * - "more": User prefers partner with higher value
 * - "less": User prefers partner with lower value
 * - "similar": User prefers partner with close value (±1 on scale)
 * - "same": User prefers partner with exact same value
 *
 * Alignment logic:
 * - If preference aligns with reality → apply α (boost, default 1.0)
 * - If preference conflicts with reality → apply β (penalty, default 0.7)
 * - If no preference or neutral → no multiplier (1.0)
 *
 * Example:
 * - User A: answer=2, preference="more"
 * - User B: answer=4
 * - Reality: B has more (4 > 2) ✓ Aligns with A's preference
 * - Multiplier for A: α = 1.0
 *
 * @see docs/Matching/MATCHING_ALGORITHM_V2.md Phase 4
 */

import { MATCHING_CONFIG, type MatchingConfig } from "./config";

/**
 * Applies directional multiplier to weighted similarity
 *
 * @param weightedSimilarity - Similarity after importance weighting
 * @param userAAnswer - User A's numeric answer
 * @param userBAnswer - User B's numeric answer
 * @param userAPreference - User A's directional preference
 * @param userBPreference - User B's directional preference
 * @param config - Config overrides for α and β
 * @returns Object with individual multipliers and final scores
 */
export function applyDirectionalScoring(
  weightedSimilarity: number,
  userAAnswer: number,
  userBAnswer: number,
  userAPreference: "more" | "less" | "similar" | "same" | undefined,
  userBPreference: "more" | "less" | "similar" | "same" | undefined,
  config: MatchingConfig = MATCHING_CONFIG
): {
  userAMultiplier: number;
  userBMultiplier: number;
  userAFinal: number;
  userBFinal: number;
  averageFinal: number;
} {
  const alpha = config.ALPHA;
  const beta = config.BETA;

  // Calculate multipliers for each user
  const userAMultiplier = calculateDirectionalMultiplier(
    userAAnswer,
    userBAnswer,
    userAPreference,
    alpha,
    beta
  );

  const userBMultiplier = calculateDirectionalMultiplier(
    userBAnswer,
    userAAnswer,
    userBPreference,
    alpha,
    beta
  );

  // Apply multipliers
  const userAFinal = weightedSimilarity * userAMultiplier;
  const userBFinal = weightedSimilarity * userBMultiplier;
  const averageFinal = (userAFinal + userBFinal) / 2;

  return {
    userAMultiplier,
    userBMultiplier,
    userAFinal,
    userBFinal,
    averageFinal,
  };
}

/**
 * Calculates directional multiplier for one user
 *
 * @param userAnswer - User's numeric answer
 * @param partnerAnswer - Partner's numeric answer
 * @param preference - User's directional preference
 * @param alpha - Boost multiplier for alignment
 * @param beta - Penalty multiplier for conflict
 * @returns Multiplier to apply [0.5, 1.2]
 */
function calculateDirectionalMultiplier(
  userAnswer: number,
  partnerAnswer: number,
  preference: "more" | "less" | "similar" | "same" | undefined,
  alpha: number,
  beta: number
): number {
  // No preference → neutral multiplier
  if (!preference) return 1.0;

  const difference = partnerAnswer - userAnswer;
  const absDifference = Math.abs(difference);

  switch (preference) {
    case "more":
      // Partner should have higher value
      if (difference > 0) return alpha; // Aligned
      if (difference === 0) return 1.0; // Neutral (same is okay)
      return beta; // Conflict (partner has less)

    case "less":
      // Partner should have lower value
      if (difference < 0) return alpha; // Aligned
      if (difference === 0) return 1.0; // Neutral (same is okay)
      return beta; // Conflict (partner has more)

    case "similar":
      // Partner should be close (±1 on scale)
      if (absDifference <= 1) return alpha; // Aligned
      if (absDifference === 2) return 1.0; // Neutral
      return beta; // Conflict (too far apart)

    case "same":
      // Partner should have exact same value
      if (difference === 0) return alpha; // Aligned
      if (absDifference === 1) return 1.0; // Neutral (close enough)
      return beta; // Conflict (different)

    default:
      return 1.0;
  }
}
