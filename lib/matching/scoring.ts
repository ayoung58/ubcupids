/**
 * Scoring Engine for UBCupids Matching System
 *
 * Calculates compatibility scores between users based on
 * questionnaire responses and importance ratings.
 */

import {
  DecryptedResponses,
  DecryptedImportance,
  QuestionScore,
  SectionScore,
  CompatibilityCalculation,
  ScoredPair,
} from "./types";
import {
  SECTION_WEIGHTS,
  IMPORTANCE_MULTIPLIERS,
  DEBUG_SCORING,
} from "./config";
import { checkGenderFilter, checkAgeFilter } from "./filters";
import questionnaireConfig from "../../src/data/questionnaire-config.json";

// ===========================================
// QUESTION TYPE DEFINITIONS
// ===========================================

type QuestionType =
  | "single-choice"
  | "multi-choice"
  | "ranking"
  | "textarea"
  | "age-range";

interface QuestionOption {
  value: string;
  label: string;
  hasTextInput?: boolean;
}

interface QuestionDefinition {
  id: string;
  type: QuestionType;
  text: string;
  hasImportance: boolean;
  options?: QuestionOption[];
}

// ===========================================
// QUESTION MAPPING
// ===========================================

/**
 * Build a map of question ID to definition from config
 */
function buildQuestionMap(): Map<
  string,
  QuestionDefinition & { section: number }
> {
  const map = new Map<string, QuestionDefinition & { section: number }>();

  for (const section of questionnaireConfig.sections) {
    const sectionNum = parseInt(section.id.replace("section-", ""), 10);

    for (const question of section.questions) {
      // Safely access options which may not exist on all question types
      const questionWithOptions = question as { options?: QuestionOption[] };

      map.set(question.id.toUpperCase(), {
        id: question.id.toUpperCase(),
        type: question.type as QuestionType,
        text: question.text,
        hasImportance: question.hasImportance,
        options: questionWithOptions.options,
        section: sectionNum,
      });
    }
  }

  return map;
}

const QUESTION_MAP = buildQuestionMap();

/**
 * Get questions by section
 */
function getQuestionsBySection(section: number): string[] {
  const questions: string[] = [];

  for (const [id, def] of QUESTION_MAP.entries()) {
    if (def.section === section) {
      questions.push(id);
    }
  }

  return questions.sort((a, b) => {
    const numA = parseInt(a.replace("Q", ""), 10);
    const numB = parseInt(b.replace("Q", ""), 10);
    return numA - numB;
  });
}

// Pre-compute section questions
const SECTION_1_QUESTIONS = getQuestionsBySection(1); // Q4-Q13
const SECTION_2_QUESTIONS = getQuestionsBySection(2); // Q14-Q32
const SECTION_3_QUESTIONS = getQuestionsBySection(3); // Q33-Q59
const SECTION_5_QUESTIONS = getQuestionsBySection(5); // Q60-Q63

// ===========================================
// SINGLE-CHOICE SCORING
// ===========================================

/**
 * Calculate score for single-choice question comparison
 *
 * Matching logic:
 * - Exact match: 100
 * - No match: 0
 *
 * Future enhancement: Add "closeness" scoring for ordered options
 */
function scoreSingleChoice(
  user1Answer: string | undefined,
  user2Answer: string | undefined
): number {
  if (!user1Answer || !user2Answer) {
    return 0; // No answer = no score
  }

  // Exact match
  if (user1Answer === user2Answer) {
    return 100;
  }

  return 0;
}

// ===========================================
// MULTI-CHOICE SCORING
// ===========================================

/**
 * Calculate score for multi-choice question comparison
 *
 * Uses Jaccard similarity: intersection / union
 * Score = (shared selections / total unique selections) * 100
 */
function scoreMultiChoice(
  user1Answers: string[] | undefined,
  user2Answers: string[] | undefined
): number {
  if (!user1Answers || !user2Answers) {
    return 0;
  }

  const set1 = new Set(user1Answers);
  const set2 = new Set(user2Answers);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) {
    return 0;
  }

  return (intersection.size / union.size) * 100;
}

// ===========================================
// RANKING SCORING
// ===========================================

/**
 * Calculate score for ranking question comparison
 *
 * Uses weighted position comparison:
 * - Items in matching positions: high score
 * - Items in different positions: partial score based on distance
 * - Items not in common: 0
 *
 * For "top 3" rankings:
 * - Position 1 match: 50 points
 * - Position 2 match: 30 points
 * - Position 3 match: 20 points
 * - Cross-position matches get partial credit
 */
