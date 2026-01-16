/**
 * Questionnaire V2 Constants
 *
 * All tunable parameters and constants for the questionnaire system.
 * These values are used across UI, validation, and matching algorithm.
 */

// ============================================
// IMPORTANCE WEIGHTS
// ============================================

/**
 * Importance levels and their corresponding weights in the matching algorithm
 * These are used in Phase 3 (Importance Weighting) of the matching algorithm
 */
export const IMPORTANCE_WEIGHTS = {
  NOT_IMPORTANT: 0.0,
  SOMEWHAT_IMPORTANT: 0.5,
  IMPORTANT: 1.0,
  VERY_IMPORTANT: 2.0,
  // DEALBREAKER is handled as a hard filter, not a weight
} as const;

/**
 * Importance level labels for UI display
 */
export const IMPORTANCE_LABELS = {
  NOT_IMPORTANT: "Not Important",
  SOMEWHAT_IMPORTANT: "Somewhat Important",
  IMPORTANT: "Important",
  VERY_IMPORTANT: "Very Important",
} as const;

// ============================================
// SECTION WEIGHTS
// ============================================

/**
 * Section weights for the matching algorithm (Phase 5)
 * Section 1: Lifestyle / Surface Compatibility (Q1-Q20)
 * Section 2: Personality / Interaction Style (Q21-Q36)
 */
export const SECTION_WEIGHTS = {
  SECTION_1: 0.65, // Lifestyle - higher weight
  SECTION_2: 0.35, // Personality - lower weight
} as const;

/**
 * Section boundaries (question numbers)
 */
export const SECTION_BOUNDARIES = {
  SECTION_1_START: 1,
  SECTION_1_END: 20,
  SECTION_2_START: 21,
  SECTION_2_END: 36,
} as const;

// ============================================
// VALIDATION LIMITS
// ============================================

/**
 * Age validation limits for Q4
 */
export const AGE_LIMITS = {
  MIN: 18,
  MAX: 100,
} as const;

/**
 * Character limits for free response questions
 */
export const FREE_RESPONSE_LIMITS = {
  MIN: 0, // No minimum for required questions
  MAX: 300, // Maximum characters for all free response questions
} as const;

/**
 * Multi-select limits for specific questions
 */
export const MULTI_SELECT_LIMITS = {
  Q21_LOVE_LANGUAGES: {
    SHOW: 2, // Exactly 2 selections required
    RECEIVE: 2, // Exactly 2 selections required
  },
  Q25_CONFLICT_RESOLUTION: {
    MAX: 2, // Maximum 2 selections
  },
} as const;

// ============================================
// PROGRESS CALCULATION
// ============================================

/**
 * Total questions for progress calculation
 * 36 main questions + 2 mandatory free response = 38 total
 * Optional free response questions (3) do NOT count toward progress
 */
export const PROGRESS_TOTALS = {
  MAIN_QUESTIONS: 36, // Q1-Q36
  MANDATORY_FREE_RESPONSE: 2, // Free response Q1-Q2
  TOTAL_FOR_PROGRESS: 38, // Used for progress bar calculation
  OPTIONAL_FREE_RESPONSE: 3, // Free response Q3-Q5 (not counted)
} as const;

/**
 * Question IDs that are required for submission
 */
export const REQUIRED_QUESTIONS = [
  "q1", // Gender Identity
  "q2", // Gender Preference
  "q3", // Sexual Orientation
  "q4", // Age
] as const;

/**
 * Free response question IDs
 */
export const FREE_RESPONSE_IDS = {
  MANDATORY: ["freeResponse1", "freeResponse2"] as const,
  OPTIONAL: ["freeResponse3", "freeResponse4", "freeResponse5"] as const,
} as const;

// ============================================
// MATCHING ALGORITHM PARAMETERS
// ============================================

/**
 * Tunable parameters for the matching algorithm
 * These can be adjusted post-launch via admin interface
 */
export const MATCHING_PARAMS = {
  // Phase 2: Similarity Calculation
  UNCERTAINTY_SIMILARITY: 0.3, // Penalty for "Prefer not to answer" when other user marks "Very Important"
  LIKERT_EXPONENT: 1.0, // Sensitivity control for Likert scales (default linear)

  // Phase 6: Pair Score Construction
  ALPHA: 0.65, // Weight for minimum score in pair score calculation (penalizes asymmetry)

  // Phase 7: Eligibility Thresholding
  BETA: 0.6, // Relative threshold (score must be >= 60% of best score)
  T_MIN: 0.25, // Absolute floor for pair scores

  // Likert scale range (for normalization)
  LIKERT_MIN: 1,
  LIKERT_MAX: 5,
} as const;

// ============================================
// UI CONSTANTS
// ============================================

/**
 * Autosave settings
 */
export const AUTOSAVE = {
  DEBOUNCE_MS: 3000, // 3 seconds
  SHOW_INDICATOR: true,
} as const;

/**
 * Responsive breakpoints for split-screen layout
 */
export const BREAKPOINTS = {
  MOBILE_MAX: 768, // Stack vertically below this
  TABLET_MAX: 1024,
} as const;

/**
 * Warning messages
 */
export const WARNING_MESSAGES = {
  DEALBREAKER:
    "Dealbreakers should be used sparingly. This will immediately exclude potential matches who don't meet this criteria.",
  AGE_RANGE:
    "Please ensure your age range is between 18 and 40, and minimum is less than maximum.",
  CHARACTER_LIMIT: (current: number, max: number) =>
    `${current}/${max} characters`,
  MAX_SELECTIONS: (max: number) =>
    `You can select up to ${max} option${max > 1 ? "s" : ""}.`,
} as const;

// ============================================
// QUESTION METADATA
// ============================================

/**
 * Section metadata for UI display
 */
export const SECTION_METADATA = {
  SECTION_1: {
    title: "Lifestyle & Surface Compatibility",
    description:
      "Questions about your lifestyle, values, and practical preferences",
    questionCount: 20,
  },
  SECTION_2: {
    title: "Personality & Interaction Style",
    description:
      "Questions about how you interact, communicate, and approach relationships",
    questionCount: 16,
  },
  FREE_RESPONSE: {
    title: "Get to Know You",
    description: "Help your match and cupid understand you better",
    questionCount: 5, // 2 mandatory + 3 optional
  },
} as const;

/**
 * Export all constants as a single object for easy importing
 */
export const QUESTIONNAIRE_V2_CONSTANTS = {
  IMPORTANCE_WEIGHTS,
  IMPORTANCE_LABELS,
  SECTION_WEIGHTS,
  SECTION_BOUNDARIES,
  AGE_LIMITS,
  FREE_RESPONSE_LIMITS,
  MULTI_SELECT_LIMITS,
  PROGRESS_TOTALS,
  REQUIRED_QUESTIONS,
  FREE_RESPONSE_IDS,
  MATCHING_PARAMS,
  AUTOSAVE,
  BREAKPOINTS,
  WARNING_MESSAGES,
  SECTION_METADATA,
} as const;
