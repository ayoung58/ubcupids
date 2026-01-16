/**
 * Matching System Configuration
 *
 * This file contains all configuration variables for the matching system.
 * Toggle these values to control matching behavior.
 *
 * 2026 TIMELINE:
 * - Questionnaire responses due: January 31st, 2026
 * - Cupid evaluation period: Feb 1-7, 2026
 * - Match reveal: February 8th, 2026
 */

// ===========================================
// MATCHING CONTROL
// ===========================================

/**
 * Toggle to run the full matching algorithm
 * Set to true when ready to run matching (after Jan 31 deadline)
 */
export const RUN_MATCHING = true;

/**
 * Match reveal date
 * Matches will be visible to users on this date
 */
export const MATCH_REVEAL_DATE = new Date("2026-02-08T00:00:00-08:00");

/**
 * Questionnaire deadline
 * Users must complete questionnaire by this date
 */
export const QUESTIONNAIRE_DEADLINE = new Date("2026-01-31T23:59:59-08:00");

/**
 * Sign-up deadline for registration
 * Users cannot register after this date
 */
export const SIGNUP_DEADLINE = new Date("2026-01-31T23:59:59-08:00");

/**
 * Maximum number of users allowed (excluding test users)
 * Hard cap for both match candidates and cupids
 */
export const MAX_MATCH_USERS = 500;
export const MAX_CUPID_USERS = 500;

// Legacy exports for backwards compatibility (will be removed in future)
export const BATCH_1_RUN_MATCHING = RUN_MATCHING;
export const BATCH_2_RUN_MATCHING = false; // Deprecated - no batch 2
export const CURRENT_BATCH = 1; // Fixed at 1 - single batch system

// ===========================================
// TEST MODE
// ===========================================

/**
 * When true, matches are immediately revealed for testing
 * When false, matches wait until reveal date
 */
export const TEST_MODE_REVEAL = process.env.NODE_ENV === "development";

/**
 * When true, scoring calculations are logged for debugging
 */
export const DEBUG_SCORING = process.env.NODE_ENV === "development";

// ===========================================
// SECTION WEIGHTING
// ===========================================

/**
 * Section weights for compatibility scoring (must sum to 1.0)
 *
 * Section 0: Hard filters (gender preference) - not weighted, used for filtering
 * Section 1: Icebreakers & Fun - 15%
 * Section 2: What I'm Like - 30%
 * Section 3: What I'm Looking For - 45%
 * Section 5: Open-Ended - 10%
 */
export const SECTION_WEIGHTS = {
  section1: 0.15, // Icebreakers & Fun
  section2: 0.3, // What I'm Like
  section3: 0.45, // What I'm Looking For
  section5: 0.1, // Open-Ended (text similarity)
} as const;

// Validate weights sum to 1.0
const totalWeight = Object.values(SECTION_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(totalWeight - 1.0) > 0.001) {
  throw new Error(`Section weights must sum to 1.0, got ${totalWeight}`);
}

// ===========================================
// IMPORTANCE MULTIPLIERS
// ===========================================

/**
 * Importance rating multipliers (1-5 scale)
 * Higher importance = greater impact on score
 */
export const IMPORTANCE_MULTIPLIERS = {
  1: 0.5, // Not important at all
  2: 0.75, // Slightly important
  3: 1.0, // Moderately important (baseline)
  4: 1.5, // Very important
  5: 2.0, // Extremely important
} as const;

// ===========================================
// MATCHING THRESHOLDS
// ===========================================

/**
 * Minimum bidirectional score (0-100) for algorithm to consider a pair
 */
export const MINIMUM_MATCH_SCORE = 5;

/**
 * Number of matches to generate per user via algorithm
 */
export const ALGORITHM_MATCHES_PER_USER = 1;

/**
 * Maximum cupid-sent matches a user can receive
 */
export const MAX_CUPID_SENT_MATCHES = 2;

/**
 * Maximum cupid-received matches a user can receive
 */
export const MAX_CUPID_RECEIVED_MATCHES = 2;

// ===========================================
// CUPID SYSTEM
// ===========================================

/**
 * Minimum number of algorithm pairs to show each cupid for review
 */
export const CUPID_PAIRS_MIN = 10;

/**
 * Maximum number of algorithm pairs to show each cupid for review
 */
export const CUPID_PAIRS_MAX = 20;

// ===========================================
// AI CONFIGURATION
// ===========================================

/**
 * Sentence-BERT model for text embeddings
 * Using all-MiniLM-L6-v2 for efficiency (FREE on HuggingFace)
 */
export const EMBEDDING_MODEL = "all-MiniLM-L6-v2";

/**
 * Model for generating cupid summaries
 * Using Mistral-7B-Instruct-v0.2 (FREE on HuggingFace)
 */
export const SUMMARY_MODEL = "Mistral-7B-Instruct-v0.2";

// ===========================================
// PERFORMANCE
// ===========================================

/**
 * Batch size for processing user pairs
 */
export const SCORING_BATCH_SIZE = 100;

/**
 * Enable parallel processing for scoring
 */
export const PARALLEL_SCORING = true;

/**
 * Maximum concurrent scoring operations
 */
export const MAX_CONCURRENT_SCORING = 10;
