/**
 * Matching Algorithm V2 - 8-Phase Scoring & Filtering
 *
 * This module implements the complete matching algorithm with:
 * - Phase 1: Dealbreaker hard filters (Q1, Q2, Q4, Q4a)
 * - Phase 2: Question-level similarity calculation (all 36 algorithm questions)
 * - Phase 3: Importance weighting (1-4 scale)
 * - Phase 4: Directional scoring (min of A→B and B→A)
 * - Phase 5: Section weighting (Section 1: 65%, Section 2: 35%)
 * - Phase 6: Pair score construction (min + mean formula)
 * - Phase 7: Eligibility thresholds (minimum score filter)
 * - Phase 8: Blossom preparation (convert to graph format)
 */

import { Responses } from "@/src/lib/questionnaire-types";
import { calculateSimilarity } from "./similarityV2";
import { getAlgorithmQuestions } from "@/app/(dashboard)/questionnaire/_components/questionnaireConfigV2";

// ============================================
// Type Definitions
// ============================================

export interface User {
  id: string;
  name: string;
  responses: Responses;
}

export interface QuestionScore {
  questionId: string;
  similarity: number; // 0.0-1.0
  aImportance: number; // 1-4
  bImportance: number; // 1-4
  weightedScore: number; // After importance weighting
}

export interface PairScore {
  userA: string;
  userB: string;
  questionScores: QuestionScore[];
  section1Score: number; // Weighted section score (65%)
  section2Score: number; // Weighted section score (35%)
  totalScore: number; // Final combined score
  isEligible: boolean; // Passed eligibility threshold
}

export interface BlossomEdge {
  from: string;
  to: string;
  weight: number;
}

export interface MatchingResult {
  eligiblePairs: PairScore[];
  filteredByDealbreaker: { userA: string; userB: string; reason: string }[];
  filteredByThreshold: PairScore[];
  blossomEdges: BlossomEdge[];
}

// ============================================
// Configuration
// ============================================

const SECTION_1_WEIGHT = 0.65; // Lifestyle / Surface Compatibility
const SECTION_2_WEIGHT = 0.35; // Personality / Interaction Style
const ELIGIBILITY_THRESHOLD = 0.4; // Minimum total score (40%) to be eligible

// Section 1: Q1-Q20 (Lifestyle)
const SECTION_1_QUESTIONS = [
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
];

// Section 2: Q21-Q36 (Personality)
const SECTION_2_QUESTIONS = [
  "q21",
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
];

// ============================================
// PHASE 1: Hard Filter Dealbreakers
// ============================================

/**
 * Check if two users pass hard filter criteria
 * Q1: Gender identity
 * Q2: Gender preference
 * Q4: Age
 * Q4a: Age preference (range)
 */
export function passesHardFilters(
  userA: User,
  userB: User
): { passes: boolean; reason?: string } {
  // Q1 & Q2: Gender identity and preference
  const aGender = userA.responses.q1?.ownAnswer as string;
  const bGender = userB.responses.q1?.ownAnswer as string;
  const aGenderPref = userA.responses.q2?.ownAnswer as string[];
  const bGenderPref = userB.responses.q2?.ownAnswer as string[];

  if (!aGender || !bGender || !aGenderPref || !bGenderPref) {
    return { passes: false, reason: "Missing gender/preference data" };
  }

  // Check if A's gender is in B's preference and vice versa
  // Handle "anyone" preference
  const aAcceptsB =
    aGenderPref.includes("anyone") || aGenderPref.includes(bGender);
  const bAcceptsA =
    bGenderPref.includes("anyone") || bGenderPref.includes(aGender);

  if (!aAcceptsB || !bAcceptsA) {
    return { passes: false, reason: "Gender preference mismatch" };
  }

  // Q4 & Q4a: Age and age preference compatibility
  const aAge = parseInt(userA.responses.q4?.ownAnswer as string);
  const bAge = parseInt(userB.responses.q4?.ownAnswer as string);
  const aAgePref = userA.responses.q4a?.ownAnswer as
    | { min: number; max: number }
    | undefined;
  const bAgePref = userB.responses.q4a?.ownAnswer as
    | { min: number; max: number }
    | undefined;

  if (!aAge || !bAge) {
    return { passes: false, reason: "Missing age data" };
  }

  // Check if ages are within each other's preferred ranges
  if (aAgePref) {
    if (bAge < aAgePref.min || bAge > aAgePref.max) {
      return { passes: false, reason: "Age outside A's preferred range" };
    }
  }

  if (bAgePref) {
    if (aAge < bAgePref.min || aAge > bAgePref.max) {
      return { passes: false, reason: "Age outside B's preferred range" };
    }
  }

  return { passes: true };
}

// ============================================
// PHASE 2-4: Question Similarity & Importance Weighting
// ============================================

/**
 * Calculate weighted score for a single question between two users
 * Combines similarity calculation with importance weighting
 */
