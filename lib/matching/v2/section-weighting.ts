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
 * Applies section weights to question-level scores with importance-based weighting
 *
 * Process:
 * 1. Group questions by section (Lifestyle vs Personality)
 * 2. Calculate WEIGHTED average similarity for each section
 *    - Each question is weighted by the MAXIMUM importance either user assigned
 *    - This ensures questions people care about matter more
 * 3. Apply section weights (configurable, default 65% lifestyle / 35% personality)
 * 4. Scale to 0-100 for final score
 *
 * @param questionScores - Map of question IDs to final similarity scores [0, 1]
 * @param userA - First user (for importance weights)
 * @param userB - Second user (for importance weights)
 * @param config - Matching configuration with section weights
 * @returns Section-weighted scores and diagnostics
 */
export function applySectionWeighting(
  questionScores: Record<string, number>,
  userA: MatchingUser,
  userB: MatchingUser,
  config: MatchingConfig,
): SectionWeightingResult {
  // Separate questions by section with importance weights
  const lifestyleScores: Array<{ score: number; weight: number }> = [];
  const personalityScores: Array<{ score: number; weight: number }> = [];

  for (const [questionId, score] of Object.entries(questionScores)) {
    // Get the maximum importance weight between both users
    const importanceWeight = getMaxImportanceWeight(
      questionId,
      userA,
      userB,
      config,
    );

    if (QUESTION_SECTIONS.LIFESTYLE.includes(questionId as any)) {
      lifestyleScores.push({ score, weight: importanceWeight });
    } else if (QUESTION_SECTIONS.PERSONALITY.includes(questionId as any)) {
      personalityScores.push({ score, weight: importanceWeight });
    }
    // Questions not in either section are ignored
  }

  // Calculate weighted section averages
  const lifestyleScore = calculateWeightedAverage(lifestyleScores);
  const personalityScore = calculateWeightedAverage(personalityScores);

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
 * Get the maximum importance weight between two users for a given question
 * Uses the higher importance to ensure questions people care about matter more
 *
 * @param questionId - Question identifier
 * @param userA - First user
 * @param userB - Second user
 * @param config - Matching configuration with importance weights
 * @returns Maximum importance weight [0, 2.0]
 */
function getMaxImportanceWeight(
  questionId: string,
  userA: MatchingUser,
  userB: MatchingUser,
  config: MatchingConfig,
): number {
  const aResponse = userA.responses[questionId];
  const bResponse = userB.responses[questionId];

  const aImportance = getImportanceWeight(aResponse?.importance, config);
  const bImportance = getImportanceWeight(bResponse?.importance, config);

  // Return the maximum importance between the two users
  return Math.max(aImportance, bImportance);
}

/**
 * Convert importance level to numeric weight
 * Per V2.2: NOT=0, SOMEWHAT=0.5, IMPORTANT=1.0, VERY=2.0
 *
 * @param importance - Importance string from questionnaire
 * @param config - Matching configuration
 * @returns Numeric importance weight
 */
function getImportanceWeight(
  importance: string | number | undefined,
  config: MatchingConfig,
): number {
  if (typeof importance === "number") return importance;
  if (!importance) return config.IMPORTANCE_WEIGHTS.SOMEWHAT_IMPORTANT; // Default to somewhat

  const weights = config.IMPORTANCE_WEIGHTS;

  // Normalize to uppercase
  const normalizedImportance =
    typeof importance === "string" ? importance.toUpperCase() : importance;

  const importanceMap: Record<string, number> = {
    NOT_IMPORTANT: weights.NOT_IMPORTANT,
    SOMEWHAT_IMPORTANT: weights.SOMEWHAT_IMPORTANT,
    IMPORTANT: weights.IMPORTANT,
    VERY_IMPORTANT: weights.VERY_IMPORTANT,
  };

  return importanceMap[normalizedImportance] ?? weights.SOMEWHAT_IMPORTANT;
}

/**
 * Calculate weighted average of scores
 * If all weights are 0, returns simple average (to avoid NaN)
 *
 * @param items - Array of score/weight pairs
 * @returns Weighted average [0, 1]
 */
function calculateWeightedAverage(
  items: Array<{ score: number; weight: number }>,
): number {
  if (items.length === 0) return 0;

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  // If all weights are 0, use simple average instead
  if (totalWeight === 0) {
    return items.reduce((sum, item) => sum + item.score, 0) / items.length;
  }

  // Weighted average: sum(score * weight) / sum(weight)
  const weightedSum = items.reduce(
    (sum, item) => sum + item.score * item.weight,
    0,
  );

  return weightedSum / totalWeight;
}

/**
 * Helper to get section for a given question ID
 *
 * @param questionId - Question identifier (e.g., "q5")
 * @returns Section name ("LIFESTYLE" or "PERSONALITY") or undefined if not found
 */
export function getQuestionSection(
  questionId: string,
): "LIFESTYLE" | "PERSONALITY" | undefined {
  if (QUESTION_SECTIONS.LIFESTYLE.includes(questionId as any)) {
    return "LIFESTYLE";
  }
  if (QUESTION_SECTIONS.PERSONALITY.includes(questionId as any)) {
    return "PERSONALITY";
  }
  return undefined;
}
