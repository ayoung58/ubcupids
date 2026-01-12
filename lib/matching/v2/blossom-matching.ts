/**
 * Phase 8: Global Matching with Blossom Algorithm
 *
 * Implements maximum-weight perfect matching to find globally optimal pairings.
 * Uses the Blossom algorithm to ensure that no two matches could swap and both be happier.
 *
 * Per V2.2 spec:
 * - Nodes: users who passed Phase 7 eligibility checks
 * - Edges: eligible pairs (weight = pair_score)
 * - Algorithm: Maximum Weight Matching (Blossom)
 * - Naturally supports unmatched users (odd number or no eligible pairs)
 */

import Blossom from "edmonds-blossom";
import { MatchingUser } from "./types";

export interface EligiblePair {
  userAId: string;
  userBId: string;
  pairScore: number;
  scoreAtoB: number;
  scoreBtoA: number;
}

export interface MatchingResult {
  matched: MatchPair[];
  unmatched: UnmatchedUser[];
  stats: MatchingStats;
}

export interface MatchPair {
  userAId: string;
  userBId: string;
  pairScore: number;
  scoreAtoB: number;
  scoreBtoA: number;
}

export interface UnmatchedUser {
  userId: string;
  reason: string;
  bestPossibleScore?: number;
  bestPossibleMatchId?: string;
}

export interface MatchingStats {
  totalUsers: number;
  eligiblePairs: number;
  matchesCreated: number;
  unmatchedUsers: number;
  averagePairScore: number;
  medianPairScore: number;
  minPairScore: number;
  maxPairScore: number;
}

/**
 * Run global matching algorithm using Blossom maximum-weight perfect matching.
 *
 * @param users - All users in the matching pool
 * @param eligiblePairs - Pairs that passed Phase 7 eligibility thresholds
 * @returns Matching results with matched pairs, unmatched users, and statistics
 */
export function runGlobalMatching(
  users: MatchingUser[],
  eligiblePairs: EligiblePair[]
): MatchingResult {
  // Handle edge cases
  if (users.length === 0) {
    return {
      matched: [],
      unmatched: [],
      stats: createEmptyStats(),
    };
  }

  if (eligiblePairs.length === 0) {
    return {
      matched: [],
      unmatched: users.map((user) => ({
        userId: user.id,
        reason: "No eligible pairs found",
      })),
      stats: {
        totalUsers: users.length,
        eligiblePairs: 0,
        matchesCreated: 0,
        unmatchedUsers: users.length,
        averagePairScore: 0,
        medianPairScore: 0,
        minPairScore: 0,
        maxPairScore: 0,
      },
    };
  }

  // Build user index mapping (userId -> numeric index)
  const userIds = users.map((u) => u.id);
  const userIdToIndex = new Map<string, number>();
  userIds.forEach((id, index) => {
    userIdToIndex.set(id, index);
  });

  // Build edges for Blossom algorithm
  // Edges are [indexA, indexB, weight] tuples
  // Weight is scaled to integers (Blossom expects integer weights)
  const WEIGHT_SCALE = 1000; // Scale 0-100 scores to 0-100000
  const edges: [number, number, number][] = eligiblePairs.map((pair) => {
    const indexA = userIdToIndex.get(pair.userAId)!;
    const indexB = userIdToIndex.get(pair.userBId)!;
    const weight = Math.round(pair.pairScore * WEIGHT_SCALE);
    return [indexA, indexB, weight];
  });

  // Run Blossom algorithm
  // Returns array where result[i] = j means user i is matched with user j
  // result[i] = -1 means user i is unmatched
  const matching = Blossom(edges, true); // true = maximum weight matching

  // Convert Blossom result to match pairs
  const matched: MatchPair[] = [];
  const matchedUserIds = new Set<string>();

  for (let i = 0; i < matching.length; i++) {
    const j = matching[i];

    // Skip unmatched users
    if (j === -1) continue;

    // Only process each pair once (i < j)
    if (i >= j) continue;

    const userAId = userIds[i];
    const userBId = userIds[j];

    // Find the original pair data
    const pairData = eligiblePairs.find(
      (p) =>
        (p.userAId === userAId && p.userBId === userBId) ||
        (p.userAId === userBId && p.userBId === userAId)
    );

    if (pairData) {
      // Normalize order (ensure A is always the lower ID alphabetically)
      const [userA, userB] =
        userAId < userBId ? [userAId, userBId] : [userBId, userAId];

      const scoreAtoB =
        pairData.userAId === userA ? pairData.scoreAtoB : pairData.scoreBtoA;
      const scoreBtoA =
        pairData.userAId === userA ? pairData.scoreBtoA : pairData.scoreAtoB;

      matched.push({
        userAId: userA,
        userBId: userB,
        pairScore: pairData.pairScore,
        scoreAtoB,
        scoreBtoA,
      });

      matchedUserIds.add(userA);
      matchedUserIds.add(userB);
    }
  }

  // Identify unmatched users and determine reasons
  const unmatched: UnmatchedUser[] = [];

  for (const user of users) {
    if (matchedUserIds.has(user.id)) continue;

    // Find this user's best possible score
    const userPairs = eligiblePairs.filter(
      (p) => p.userAId === user.id || p.userBId === user.id
    );

    if (userPairs.length === 0) {
      unmatched.push({
        userId: user.id,
        reason: "No eligible pairs (failed Phase 7 thresholds)",
      });
    } else {
      // Find best possible score
      let bestScore = 0;
      let bestMatchId = "";

      for (const pair of userPairs) {
        if (pair.pairScore > bestScore) {
          bestScore = pair.pairScore;
          bestMatchId = pair.userAId === user.id ? pair.userBId : pair.userAId;
        }
      }

      // Check if best match was matched with someone else
      const bestMatchIsMatched = matchedUserIds.has(bestMatchId);

      unmatched.push({
        userId: user.id,
        reason: bestMatchIsMatched
          ? "Best match was paired with someone else (globally suboptimal to match)"
          : "Odd number of users with eligible pairs",
        bestPossibleScore: bestScore,
        bestPossibleMatchId: bestMatchId,
      });
    }
  }

  // Calculate statistics
  const stats = calculateStats(users.length, eligiblePairs.length, matched);

  return {
    matched,
    unmatched,
    stats,
  };
}

