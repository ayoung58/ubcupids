/**
 * Matching Algorithm V2.2 - Main Orchestrator
 *
 * This file orchestrates all 8 phases of the matching algorithm:
 * 1. Hard Filtering (dealbreakers)
 * 2. Similarity Calculation (per-question compatibility)
 * 3. Importance Weighting (user-defined preference strength)
 * 4. Directional Scoring (how well B satisfies A)
 * 5. Section Weighting (lifestyle 65%, personality 35%)
 * 6. Pair Score Construction (mutuality with asymmetry penalty)
 * 7. Eligibility Thresholding (quality gate)
 * 8. Global Matching (Blossom algorithm)
 */

import { MatchingUser } from "./types";
import { checkHardFilters, HardFilterResult } from "./hard-filters";
import { calculateSimilarity } from "./similarity";
import { applyImportanceWeighting } from "./importance";
import { calculateDirectionalScore } from "./directional";
import { applySectionWeighting } from "./section-weighting";
import { calculatePairScore } from "./pair-score";
import { checkEligibility } from "./eligibility";
import {
  runGlobalMatching,
  EligiblePair,
  MatchingResult,
} from "./blossom-matching";
import { MatchingConfig, DEFAULT_CONFIG } from "./config";

/**
 * Normalizes gender values to handle inconsistencies between Q1 and Q2
 * Q1 (Gender Identity) uses: "man", "woman", "non-binary", "genderqueer"
 * Q2 (Gender Preference) uses: "men", "women", "non_binary", "genderqueer"
 *
 * We normalize to Q2's format (plural/underscore) for consistency
 *
 * @param gender - Raw gender value from questionnaire
 * @returns Normalized gender value
 */
function normalizeGenderValue(gender: string): string {
  // Normalize singular to plural
  if (gender === "man") return "men";
  if (gender === "woman") return "women";

  // Normalize hyphen to underscore
  if (gender === "non-binary") return "non_binary";

  return gender;
}

/**
 * Converts importance level string to numeric weight
 * Maps questionnaire importance strings to numeric values for scoring
 * Per V2.2 spec: NOT=0, SOMEWHAT=0.5, IMPORTANT=1.0, VERY=2.0
 *
 * @param importance - Importance string from questionnaire response
 * @param config - Matching configuration
 * @returns Numeric importance value per spec
 */
