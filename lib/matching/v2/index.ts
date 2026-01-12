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

export interface MatchingPipelineResult {
  matches: MatchingResult["matched"];
  unmatched: MatchingResult["unmatched"];
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
  config: MatchingConfig = DEFAULT_CONFIG
): MatchingPipelineResult {
  const startTime = Date.now();

  // Validate input
  if (users.length === 0) {
    return {
      matches: [],
      unmatched: [],
      diagnostics: createEmptyDiagnostics(0),
    };
  }

  // Ensure all users have required fields for hard filters
  // Extract gender and interestedInGenders from responses if not present
  const processedUsers = users.map((user) => {
    if (!user.gender && user.responses.q1) {
      user.gender = user.responses.q1.answer as string;
    }
    if (!user.interestedInGenders && user.responses.q2) {
      const q2Answer = user.responses.q2.answer;
      user.interestedInGenders = Array.isArray(q2Answer)
        ? q2Answer
        : [q2Answer];
    }
    return user;
  });

  // Track diagnostics
  const dealbreakers: {
    userAId: string;
    userBId: string;
    questionId: string;
  }[] = [];
  const pairScores: { userAId: string; userBId: string; score: number }[] = [];
  const eligiblePairs: EligiblePair[] = [];

  // Phase 1-7: Calculate scores for all pairs
  for (let i = 0; i < processedUsers.length; i++) {
    for (let j = i + 1; j < processedUsers.length; j++) {
      const userA = processedUsers[i];
      const userB = processedUsers[j];

      // Phase 1: Hard Filters
      const hardFilterResult = checkHardFilters(userA, userB, config);
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
          });
        }
        continue;
      }

      // Phase 2-6: Calculate pair score
      const scoreAtoB = calculateDirectionalScoreComplete(userA, userB, config);
      const scoreBtoA = calculateDirectionalScoreComplete(userB, userA, config);

      const pairScoreResult = calculatePairScore(
        scoreAtoB,
        scoreBtoA,
        userA,
        userB,
        config
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
  let failedAbsolute = 0;
  let failedRelativeA = 0;
  let failedRelativeB = 0;

  for (const pairScore of pairScores) {
    const userA = processedUsers.find((u) => u.id === pairScore.userAId)!;
    const userB = processedUsers.find((u) => u.id === pairScore.userBId)!;

    const scoreAtoB = calculateDirectionalScoreComplete(userA, userB, config);
    const scoreBtoA = calculateDirectionalScoreComplete(userB, userA, config);

    const eligibility = checkEligibility(
      userA.id,
      userB.id,
      scoreAtoB,
      scoreBtoA,
      pairScore.score,
      pairScores,
      config
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
      if (!eligibility.passedRelativeThresholdA) failedRelativeA++;
      if (!eligibility.passedRelativeThresholdB) failedRelativeB++;
    }
  }

  // Identify perfectionists (users who rejected everyone)
  const perfectionists: string[] = [];
  for (const user of processedUsers) {
    const userEligiblePairs = eligiblePairs.filter(
      (p) => p.userAId === user.id || p.userBId === user.id
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
    pairScores.map((p) => p.score)
  );

  // Calculate average raw score
  const averageRawScore =
    pairScores.length > 0
      ? pairScores.reduce((sum, p) => sum + p.score, 0) / pairScores.length
      : 0;

  const executionTimeMs = Date.now() - startTime;

  return {
    matches: matchingResult.matched,
    unmatched: matchingResult.unmatched,
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
      phase8_averageMatchScore: matchingResult.stats.averagePairScore,
      phase8_medianMatchScore: matchingResult.stats.medianPairScore,
      phase8_minMatchScore: matchingResult.stats.minPairScore,
      phase8_maxMatchScore: matchingResult.stats.maxPairScore,

      executionTimeMs,

      scoreDistribution,
    },
  };
}

/**
 * Calculate complete directional score (Phases 2-5).
 * This runs similarity, importance, directional scoring, and section weighting.
 */
function calculateDirectionalScoreComplete(
  userA: MatchingUser,
  userB: MatchingUser,
  config: MatchingConfig
): number {
  // Get all question IDs from userA's responses
  const questionIds = Object.keys(userA.responses);

  // Calculate similarity for each question (Phase 2)
  const similarities: Record<string, number> = {};
  for (const qid of questionIds) {
    similarities[qid] = calculateSimilarity(qid, userA, userB, config);
  }

  // Apply importance weighting (Phase 3)
  const weighted = applyImportanceWeighting(userA, similarities, config);

  // Calculate directional score (Phase 4)
  const directionalScore = calculateDirectionalScore(
    weighted.weightedScores,
    weighted.weights
  );

  // Apply section weighting (Phase 5)
  const sectionResult = applySectionWeighting(
    directionalScore.weightedScores,
    config
  );

  return sectionResult.totalScore;
}

/**
 * Calculate score distribution for diagnostics.
 */
function calculateScoreDistribution(
  scores: number[]
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
