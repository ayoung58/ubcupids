/**
 * Matching Algorithm V2 - Configuration
 *
 * Tunable parameters for the matching algorithm.
 * These values control how strictly matches are scored and filtered.
 *
 * @see docs/Matching/MATCHING_ALGORITHM_V2.md for parameter definitions
 */

export const MATCHING_CONFIG = {
  /**
   * α (alpha) - Directional preference multiplier
   * Applied when user's directional preference aligns with reality
   * Range: [0.8, 1.2], Default: 1.0
   */
  ALPHA: 1.0,

  /**
   * β (beta) - Directional preference penalty
   * Applied when user's directional preference conflicts with reality
   * Range: [0.5, 0.8], Default: 0.7
   */
  BETA: 0.7,

  /**
   * T_MIN - Minimum pair score threshold for eligibility
   * Pairs below this score are not considered for matching
   * Range: [0, 100], Default: 50
   */
  T_MIN: 50,

  /**
   * Section weights - Relative importance of each section
   * Must sum to 1.0
   */
  SECTION_WEIGHTS: {
    LIFESTYLE: 0.5,
    PERSONALITY: 0.5,
  },

  /**
   * Maximum batch size for matching runs
   * Prevents performance issues with large user sets
   */
  MAX_BATCH_SIZE: 500,

  /**
   * Q21 Love Languages - Weight distribution
   * Weights for showing vs receiving love languages
   */
  LOVE_LANGUAGE_WEIGHTS: {
    SHOW: 0.6, // Weight for "how you show love"
    RECEIVE: 0.4, // Weight for "how you prefer to receive love"
  },

  /**
   * Q25 Conflict Resolution - Compatibility matrix threshold
   * Minimum compatibility score for "compatible" preferences
   * Range: [0, 1], Default: 0.5
   */
  CONFLICT_COMPATIBILITY_THRESHOLD: 0.5,

  /**
   * Q29 Sleep Schedule - Flexible option bonus
   * Bonus similarity for users who selected "flexible/adaptable"
   * Range: [0, 1], Default: 0.2 (20% bonus)
   */
  SLEEP_FLEXIBILITY_BONUS: 0.2,
};

export type MatchingConfig = typeof MATCHING_CONFIG;

/**
 * Conflict Resolution Compatibility Matrix
 * Defines how compatible different conflict resolution styles are
 * Values range from 0 (incompatible) to 1 (perfectly compatible)
 *
 * Styles:
 * - direct: Address issues head-on immediately
 * - space: Need time alone before discussing
 * - humor: Use lightheartedness to ease tension
 * - compromise: Meet in the middle on decisions
 */
export const CONFLICT_COMPATIBILITY_MATRIX: Record<
  string,
  Record<string, number>
> = {
  direct: {
    direct: 1.0, // Perfect match
    space: 0.3, // Low compatibility (conflicting needs)
    humor: 0.7, // Moderate-high (can work together)
    compromise: 0.8, // High (both solution-oriented)
  },
  space: {
    direct: 0.3,
    space: 1.0,
    humor: 0.6, // Moderate (both avoid confrontation)
    compromise: 0.5, // Moderate (different approaches)
  },
  humor: {
    direct: 0.7,
    space: 0.6,
    humor: 1.0,
    compromise: 0.8,
  },
  compromise: {
    direct: 0.8,
    space: 0.5,
    humor: 0.8,
    compromise: 1.0,
  },
} as const;