function calculateQuestionScore(
  questionId: string,
  userA: User,
  userB: User
): QuestionScore | null {
  const aResponse = userA.responses[questionId];
  const bResponse = userB.responses[questionId];

  // Skip if either user hasn't answered
  if (!aResponse?.ownAnswer || !bResponse?.ownAnswer) {
    return null;
  }

  // Calculate base similarity (0.0-1.0)
  const similarity = calculateSimilarity(questionId, aResponse, bResponse);

  // Get importance levels (1-4, default to 3 if not specified)
  const aImportance = aResponse.importance || 3;
  const bImportance = bResponse.importance || 3;

  // Importance weighting: use geometric mean of both importances
  // This ensures both users' importance preferences are respected
  const importanceWeight = Math.sqrt(aImportance * bImportance) / 4; // Normalize to 0-1

  // Weighted score
  const weightedScore = similarity * importanceWeight;

  return {
    questionId,
    similarity,
    aImportance,
    bImportance,
    weightedScore,
  };
}

// ============================================
// PHASE 5-6: Section Weighting & Pair Score Construction
// ============================================

/**
 * Calculate section score from question scores
 * Uses weighted average of question scores
 */
function calculateSectionScore(
  questionScores: QuestionScore[],
  sectionQuestions: string[]
): number {
  const relevantScores = questionScores.filter((qs) =>
    sectionQuestions.includes(qs.questionId)
  );

  if (relevantScores.length === 0) return 0;

  // Weighted average
  const totalWeighted = relevantScores.reduce(
    (sum, qs) => sum + qs.weightedScore,
    0
  );
  return totalWeighted / relevantScores.length;
}

/**
 * Calculate complete pair score between two users
 * Combines section scores with section weights
 */
export function calculatePairScore(userA: User, userB: User): PairScore {
  const algorithmQuestions = getAlgorithmQuestions();
  const questionScores: QuestionScore[] = [];

  // Calculate score for each question
  for (const question of algorithmQuestions) {
    const score = calculateQuestionScore(question.id, userA, userB);
    if (score) {
      questionScores.push(score);
    }
  }

  // Calculate section scores
  const section1Score = calculateSectionScore(
    questionScores,
    SECTION_1_QUESTIONS
  );
  const section2Score = calculateSectionScore(
    questionScores,
    SECTION_2_QUESTIONS
  );

  // Apply section weights (Section 1: 65%, Section 2: 35%)
  const totalScore =
    section1Score * SECTION_1_WEIGHT + section2Score * SECTION_2_WEIGHT;

  // Check eligibility
  const isEligible = totalScore >= ELIGIBILITY_THRESHOLD;

  return {
    userA: userA.id,
    userB: userB.id,
    questionScores,
    section1Score,
    section2Score,
    totalScore,
    isEligible,
  };
}

// ============================================
// PHASE 1-7: Check Question-Level Dealbreakers
// ============================================

/**
 * Check if any question-level dealbreakers prevent this match
 * (Separate from hard filter dealbreakers Q1, Q2, Q4, Q4a)
 */
function passesQuestionDealbreakers(
  userA: User,
  userB: User
): { passes: boolean; reason?: string } {
  const algorithmQuestions = getAlgorithmQuestions();

  for (const question of algorithmQuestions) {
    const aResponse = userA.responses[question.id];
    const bResponse = userB.responses[question.id];

    // Skip hard filters (already checked)
    if (["q1", "q2", "q4", "q4a"].includes(question.id)) continue;

    // Check if A marked this as dealbreaker
    if (
      aResponse?.dealbreaker &&
      aResponse?.ownAnswer &&
      bResponse?.ownAnswer
    ) {
      const similarity = calculateSimilarity(question.id, aResponse, bResponse);

      // Dealbreaker triggered if similarity is too low (< 0.5)
      if (similarity < 0.5) {
        return {
          passes: false,
          reason: `User A dealbreaker on ${question.id} (similarity: ${similarity.toFixed(2)})`,
        };
      }
    }

    // Check if B marked this as dealbreaker
    if (
      bResponse?.dealbreaker &&
      aResponse?.ownAnswer &&
      bResponse?.ownAnswer
    ) {
      const similarity = calculateSimilarity(question.id, aResponse, bResponse);

      if (similarity < 0.5) {
        return {
          passes: false,
          reason: `User B dealbreaker on ${question.id} (similarity: ${similarity.toFixed(2)})`,
        };
      }
    }
  }

  return { passes: true };
}

// ============================================
// PHASE 8: Blossom Algorithm Preparation
// ============================================

/**
 * Convert eligible pairs to Blossom graph format
 * Blossom algorithm expects edges with weights
 */
export function prepareBlossomEdges(eligiblePairs: PairScore[]): BlossomEdge[] {
  return eligiblePairs.map((pair) => ({
    from: pair.userA,
    to: pair.userB,
    // Convert similarity score (0-1) to integer weight for Blossom (0-1000)
    weight: Math.round(pair.totalScore * 1000),
  }));
}

// ============================================
// MAIN MATCHING FUNCTION
// ============================================

/**
 * Run complete matching algorithm
 * Returns eligible pairs and filtered results
 */
