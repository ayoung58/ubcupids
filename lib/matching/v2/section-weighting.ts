/**
 * Matching Algorithm V2.2 - Phase 5: Section Weighting
 *
 * Groups questions by section and applies section weights to calculate
 * final section-level scores.
 *
 * Sections:
 * - Lifestyle (Q1-Q21): Demographic and lifestyle questions (65%)
 * - Personality (Q22-Q37): Personality and values questions (35%)
 *
 * @see Matching Algorithm V2.2 Phase 5
 */

import { MatchingConfig } from "./config";
import { MatchingUser } from "./types";

/**
 * Question section definitions
 * Maps question IDs to their respective sections
 */
const QUESTION_SECTIONS = {
  LIFESTYLE: [
    "q1",
    "q2",
    "q3",
    "q4",
    "q5",
    "q6",
    "q7",
    "q8",
    "q9",
    "q10",
    "q11",
    "q12",
    "q13",
    "q14",
    "q15",
    "q16",
    "q17",
    "q18",
    "q19",
    "q20",
    "q21",
  ],
  PERSONALITY: [
    "q22",
    "q23",
    "q24",
    "q25",
    "q26",
    "q27",
    "q28",
    "q29",
    "q30",
    "q31",
    "q32",
    "q33",
    "q34",
    "q35",
    "q36",
    "q37",
  ],
} as const;

/**
 * Result of section weighting calculation
 */
export interface SectionWeightingResult {
  lifestyleScore: number; // Average similarity for lifestyle questions [0, 1]
  personalityScore: number; // Average similarity for personality questions [0, 1]
  weightedLifestyleScore: number; // Lifestyle score × section weight
  weightedPersonalityScore: number; // Personality score × section weight
  totalScore: number; // Sum of weighted section scores (scaled to 0-100)
  lifestyleQuestionCount: number; // Number of lifestyle questions answered
  personalityQuestionCount: number; // Number of personality questions answered
  totalQuestionCount: number; // Total questions used in calculation
}

/**
 * Applies section weights to question-level scores
 *
 * Process:
 * 1. Group questions by section (Lifestyle vs Personality)
 * 2. Calculate average similarity for each section
 * 3. Apply section weights (configurable, default 50/50)
 * 4. Scale to 0-100 for final score
 *
 * @param questionScores - Map of question IDs to final similarity scores [0, 1]
 * @param config - Matching configuration with section weights
 * @returns Section-weighted scores and diagnostics
 */
export function applySectionWeighting(
  questionScores: Record<string, number>,
  config: MatchingConfig
): SectionWeightingResult {
  // Separate questions by section
  const lifestyleScores: number[] = [];
  const personalityScores: number[] = [];

  for (const [questionId, score] of Object.entries(questionScores)) {
    if (QUESTION_SECTIONS.LIFESTYLE.includes(questionId as any)) {
      lifestyleScores.push(score);
    } else if (QUESTION_SECTIONS.PERSONALITY.includes(questionId as any)) {
      personalityScores.push(score);
    }
    // Questions not in either section are ignored
  }

  // Calculate section averages
  const lifestyleScore =
    lifestyleScores.length > 0
      ? lifestyleScores.reduce((sum, score) => sum + score, 0) /
        lifestyleScores.length
      : 0;

  const personalityScore =
    personalityScores.length > 0
      ? personalityScores.reduce((sum, score) => sum + score, 0) /
        personalityScores.length
      : 0;

  // Apply section weights
  const weightedLifestyleScore =
    lifestyleScore * config.SECTION_WEIGHTS.LIFESTYLE;
  const weightedPersonalityScore =
    personalityScore * config.SECTION_WEIGHTS.PERSONALITY;

  // Calculate total score (0-1 scale, then convert to 0-100)
  const totalScoreNormalized =
    weightedLifestyleScore + weightedPersonalityScore;
  const totalScore = totalScoreNormalized * 100;

  return {
    lifestyleScore,
    personalityScore,
    weightedLifestyleScore,
    weightedPersonalityScore,
    totalScore,
    lifestyleQuestionCount: lifestyleScores.length,
    personalityQuestionCount: personalityScores.length,
    totalQuestionCount: lifestyleScores.length + personalityScores.length,
  };
}

/**
 * Helper to get section for a given question ID
 *
 * @param questionId - Question identifier (e.g., "q5")
 * @returns Section name ("LIFESTYLE" or "PERSONALITY") or undefined if not found
 */
export function getQuestionSection(
  questionId: string
): "LIFESTYLE" | "PERSONALITY" | undefined {
  if (QUESTION_SECTIONS.LIFESTYLE.includes(questionId as any)) {
    return "LIFESTYLE";
  }
  if (QUESTION_SECTIONS.PERSONALITY.includes(questionId as any)) {
    return "PERSONALITY";
  }
  return undefined;
}
