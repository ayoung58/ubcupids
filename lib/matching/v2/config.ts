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
   * Range: [0, 100], Default: 40
   */
  T_MIN: 40,

  /**
   * Section weights - Relative importance of each section
   * Per V2.2 spec: Lifestyle 65%, Personality 35%
   * Must sum to 1.0
   */
  SECTION_WEIGHTS: {
    LIFESTYLE: 0.65,
    PERSONALITY: 0.35,
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

  /**
   * Importance Weights - Maps importance levels to numeric multipliers
   * Per V2.2 spec: NOT=0, SOMEWHAT=0.5, IMPORTANT=1.0, VERY=2.0
   */
  IMPORTANCE_WEIGHTS: {
    NOT_IMPORTANT: 0,
    SOMEWHAT_IMPORTANT: 0.5,
    IMPORTANT: 1.0,
    VERY_IMPORTANT: 2.0,
  },

  /**
   * Mutuality Alpha - Balance between min and mean in pair score calculation
   * Formula: pair_score = α × min(A→B, B→A) + (1-α) × mean(A→B, B→A)
   * Range: [0, 1], Default: 0.65
   * Higher values prioritize the weakest link (more conservative matching)
   */
  MUTUALITY_ALPHA: 0.65,

  /**
   * Relative Threshold Beta - Prevents "settling" for worse matches
   * Users can only match with someone scoring ≥ β × their_best_score
   * Range: [0, 1], Default: 0.6
   * Higher values mean stricter relative filtering
   */
  RELATIVE_THRESHOLD_BETA: 0.6,

  /**
   * Prefer Not to Answer Similarity - Penalty for uncertain responses
   * Applied when one user chooses "prefer not to answer"
   * Range: [0, 1], Default: 0.3
   * Lower values penalize uncertainty more heavily
   */
  PREFER_NOT_ANSWER_SIMILARITY: 0.3,
};

export type MatchingConfig = typeof MATCHING_CONFIG;

/**
 * Default configuration (alias for MATCHING_CONFIG)
 */
export const DEFAULT_CONFIG = MATCHING_CONFIG;

/**
 * Conflict Resolution Compatibility Matrix
 * Defines how compatible different conflict resolution styles are
 * Values range from 0 (incompatible) to 1 (perfectly compatible)
 *
 * Based on Matching Algorithm V2.2 Type I3 specification.
 *
 * Styles:
 * - compromise: Find middle ground where both people give a little
 * - solution: Take action together to solve the root problem
 * - emotion: Express and process feelings before problem-solving
 * - analysis: Understand what caused the conflict and why
 * - space: Take time to cool down before discussing
 * - direct: Talk through the issue immediately and openly
 */
export const CONFLICT_COMPATIBILITY_MATRIX: Record<
  string,
  Record<string, number>
> = {
  compromise: {
    compromise: 1.0,
    solution: 0.9,
    emotion: 0.6,
    analysis: 0.7,
    space: 0.5,
    direct: 0.6,
  },
  solution: {
    compromise: 0.9,
    solution: 1.0,
    emotion: 0.7,
    analysis: 0.9,
    space: 0.6,
    direct: 0.8,
  },
  emotion: {
    compromise: 0.6,
    solution: 0.7,
    emotion: 1.0,
    analysis: 0.5,
    space: 0.7,
    direct: 0.5,
  },
  analysis: {
    compromise: 0.7,
    solution: 0.9,
    emotion: 0.5,
    analysis: 1.0,
    space: 0.6,
    direct: 0.7,
  },
  space: {
    compromise: 0.5,
    solution: 0.6,
    emotion: 0.7,
    analysis: 0.6,
    space: 1.0,
    direct: 0.3,
  },
  direct: {
    compromise: 0.6,
    solution: 0.8,
    emotion: 0.5,
    analysis: 0.7,
    space: 0.3,
    direct: 1.0,
  },
} as const;