/**
 * Calculate matching statistics.
 */
function calculateStats(
  totalUsers: number,
  eligiblePairs: number,
  matched: MatchPair[]
): MatchingStats {
  if (matched.length === 0) {
    return {
      totalUsers,
      eligiblePairs,
      matchesCreated: 0,
      unmatchedUsers: totalUsers,
      averagePairScore: 0,
      medianPairScore: 0,
      minPairScore: 0,
      maxPairScore: 0,
    };
  }

  const scores = matched.map((m) => m.pairScore).sort((a, b) => a - b);
  const sum = scores.reduce((acc, s) => acc + s, 0);

  return {
    totalUsers,
    eligiblePairs,
    matchesCreated: matched.length,
    unmatchedUsers: totalUsers - matched.length * 2,
    averagePairScore: sum / matched.length,
    medianPairScore: scores[Math.floor(scores.length / 2)],
    minPairScore: scores[0],
    maxPairScore: scores[scores.length - 1],
  };
}

/**
 * Create empty statistics object.
 */
function createEmptyStats(): MatchingStats {
  return {
    totalUsers: 0,
    eligiblePairs: 0,
    matchesCreated: 0,
    unmatchedUsers: 0,
    averagePairScore: 0,
    medianPairScore: 0,
    minPairScore: 0,
    maxPairScore: 0,
  };
}

/**
 * Validate that matching is valid (no duplicate assignments, mutual pairs).
 */
export function validateMatching(matched: MatchPair[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const usedUserIds = new Set<string>();

  for (const pair of matched) {
    // Check for duplicate user assignments
    if (usedUserIds.has(pair.userAId)) {
      errors.push(`User ${pair.userAId} appears in multiple matches`);
    }
    if (usedUserIds.has(pair.userBId)) {
      errors.push(`User ${pair.userBId} appears in multiple matches`);
    }

    usedUserIds.add(pair.userAId);
    usedUserIds.add(pair.userBId);

    // Check for self-matches
    if (pair.userAId === pair.userBId) {
      errors.push(`User ${pair.userAId} is matched with themselves`);
    }

    // Check score validity
    if (pair.pairScore < 0 || pair.pairScore > 100) {
      errors.push(
        `Invalid pair score ${pair.pairScore} for ${pair.userAId}-${pair.userBId}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