function getImportanceWeight(
  importance: string | number | undefined,
  config: MatchingConfig = DEFAULT_CONFIG,
): number {
  if (typeof importance === "number") return importance;
  if (!importance) return config.IMPORTANCE_WEIGHTS.SOMEWHAT_IMPORTANT; // Default to somewhat important

  const weights = config.IMPORTANCE_WEIGHTS;

  // Normalize to uppercase to handle both uppercase and lowercase values
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
 * Determines the similarity calculation type for a question
 * Used to identify directional questions for Phase 4 scoring
 */
function determineQuestionType(
  questionId: string,
):
  | "numeric"
  | "ordinal"
  | "categorical-same"
  | "categorical-multi"
  | "multi-select"
  | "age"
  | "same-similar-different"
  | "directional"
  | "binary" {
  // Map question IDs to their types (only need directional for now)
  const typeMap: Record<string, any> = {
    q10: "directional", // Exercise - directional preference
  };

  return typeMap[questionId] || "numeric"; // Default fallback
}

export interface MatchingPipelineResult {
  matches: MatchingResult["matched"];
  unmatched: MatchingResult["unmatched"];
  eligiblePairs: EligiblePair[];
  diagnostics: PipelineDiagnostics;
}

export interface PipelineDiagnostics {
  totalUsers: number;

  // Phase 1: Hard Filters
  phase1_filteredPairs: number;
  phase1_dealbreakers: {
    userAId: string;
    userBId: string;
    questionId: string;
    reason?: string;
  }[];

  // Phase 2-6: Scoring
  phase2to6_pairScoresCalculated: number;
  phase2to6_averageRawScore: number;

  // Phase 7: Eligibility
  phase7_eligiblePairs: number;
  phase7_failedAbsolute: number;
  phase7_failedRelativeA: number;
  phase7_failedRelativeB: number;
  phase7_perfectionists: string[]; // Users who rejected everyone

  // Phase 8: Global Matching
  phase8_matchesCreated: number;
  phase8_unmatchedUsers: number;
  phase8_averageMatchScore: number;
  phase8_medianMatchScore: number;
  phase8_minMatchScore: number;
  phase8_maxMatchScore: number;

  // Performance
  executionTimeMs: number;

  // Score Distribution
  scoreDistribution: {
    range: string;
    count: number;
  }[];
}

/**
 * Run the complete matching pipeline for a set of users.
 *
 * @param users - Users to match (must have questionnaire responses)
 * @param config - Optional configuration overrides
 * @returns Matching results and diagnostics
 */
export function runMatchingPipeline(
  users: MatchingUser[],
  config: MatchingConfig = DEFAULT_CONFIG,
): MatchingPipelineResult {
  const startTime = Date.now();

  // Validate input
  if (users.length === 0) {
    return {
      matches: [],
      unmatched: [],
      eligiblePairs: [],
      diagnostics: createEmptyDiagnostics(0),
    };
  }

  // Ensure all users have required fields for hard filters
  // Extract gender and interestedInGenders from responses if not present
  const processedUsers = users.map((user) => {
    if (!user.gender && user.responses.q1) {
      user.gender = normalizeGenderValue(user.responses.q1.answer as string);
    }
    if (!user.interestedInGenders && user.responses.q2) {
      const q2Answer = user.responses.q2.answer;
      const genderPrefs = Array.isArray(q2Answer) ? q2Answer : [q2Answer];
      user.interestedInGenders = genderPrefs.map(normalizeGenderValue);
    } else if (user.interestedInGenders) {
      // Normalize existing gender preferences
      user.interestedInGenders =
        user.interestedInGenders.map(normalizeGenderValue);
    }

    // Normalize gender if already set
    if (user.gender) {
      user.gender = normalizeGenderValue(user.gender);
    }

    return user;
  });

  // Track diagnostics
  const dealbreakers: {
    userAId: string;
    userBId: string;
    questionId: string;
    reason?: string;
  }[] = [];
  const pairScores: { userAId: string; userBId: string; score: number }[] = [];
  const eligiblePairs: EligiblePair[] = [];

  // Phase 1-7: Calculate scores for all pairs
  for (let i = 0; i < processedUsers.length; i++) {
    for (let j = i + 1; j < processedUsers.length; j++) {
      const userA = processedUsers[i];
      const userB = processedUsers[j];

      // Phase 1: Hard Filters
      const hardFilterResult = checkHardFilters(userA, userB);
      if (!hardFilterResult.passed) {
        // Record dealbreaker for diagnostics
        if (
          hardFilterResult.failedQuestions &&
          hardFilterResult.failedQuestions.length > 0
        ) {
          dealbreakers.push({
            userAId: userA.id,
            userBId: userB.id,
            questionId: hardFilterResult.failedQuestions[0], // Just record first one
            reason: hardFilterResult.reason,
          });
        }
        continue;
      }

      // Phase 2-6: Calculate pair score
      const scoreAtoB = calculateDirectionalScoreComplete(userA, userB, config);
      const scoreBtoA = calculateDirectionalScoreComplete(userB, userA, config);

      // For now, pass empty question scores (we'd need to collect these from similarity calc)
      const pairScoreResult = calculatePairScore(
        scoreAtoB,
        scoreBtoA,
        {}, // questionScores - TODO: collect from similarity calculations
        config,
      );

      pairScores.push({
        userAId: userA.id,
        userBId: userB.id,
        score: pairScoreResult.pairScore,
      });

      // Phase 7: Eligibility Thresholding
      // Note: We need all pair scores first to determine best scores
      // So we'll do this in a second pass
    }
  }

  // Second pass: Phase 7 - Eligibility Thresholding
  // First, find best scores for each user
  const bestScoresMap = new Map<string, number>();
  for (const pairScore of pairScores) {
    // Update best score for userA
    const currentBestA = bestScoresMap.get(pairScore.userAId) || 0;
    if (pairScore.score > currentBestA) {
      bestScoresMap.set(pairScore.userAId, pairScore.score);
    }
    // Update best score for userB
    const currentBestB = bestScoresMap.get(pairScore.userBId) || 0;
    if (pairScore.score > currentBestB) {
      bestScoresMap.set(pairScore.userBId, pairScore.score);
    }
  }

  let failedAbsolute = 0;
  let failedRelativeA = 0;
  let failedRelativeB = 0;

  for (const pairScore of pairScores) {
    const userA = processedUsers.find((u) => u.id === pairScore.userAId)!;
    const userB = processedUsers.find((u) => u.id === pairScore.userBId)!;

    const scoreAtoB = calculateDirectionalScoreComplete(userA, userB, config);
    const scoreBtoA = calculateDirectionalScoreComplete(userB, userA, config);

    const userABestScore =
      bestScoresMap.get(pairScore.userAId) || pairScore.score;
    const userBBestScore =
      bestScoresMap.get(pairScore.userBId) || pairScore.score;

    const eligibility = checkEligibility(
      pairScore.score,
      scoreAtoB,
      scoreBtoA,
      userABestScore,
      userBBestScore,
      config,
    );

    if (eligibility.isEligible) {
      eligiblePairs.push({
        userAId: pairScore.userAId,
        userBId: pairScore.userBId,
        pairScore: pairScore.score,
        scoreAtoB,
        scoreBtoA,
      });
    } else {
      // Track failure reasons
      if (!eligibility.passedAbsoluteThreshold) failedAbsolute++;
      if (!eligibility.passedUserARelativeThreshold) failedRelativeA++;
      if (!eligibility.passedUserBRelativeThreshold) failedRelativeB++;
    }
  }

  // Identify perfectionists (users who rejected everyone)
  const perfectionists: string[] = [];
  for (const user of processedUsers) {
    const userEligiblePairs = eligiblePairs.filter(
      (p) => p.userAId === user.id || p.userBId === user.id,
    );
    if (
      userEligiblePairs.length === 0 &&
      pairScores.some((p) => p.userAId === user.id || p.userBId === user.id)
    ) {
      perfectionists.push(user.id);
    }
  }

  // Phase 8: Global Matching
  const matchingResult = runGlobalMatching(processedUsers, eligiblePairs);

  // Calculate score distribution
  const scoreDistribution = calculateScoreDistribution(
    pairScores.map((p) => p.score),
  );

  // Calculate average raw score
  const averageRawScore =
    pairScores.length > 0
      ? pairScores.reduce((sum, p) => sum + p.score, 0) / pairScores.length
      : 0;

  // Calculate statistics from eligible pairs (Phase 7) instead of only final matches
  // This gives a better view of overall compatibility in the pool
  const eligiblePairScores = eligiblePairs
    .map((p) => p.pairScore)
    .sort((a, b) => a - b);
  const eligiblePairStats =
    eligiblePairScores.length > 0
      ? {
          average:
            eligiblePairScores.reduce((sum, s) => sum + s, 0) /
            eligiblePairScores.length,
          median: eligiblePairScores[Math.floor(eligiblePairScores.length / 2)],
          min: eligiblePairScores[0],
          max: eligiblePairScores[eligiblePairScores.length - 1],
        }
      : {
          average: 0,
          median: 0,
          min: 0,
          max: 0,
        };

  const executionTimeMs = Date.now() - startTime;

  return {
    matches: matchingResult.matched,
    unmatched: matchingResult.unmatched,
    eligiblePairs, // Include eligible pairs for compatibility score saving
    diagnostics: {
      totalUsers: processedUsers.length,

      phase1_filteredPairs: dealbreakers.length,
      phase1_dealbreakers: dealbreakers,

      phase2to6_pairScoresCalculated: pairScores.length,
      phase2to6_averageRawScore: averageRawScore,

      phase7_eligiblePairs: eligiblePairs.length,
      phase7_failedAbsolute: failedAbsolute,
      phase7_failedRelativeA: failedRelativeA,
      phase7_failedRelativeB: failedRelativeB,
      phase7_perfectionists: perfectionists,

      phase8_matchesCreated: matchingResult.stats.matchesCreated,
      phase8_unmatchedUsers: matchingResult.stats.unmatchedUsers,
      // Use eligible pair statistics instead of final match statistics
      phase8_averageMatchScore: eligiblePairStats.average,
      phase8_medianMatchScore: eligiblePairStats.median,
      phase8_minMatchScore: eligiblePairStats.min,
      phase8_maxMatchScore: eligiblePairStats.max,

      executionTimeMs,

      scoreDistribution,
    },
  };
}

/**
 * Calculate complete directional score (Phases 2-5).
 * This runs similarity, importance, directional scoring, and section weighting.
 * Returns a single score from 0-100.
 */
export function calculateDirectionalScoreComplete(
  userA: MatchingUser,
  userB: MatchingUser,
  config: MatchingConfig,
): number {
  // Phase 2: Calculate raw similarities for all questions
  const similarities = calculateSimilarity(userA, userB, config);

  const questionIds = Object.keys(similarities);
  if (questionIds.length === 0) return 0;

  // Phase 3: Apply importance weighting (average both users' importance)
  // Phase 4: Apply directional scoring for directional questions (e.g., Q10 exercise)
  // Separate questions by section
  const lifestyleQuestions = [
    "q1",
    "q2",
    "q3",
    "q4",
    "q5",
    "q6",
    "q7",
    "q8",
    "q9a",
    "q9b",
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

  let lifestyleScore = 0;
  let lifestyleWeightSum = 0;
  let personalityScore = 0;
  let personalityWeightSum = 0;

  // Hard filter questions that should be excluded from scoring
  const HARD_FILTER_QUESTIONS = ["q1", "q2", "q4"];

  questionIds.forEach((qid) => {
    // Skip hard filter questions - they're used for filtering, not scoring
    if (HARD_FILTER_QUESTIONS.includes(qid)) {
      return;
    }

    const rawSim = similarities[qid];

    // Get importance from both users (Phase 3)
    const importanceAStr = userA.responses[qid]?.importance;
    const importanceBStr = userB.responses[qid]?.importance;
    const importanceA = getImportanceWeight(importanceAStr, config);
    const importanceB = getImportanceWeight(importanceBStr, config);

    // Apply importance weighting: each user weights the similarity by their importance
    // Then average the weighted scores (same pattern as applyImportanceWeighting)
    const userAWeighted = rawSim * importanceA;
    const userBWeighted = rawSim * importanceB;
    const importanceWeightedSim = (userAWeighted + userBWeighted) / 2;

    // Calculate average importance for section weighting
    const avgImportance = (importanceA + importanceB) / 2;

    // Skip questions with zero weighted similarity
    if (importanceWeightedSim === 0) {
      return;
    }

    // Phase 4: Apply directional scoring if this is a directional question
    let finalQuestionScore = importanceWeightedSim;

    // Check if this question has directional preferences (currently only Q10)
    const questionType = determineQuestionType(qid);
    if (questionType === "directional") {
      // Get answers and preferences for directional scoring
      const userAAnswer = userA.responses[qid]?.answer;
      const userBAnswer = userB.responses[qid]?.answer;
      const userAPreference = userA.responses[qid]?.preference as
        | "more"
        | "less"
        | "similar"
        | "same"
        | undefined;
      const userBPreference = userB.responses[qid]?.preference as
        | "more"
        | "less"
        | "similar"
        | "same"
        | undefined;

      // Only apply directional scoring if we have numeric answers
      if (typeof userAAnswer === "number" && typeof userBAnswer === "number") {
        finalQuestionScore = calculateDirectionalScore(
          userAAnswer,
          userBAnswer,
          userAPreference,
          userBPreference,
          importanceWeightedSim,
          config,
        );
      }
    }

    if (lifestyleQuestions.includes(qid)) {
      lifestyleScore += finalQuestionScore;
      lifestyleWeightSum += avgImportance;
    } else {
      personalityScore += finalQuestionScore;
      personalityWeightSum += avgImportance;
    }
  });

  // Calculate weighted average scores per section (divide by sum of weights, not count)
  const avgLifestyle =
    lifestyleWeightSum > 0 ? lifestyleScore / lifestyleWeightSum : 0;
  const avgPersonality =
    personalityWeightSum > 0 ? personalityScore / personalityWeightSum : 0;

  // Phase 5: Apply section weighting (65% lifestyle, 35% personality)
  const weightedTotal =
    avgLifestyle * config.SECTION_WEIGHTS.LIFESTYLE +
    avgPersonality * config.SECTION_WEIGHTS.PERSONALITY;

  // Scale to 0-100 (avgLifestyle and avgPersonality are already in [0,1] range)
  return weightedTotal * 100;
}

/**
 * Calculate score distribution for diagnostics.
 */
function calculateScoreDistribution(
  scores: number[],
): { range: string; count: number }[] {
  const ranges = [
    { range: "0-20", min: 0, max: 20, count: 0 },
    { range: "20-40", min: 20, max: 40, count: 0 },
    { range: "40-60", min: 40, max: 60, count: 0 },
    { range: "60-80", min: 60, max: 80, count: 0 },
    { range: "80-100", min: 80, max: 100, count: 0 },
  ];

  for (const score of scores) {
    for (const range of ranges) {
      if (score >= range.min && score < range.max) {
        range.count++;
        break;
      } else if (score === 100 && range.max === 100) {
        range.count++;
        break;
      }
    }
  }

  return ranges.map((r) => ({ range: r.range, count: r.count }));
}

/**
 * Create empty diagnostics object.
 */
function createEmptyDiagnostics(totalUsers: number): PipelineDiagnostics {
  return {
    totalUsers,
    phase1_filteredPairs: 0,
    phase1_dealbreakers: [],
    phase2to6_pairScoresCalculated: 0,
    phase2to6_averageRawScore: 0,
    phase7_eligiblePairs: 0,
    phase7_failedAbsolute: 0,
    phase7_failedRelativeA: 0,
    phase7_failedRelativeB: 0,
    phase7_perfectionists: [],
    phase8_matchesCreated: 0,
    phase8_unmatchedUsers: totalUsers,
    phase8_averageMatchScore: 0,
    phase8_medianMatchScore: 0,
    phase8_minMatchScore: 0,
    phase8_maxMatchScore: 0,
    executionTimeMs: 0,
    scoreDistribution: [],
  };
}

export * from "./types";
export * from "./config";
export * from "./hard-filters";
export * from "./similarity";
export * from "./importance";
export * from "./directional";
export * from "./section-weighting";
export * from "./pair-score";
export * from "./eligibility";
export * from "./blossom-matching";