export function runMatchingAlgorithm(users: User[]): MatchingResult {
  const eligiblePairs: PairScore[] = [];
  const filteredByDealbreaker: {
    userA: string;
    userB: string;
    reason: string;
  }[] = [];
  const filteredByThreshold: PairScore[] = [];

  console.log(`Running matching algorithm for ${users.length} users...`);

  // Generate all possible pairs
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const userA = users[i];
      const userB = users[j];

      // PHASE 1: Check hard filters (Q1, Q2, Q4, Q4a)
      const hardFilterResult = passesHardFilters(userA, userB);
      if (!hardFilterResult.passes) {
        filteredByDealbreaker.push({
          userA: userA.id,
          userB: userB.id,
          reason: `Hard filter: ${hardFilterResult.reason}`,
        });
        continue;
      }

      // PHASE 1.5: Check question-level dealbreakers
      const dealbreakerResult = passesQuestionDealbreakers(userA, userB);
      if (!dealbreakerResult.passes) {
        filteredByDealbreaker.push({
          userA: userA.id,
          userB: userB.id,
          reason: dealbreakerResult.reason || "Dealbreaker triggered",
        });
        continue;
      }

      // PHASES 2-6: Calculate pair score
      const pairScore = calculatePairScore(userA, userB);

      // PHASE 7: Check eligibility threshold
      if (pairScore.isEligible) {
        eligiblePairs.push(pairScore);
      } else {
        filteredByThreshold.push(pairScore);
      }
    }
  }

  // PHASE 8: Prepare for Blossom algorithm
  const blossomEdges = prepareBlossomEdges(eligiblePairs);

  console.log(`Matching complete:
    - Total pairs evaluated: ${(users.length * (users.length - 1)) / 2}
    - Filtered by dealbreaker: ${filteredByDealbreaker.length}
    - Filtered by threshold: ${filteredByThreshold.length}
    - Eligible pairs: ${eligiblePairs.length}
  `);

  return {
    eligiblePairs,
    filteredByDealbreaker,
    filteredByThreshold,
    blossomEdges,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get top N matches for a specific user
 */
export function getTopMatches(
  userId: string,
  eligiblePairs: PairScore[],
  limit: number = 10
): PairScore[] {
  const userPairs = eligiblePairs
    .filter((pair) => pair.userA === userId || pair.userB === userId)
    .sort((a, b) => b.totalScore - a.totalScore);

  return userPairs.slice(0, limit);
}

/**
 * Get detailed breakdown of scores for a specific pair
 */
export function getPairBreakdown(
  userA: string,
  userB: string,
  eligiblePairs: PairScore[]
): PairScore | undefined {
  return eligiblePairs.find(
    (pair) =>
      (pair.userA === userA && pair.userB === userB) ||
      (pair.userA === userB && pair.userB === userA)
  );
}

/**
 * Calculate statistics for the matching results
 */
export function calculateMatchingStats(result: MatchingResult) {
  const { eligiblePairs, filteredByDealbreaker, filteredByThreshold } = result;

  const scores = eligiblePairs.map((p) => p.totalScore);
  const avgScore =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;

  return {
    totalPairsEvaluated:
      eligiblePairs.length +
      filteredByDealbreaker.length +
      filteredByThreshold.length,
    eligiblePairs: eligiblePairs.length,
    filteredByDealbreaker: filteredByDealbreaker.length,
    filteredByThreshold: filteredByThreshold.length,
    averageScore: avgScore,
    maxScore,
    minScore,
    dealbreakerReasons: getDealbreakerReasonCounts(filteredByDealbreaker),
  };
}

/**
 * Get counts of dealbreaker reasons
 */
function getDealbreakerReasonCounts(
  filtered: { userA: string; userB: string; reason: string }[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const item of filtered) {
    // Extract the main reason (before parentheses if any)
    const mainReason = item.reason.split("(")[0].trim();
    counts[mainReason] = (counts[mainReason] || 0) + 1;
  }

  return counts;
}

/**
 * Validate that all users have required responses
 */
export function validateUsersForMatching(users: User[]): {
  valid: User[];
  invalid: { userId: string; reason: string }[];
} {
  const valid: User[] = [];
  const invalid: { userId: string; reason: string }[] = [];

  for (const user of users) {
    // Check for hard filter questions
    if (!user.responses.q1?.ownAnswer) {
      invalid.push({ userId: user.id, reason: "Missing Q1 (gender identity)" });
      continue;
    }
    if (!user.responses.q2?.ownAnswer) {
      invalid.push({
        userId: user.id,
        reason: "Missing Q2 (gender preference)",
      });
      continue;
    }
    if (!user.responses.q4?.ownAnswer) {
      invalid.push({ userId: user.id, reason: "Missing Q4 (age)" });
      continue;
    }
    if (!user.responses.q4a?.ownAnswer) {
      invalid.push({ userId: user.id, reason: "Missing Q4a (age preference)" });
      continue;
    }

    // Check that they have answered a reasonable number of questions
    const answeredCount = Object.keys(user.responses).filter(
      (key) => user.responses[key]?.ownAnswer !== undefined
    ).length;

    if (answeredCount < 30) {
      invalid.push({
        userId: user.id,
        reason: `Insufficient responses (${answeredCount}/36)`,
      });
      continue;
    }

    valid.push(user);
  }

  return { valid, invalid };
}
