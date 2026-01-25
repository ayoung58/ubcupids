/**
 * Matching Algorithm V2 - Phase 3: Importance Weighting
 *
 * Applies user importance ratings to raw similarity scores.
 * Importance acts as a multiplier on the similarity.
 *
 * Formula: weighted_similarity = raw_similarity × (importance / 5)
 *
 * Where:
 * - raw_similarity ∈ [0, 1]
 * - importance ∈ [1, 5] (user rating)
 * - weighted_similarity ∈ [0, 1]
 *
 * Example:
 * - Raw similarity: 0.8
 * - User A importance: 5 (very important)
 * - User B importance: 2 (not very important)
 * - A's weighted: 0.8 × (5/5) = 0.8
 * - B's weighted: 0.8 × (2/5) = 0.32
 * - Average: (0.8 + 0.32) / 2 = 0.56
 *
 * @see docs/Matching/MATCHING_ALGORITHM_V2.md Phase 3
 */

/**
 * Applies importance weighting to a raw similarity score
 *
 * @param rawSimilarity - Base similarity score [0, 1]
 * @param userAImportance - User A's importance rating [1, 5]
 * @param userBImportance - User B's importance rating [1, 5]
 * @returns Object with individual weighted scores and average
 */
export function applyImportanceWeighting(
  rawSimilarity: number,
  userAImportance: number | undefined,
  userBImportance: number | undefined
): {
  userAWeighted: number;
  userBWeighted: number;
  averageWeighted: number;
} {
  // Use importance weights directly from config (0, 0.5, 1.0, 2.0)
  // Default to SOMEWHAT_IMPORTANT (0.5) if not provided
  const aImportance = userAImportance ?? 0.5;
  const bImportance = userBImportance ?? 0.5;

  // Ensure importance is in valid range [0, 2.0]
  const clampedAImportance = Math.max(0, Math.min(2.0, aImportance));
  const clampedBImportance = Math.max(0, Math.min(2.0, bImportance));

  // Apply importance as direct multiplier (no division)
  const userAWeighted = rawSimilarity * clampedAImportance;
  const userBWeighted = rawSimilarity * clampedBImportance;

  // Return average of both weighted scores
  const averageWeighted = (userAWeighted + userBWeighted) / 2;

  return {
    userAWeighted,
    userBWeighted,
    averageWeighted,
  };
}

/**
 * Applies importance weighting for questions that don't have importance ratings
 * (e.g., dealbreakers, special cases)
 *
 * @param rawSimilarity - Base similarity score [0, 1]
 * @returns The raw similarity unchanged (no importance weighting)
 */
export function applyNoImportanceWeighting(rawSimilarity: number): {
  userAWeighted: number;
  userBWeighted: number;
  averageWeighted: number;
} {
  return {
    userAWeighted: rawSimilarity,
    userBWeighted: rawSimilarity,
    averageWeighted: rawSimilarity,
  };
}