function scoreRanking(
  user1Ranking: string[] | undefined,
  user2Ranking: string[] | undefined
): number {
  if (!user1Ranking || !user2Ranking) {
    return 0;
  }

  // Position weights (1st = most important)
  const positionWeights = [50, 30, 20];
  let score = 0;

  // For each position in user1's ranking
  for (let i = 0; i < Math.min(user1Ranking.length, 3); i++) {
    const item = user1Ranking[i];
    const user2Index = user2Ranking.indexOf(item);

    if (user2Index === -1) {
      // Item not in user2's ranking
      continue;
    }

    if (user2Index === i) {
      // Same position: full points for this position
      score += positionWeights[i];
    } else {
      // Different position: partial credit
      const distance = Math.abs(i - user2Index);
      const partialCredit = positionWeights[i] * (1 - distance * 0.25);
      score += Math.max(0, partialCredit);
    }
  }

  return score;
}

// ===========================================
// AGE-RANGE SCORING
// ===========================================

/**
 * Calculate score for age-range preference compatibility
 *
 * This scores how well a user's age fits within the other's preferred range.
 * Note: This is different from the age filter - this is about scoring,
 * not hard filtering. The age filter in filters.ts handles hard cutoffs.
 *
 * For age-range questions, we score based on whether the partner's age
 * falls within the user's acceptable range.
 */
function scoreAgeRange(
  user1Range:
    | { min?: number; max?: number; minAge?: number; maxAge?: number }
    | undefined,
  user2Range:
    | { min?: number; max?: number; minAge?: number; maxAge?: number }
    | undefined
): number {
  // Normalize to min/max format
  const normalize = (
    range: typeof user1Range
  ): { min: number; max: number } | null => {
    if (!range) return null;
    return {
      min: range.min ?? range.minAge ?? 18,
      max: range.max ?? range.maxAge ?? 35,
    };
  };

  const range1 = normalize(user1Range);
  const range2 = normalize(user2Range);

  // If either range is missing, return neutral score
  if (!range1 || !range2) {
    return 50;
  }

  // Calculate overlap between ranges
  const overlapStart = Math.max(range1.min, range2.min);
  const overlapEnd = Math.min(range1.max, range2.max);

  if (overlapStart > overlapEnd) {
    // No overlap - low score but not zero (they might still work)
    return 10;
  }

  // Calculate overlap percentage relative to both ranges
  const user1RangeSize = range1.max - range1.min + 1;
  const user2RangeSize = range2.max - range2.min + 1;
  const overlapSize = overlapEnd - overlapStart + 1;

  const overlapPercent1 = overlapSize / user1RangeSize;
  const overlapPercent2 = overlapSize / user2RangeSize;
  const avgOverlap = (overlapPercent1 + overlapPercent2) / 2;

  // Scale to 0-100
  return avgOverlap * 100;
}

// ===========================================
// TEXT SIMILARITY (PLACEHOLDER)
// ===========================================

/**
 * Calculate score for text question comparison
 *
 * This is a placeholder that returns 50 (neutral).
 * Real implementation uses sentence embeddings (see ai.ts).
 *
 * @param user1Text - User1's text response
 * @param user2Text - User2's text response
 * @param embeddingSimilarity - Pre-computed embedding similarity (0-1)
 */
function scoreText(
  user1Text: string | undefined,
  user2Text: string | undefined,
  embeddingSimilarity?: number
): number {
  // If we have pre-computed embedding similarity, use it
  if (embeddingSimilarity !== undefined) {
    // Convert from [-1, 1] cosine similarity to [0, 100] score
    // Cosine similarity of 1 = 100, 0 = 50, -1 = 0
    return ((embeddingSimilarity + 1) / 2) * 100;
  }

  // Fallback: basic text comparison
  if (!user1Text || !user2Text) {
    return 50; // Neutral score for missing text
  }

  // Placeholder: return neutral score
  // Real scoring uses embeddings from ai.ts
  return 50;
}

// ===========================================
// QUESTION SCORING ROUTER
// ===========================================

/**
 * Route to appropriate scoring function based on question type
 */
function scoreQuestion(
  questionId: string,
  user1Response: string | string[] | number | undefined,
  user2Response: string | string[] | number | undefined,
  embeddingSimilarity?: number
): number {
  const question = QUESTION_MAP.get(questionId);

  if (!question) {
    console.warn(`Unknown question: ${questionId}`);
    return 0;
  }

  switch (question.type) {
    case "single-choice":
      return scoreSingleChoice(
        user1Response as string | undefined,
        user2Response as string | undefined
      );

    case "multi-choice":
      return scoreMultiChoice(
        user1Response as string[] | undefined,
        user2Response as string[] | undefined
      );

    case "ranking":
      return scoreRanking(
        user1Response as string[] | undefined,
        user2Response as string[] | undefined
      );

    case "textarea":
      return scoreText(
        user1Response as string | undefined,
        user2Response as string | undefined,
        embeddingSimilarity
      );

    case "age-range":
      return scoreAgeRange(
        user1Response as { min: number; max: number } | undefined,
        user2Response as { min: number; max: number } | undefined
      );

    default:
      console.warn(`Unhandled question type: ${question.type}`);
      return 0;
  }
}

