/**
 * Matching Algorithm V2.2 - Phase 6: Pair Scores
 *
 * Calculates final pair scores by combining all question-level scores
 * and applying section weighting.
 *
 * Mutuality consideration:
 * - Pair score balances A→B and B→A scores
 * - Formula: pair_score = α × min(A→B, B→A) + (1-α) × mean(A→B, B→A)
 * - Default α = 0.65 (prioritizes weakest link while considering average)
 *
 * @see Matching Algorithm V2.2 Phase 6
 */

import { MatchingUser } from "./types";
import { MatchingConfig } from "./config";

/**
 * Diagnostic information about low-scoring questions
 */
export interface LowScoreQuestion {
  questionId: string;
  score: number;
  section: "LIFESTYLE" | "PERSONALITY";
}

/**
 * Diagnostic information about asymmetric preferences
 */
export interface AsymmetricPreference {
  questionId: string;
  userAScore: number;
  userBScore: number;
  difference: number;
}

/**
 * Result of pair score calculation
 */
export interface PairScoreResult {
  userAToB: number; // User A's score for User B (0-100)
  userBToA: number; // User B's score for User A (0-100)
  pairScore: number; // Final pair score with mutuality (0-100)
  mutualityPenalty: number; // Penalty applied for asymmetry (0-1)
  questionCount: number; // Total questions used in calculation
  lowScoreQuestions: LowScoreQuestion[]; // Questions scoring below 0.3
  asymmetricPreferences: AsymmetricPreference[]; // Questions with >0.4 difference
}

/**
 * Calculates pair score with mutuality consideration
 *
 * Process:
 * 1. Calculate directional scores (A→B, B→A)
 * 2. Apply mutuality formula to balance weak link and average
 * 3. Identify diagnostics: low scores, asymmetric preferences
 *
 * Mutuality Formula:
 * pair_score = α × min(A→B, B→A) + (1-α) × mean(A→B, B→A)
 *
 * Example with α=0.65:
 * - A→B = 80, B→A = 60
 * - min = 60, mean = 70
 * - pair_score = 0.65×60 + 0.35×70 = 39 + 24.5 = 63.5
 *
 * This prevents "one-sided" matches where one person is very interested
 * but the other is not.
 *
 * @param userAToB - User A's score for User B (0-100 scale)
 * @param userBToA - User B's score for User A (0-100 scale)
 * @param questionScores - Map of question IDs to individual scores for diagnostics
 * @param config - Matching configuration (for future mutuality tuning)
 * @returns Pair score with diagnostics
 */
export function calculatePairScore(
  userAToB: number,
  userBToA: number,
  questionScores: Record<string, { a: number; b: number; section: string }>,
  config: MatchingConfig
): PairScoreResult {
  // Apply mutuality formula using config alpha
  const alpha = config.MUTUALITY_ALPHA;
  const minScore = Math.min(userAToB, userBToA);
  const meanScore = (userAToB + userBToA) / 2;
  const pairScore = alpha * minScore + (1 - alpha) * meanScore;

  // Calculate mutuality penalty (how much was lost due to asymmetry)
  const maxPossibleScore = Math.max(userAToB, userBToA);
  const mutualityPenalty =
    maxPossibleScore > 0
      ? (maxPossibleScore - pairScore) / maxPossibleScore
      : 0;

  // Identify low-scoring questions (threshold: 0.3 on 0-1 scale = 30 on 0-100)
  const lowScoreQuestions: LowScoreQuestion[] = [];
  for (const [questionId, scores] of Object.entries(questionScores)) {
    const avgScore = (scores.a + scores.b) / 2;
    if (avgScore < 0.3) {
      lowScoreQuestions.push({
        questionId,
        score: avgScore,
        section: scores.section as "LIFESTYLE" | "PERSONALITY",
      });
    }
  }

  // Identify asymmetric preferences (difference > 0.4 on 0-1 scale)
  const asymmetricPreferences: AsymmetricPreference[] = [];
  for (const [questionId, scores] of Object.entries(questionScores)) {
    const difference = Math.abs(scores.a - scores.b);
    if (difference > 0.4) {
      asymmetricPreferences.push({
        questionId,
        userAScore: scores.a,
        userBScore: scores.b,
        difference,
      });
    }
  }

  return {
    userAToB,
    userBToA,
    pairScore,
    mutualityPenalty,
    questionCount: Object.keys(questionScores).length,
    lowScoreQuestions: lowScoreQuestions.sort((a, b) => a.score - b.score),
    asymmetricPreferences: asymmetricPreferences.sort(
      (a, b) => b.difference - a.difference
    ),
  };
}
