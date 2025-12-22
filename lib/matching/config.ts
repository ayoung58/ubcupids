/**
 * Matching System Configuration
 *
 * This file contains all configuration variables for the matching system.
 * Toggle these values to control matching behavior.
 */

// ===========================================
// BATCH CONTROL
// ===========================================

/**
 * Toggle to run the full matching algorithm for Batch 1
 * Set to true when ready to run matching (Feb 1 deadline)
 */
export const BATCH_1_RUN_MATCHING = true;

/**
 * Toggle to run the full matching algorithm for Batch 2
 * Set to true when ready to run matching (Feb 7 deadline)
 */
export const BATCH_2_RUN_MATCHING = false;

/**
 * Current batch number (1 or 2)
 * This determines which batch operations affect
 */
export const CURRENT_BATCH = 1;

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
export const MINIMUM_MATCH_SCORE = 30;

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