// ===========================================
// IMPORTANCE WEIGHTING
// ===========================================

/**
 * Get importance multiplier for a question
 *
 * @param questionId - Question ID
 * @param importance - User's importance ratings
 * @returns Multiplier value
 */
function getImportanceMultiplier(
  questionId: string,
  importance: DecryptedImportance
): number {
  const question = QUESTION_MAP.get(questionId);

  // If question doesn't have importance rating, use baseline
  if (!question?.hasImportance) {
    return IMPORTANCE_MULTIPLIERS[3]; // Baseline
  }

  // Handle case-insensitive importance lookup
  const lowerQuestionId = questionId.toLowerCase();
  const rating = (importance[questionId] ?? importance[lowerQuestionId]) as
    | 1
    | 2
    | 3
    | 4
    | 5;

  if (!rating || rating < 1 || rating > 5) {
    return IMPORTANCE_MULTIPLIERS[3]; // Default to baseline
  }

  return IMPORTANCE_MULTIPLIERS[rating];
}

// ===========================================
// SECTION SCORING
// ===========================================

/**
 * Calculate score for a section
 *
 * @param sectionNum - Section number (1, 2, 3, or 5)
 * @param questionIds - Question IDs in this section
 * @param user1Responses - User1's responses
 * @param user2Responses - User2's responses
 * @param user1Importance - User1's importance ratings
 * @param user2Importance - User2's importance ratings (for bidirectional averaging)
 * @param embeddingSimilarities - Pre-computed text similarities
 */
function calculateSectionScore(
  sectionNum: 1 | 2 | 3 | 5,
  questionIds: string[],
  user1Responses: DecryptedResponses,
  user2Responses: DecryptedResponses,
  user1Importance: DecryptedImportance,
  user2Importance: DecryptedImportance,
  embeddingSimilarities?: Map<string, number>
): SectionScore {
  const questionScores: QuestionScore[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const questionId of questionIds) {
    const question = QUESTION_MAP.get(questionId);
    if (!question) continue;

    // Handle case-insensitive response lookup (responses may use lowercase keys)
    const lowerQuestionId = questionId.toLowerCase();
    const user1Response =
      user1Responses[questionId] ?? user1Responses[lowerQuestionId];
    const user2Response =
      user2Responses[questionId] ?? user2Responses[lowerQuestionId];

    // Get base score for this question
    const embeddingSim = embeddingSimilarities?.get(questionId);
    const baseScore = scoreQuestion(
      questionId,
      user1Response,
      user2Response,
      embeddingSim
    );

    // Get importance weight (average of both users' importance)
    // This makes the score direction-agnostic for section calculation
    const user1Weight = getImportanceMultiplier(questionId, user1Importance);
    const user2Weight = getImportanceMultiplier(questionId, user2Importance);
    const avgWeight = (user1Weight + user2Weight) / 2;

    const weightedScore = baseScore * avgWeight;

    questionScores.push({
      questionId,
      baseScore,
      importanceWeight: avgWeight,
      weightedScore,
    });

    totalWeightedScore += weightedScore;
    totalWeight += avgWeight;
  }

  // Normalize to 0-100 scale
  // Weighted average: sum(score * weight) / sum(weight)
  const normalizedScore =
    totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  const sectionWeight =
    SECTION_WEIGHTS[`section${sectionNum}` as keyof typeof SECTION_WEIGHTS];

  return {
    section: sectionNum,
    questions: questionScores,
    rawTotal: totalWeightedScore,
    normalizedScore,
    weight: sectionWeight,
    weightedScore: normalizedScore * sectionWeight,
  };
}

// ===========================================
// FULL COMPATIBILITY CALCULATION
// ===========================================

/**
 * Calculate full compatibility between two users
 *
 * This calculates User1's compatibility TOWARD User2
 * (how well User2 matches what User1 is looking for)
 *
 * For bidirectional score, call this twice and average.
 *
 * @param user1Id - User1's ID
 * @param user2Id - User2's ID
 * @param user1Responses - User1's questionnaire responses
 * @param user2Responses - User2's questionnaire responses
 * @param user1Importance - User1's importance ratings
 * @param user2Importance - User2's importance ratings
 * @param user1Age - User1's age
 * @param user2Age - User2's age
 * @param embeddingSimilarities - Pre-computed text embedding similarities
 */
export function calculateCompatibility(
  user1Id: string,
  user2Id: string,
  user1Responses: DecryptedResponses,
  user2Responses: DecryptedResponses,
  user1Importance: DecryptedImportance,
  user2Importance: DecryptedImportance,
  user1Age: number,
  user2Age: number,
  embeddingSimilarities?: Map<string, number>
): CompatibilityCalculation {
  // Check hard filters
  const genderFilter = checkGenderFilter(
    user1Responses,
    user2Responses,
    user1Id,
    user2Id
  );
  const ageFilter = checkAgeFilter(
    user1Responses,
    user2Responses,
    user1Age,
    user2Age,
    user1Id,
    user2Id
  );

  // Calculate section scores
  const section1 = calculateSectionScore(
    1,
    SECTION_1_QUESTIONS,
    user1Responses,
    user2Responses,
    user1Importance,
    user2Importance,
    embeddingSimilarities
  );

  const section2 = calculateSectionScore(
    2,
    SECTION_2_QUESTIONS,
    user1Responses,
    user2Responses,
    user1Importance,
    user2Importance,
    embeddingSimilarities
  );

  const section3 = calculateSectionScore(
    3,
    SECTION_3_QUESTIONS,
    user1Responses,
    user2Responses,
    user1Importance,
    user2Importance,
    embeddingSimilarities
  );

  const section5 = calculateSectionScore(
    5,
    SECTION_5_QUESTIONS,
    user1Responses,
    user2Responses,
    user1Importance,
    user2Importance,
    embeddingSimilarities
  );

  // Calculate total weighted score
  const totalScore =
    section1.weightedScore +
    section2.weightedScore +
    section3.weightedScore +
    section5.weightedScore;

  if (DEBUG_SCORING) {
    console.log(`Compatibility ${user1Id} -> ${user2Id}:`, {
      section1: section1.normalizedScore.toFixed(1),
      section2: section2.normalizedScore.toFixed(1),
      section3: section3.normalizedScore.toFixed(1),
      section5: section5.normalizedScore.toFixed(1),
      total: totalScore.toFixed(1),
      genderPass: genderFilter.bothPass,
      agePass: ageFilter.bothPass,
    });
  }

  return {
    userId: user1Id,
    targetUserId: user2Id,
    section1,
    section2,
    section3,
    section5,
    totalScore,
    bidirectionalScore: undefined, // Set by caller if needed
    passesGenderFilter:
      genderFilter.user1PassesFilter && genderFilter.user2PassesFilter,
    passesAgeFilter: ageFilter.bothPass,
    isEligible: genderFilter.bothPass && ageFilter.bothPass,
  };
}

// ===========================================
// BIDIRECTIONAL SCORING
// ===========================================

/**
 * Calculate bidirectional compatibility score between two users
 *
 * @param user1Id - User1's ID
 * @param user2Id - User2's ID
 * @param user1Responses - User1's questionnaire responses
 * @param user2Responses - User2's questionnaire responses
 * @param user1Importance - User1's importance ratings
 * @param user2Importance - User2's importance ratings
 * @param user1Age - User1's age
 * @param user2Age - User2's age
 * @param embeddingSimilarities - Pre-computed text embedding similarities
 */
export function calculateBidirectionalCompatibility(
  user1Id: string,
  user2Id: string,
  user1Responses: DecryptedResponses,
  user2Responses: DecryptedResponses,
  user1Importance: DecryptedImportance,
  user2Importance: DecryptedImportance,
  user1Age: number,
  user2Age: number,
  embeddingSimilarities?: Map<string, number>
): ScoredPair {
  // Calculate in both directions
  const score1to2 = calculateCompatibility(
    user1Id,
    user2Id,
    user1Responses,
    user2Responses,
    user1Importance,
    user2Importance,
    user1Age,
    user2Age,
    embeddingSimilarities
  );

  const score2to1 = calculateCompatibility(
    user2Id,
    user1Id,
    user2Responses,
    user1Responses,
    user2Importance,
    user1Importance,
    user2Age,
    user1Age,
    embeddingSimilarities
  );

  // Calculate bidirectional average
  const bidirectionalScore = (score1to2.totalScore + score2to1.totalScore) / 2;

  // Both directions must pass filters
  const passesFilters = score1to2.isEligible && score2to1.isEligible;

  return {
    user1Id,
    user2Id,
    score1to2: score1to2.totalScore,
    score2to1: score2to1.totalScore,
    bidirectionalScore,
    passesFilters,
  };
}

// ===========================================
// EXPORTS
// ===========================================

export {
  QUESTION_MAP,
  SECTION_1_QUESTIONS,
  SECTION_2_QUESTIONS,
  SECTION_3_QUESTIONS,
  SECTION_5_QUESTIONS,
  scoreSingleChoice,
  scoreMultiChoice,
  scoreRanking,
  scoreText,
  scoreAgeRange,
  scoreQuestion,
  getImportanceMultiplier,
  calculateSectionScore,
};
