/**
 * Matching Algorithm
 *
 * Implements the greedy matching algorithm for UBCupids.
 *
 * Algorithm Overview:
 * 1. Load all eligible users (completed questionnaire, isBeingMatched=true)
 * 2. Apply hard filters (gender preferences)
 * 3. Calculate bidirectional compatibility scores for all pairs
 * 4. Run greedy matching to assign 3 matches per user
 * 5. Store matches in database
 *
 * The greedy algorithm prioritizes higher-scoring pairs first,
 * ensuring the best matches are made before capacity is filled.
 */

import { prisma } from "../prisma";
import { decryptJSON } from "../encryption";
import {
  ALGORITHM_MATCHES_PER_USER,
  MINIMUM_MATCH_SCORE,
  SCORING_BATCH_SIZE,
  CURRENT_BATCH,
  DEBUG_SCORING,
  TEST_MODE_REVEAL,
} from "./config";
import {
  DecryptedResponses,
  DecryptedImportance,
  ScoredPair,
  AlgorithmMatch,
  MatchingResult,
  UserForScoring,
} from "./types";
import { calculateBidirectionalCompatibility } from "./scoring";
import { checkAllFilters } from "./filters";
import { calculateTextSimilarities } from "./ai";

// ===========================================
// USER LOADING
// ===========================================

/**
 * Load all users eligible for matching
 *
 * Eligibility criteria:
 * - Email verified
 * - Questionnaire submitted
 * - isBeingMatched = true
 * - Has age set
 */
export async function loadEligibleUsers(): Promise<UserForScoring[]> {
  const users = await prisma.user.findMany({
    where: {
      emailVerified: { not: null },
      isBeingMatched: true,
      age: { not: null },
      questionnaireResponse: {
        isSubmitted: true,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      age: true,
      questionnaireResponse: {
        select: {
          responses: true,
          importance: true,
        },
      },
    },
  });

  const eligibleUsers: UserForScoring[] = [];

  for (const user of users) {
    if (!user.questionnaireResponse || !user.age) continue;

    try {
      // Decrypt questionnaire responses
      const responses = decryptJSON<DecryptedResponses>(
        user.questionnaireResponse.responses
      );

      // Decrypt importance ratings (may be null)
      const importance = user.questionnaireResponse.importance
        ? decryptJSON<DecryptedImportance>(
            user.questionnaireResponse.importance
          )
        : {};

      eligibleUsers.push({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        responses,
        importance,
      });
    } catch (error) {
      console.error(`Error decrypting responses for user ${user.id}:`, error);
    }
  }

  console.log(`Loaded ${eligibleUsers.length} eligible users for matching`);
  return eligibleUsers;
}

// ===========================================
// PAIR SCORING
// ===========================================

/**
 * Generate all possible pairs from users
 */
function generatePairs(
  users: UserForScoring[]
): Array<[UserForScoring, UserForScoring]> {
  const pairs: Array<[UserForScoring, UserForScoring]> = [];

  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      pairs.push([users[i], users[j]]);
    }
  }

  return pairs;
}

/**
 * Score all eligible pairs
 *
 * Returns pairs that pass filters with their bidirectional scores
 */
export async function scoreAllPairs(
  users: UserForScoring[]
): Promise<ScoredPair[]> {
  const pairs = generatePairs(users);
  const scoredPairs: ScoredPair[] = [];

  console.log(`Scoring ${pairs.length} pairs...`);

  // Process in batches for performance
  for (let i = 0; i < pairs.length; i += SCORING_BATCH_SIZE) {
    const batch = pairs.slice(i, i + SCORING_BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async ([user1, user2]) => {
        // First check hard filters
        if (
          !checkAllFilters(
            user1.responses,
            user2.responses,
            user1.age,
            user2.age,
            user1.id,
            user2.id
          )
        ) {
          return null; // Doesn't pass filters
        }

        // Calculate text similarities for open-ended questions
        const textSimilarities = await calculateTextSimilarities(
          user1.id,
          user2.id,
          user1.responses,
          user2.responses
        );

        // Calculate bidirectional compatibility
        const scored = calculateBidirectionalCompatibility(
          user1.id,
          user2.id,
          user1.responses,
          user2.responses,
          user1.importance,
          user2.importance,
          user1.age,
          user2.age,
          textSimilarities
        );

        return scored;
      })
    );

    // Filter out null results and low scores
    for (const result of batchResults) {
      if (
        result &&
        result.passesFilters &&
        result.bidirectionalScore >= MINIMUM_MATCH_SCORE
      ) {
        scoredPairs.push(result);
      }
    }

    if (DEBUG_SCORING) {
      console.log(
        `Processed batch ${Math.floor(i / SCORING_BATCH_SIZE) + 1}/${Math.ceil(pairs.length / SCORING_BATCH_SIZE)}`
      );
    }
  }

  console.log(`Found ${scoredPairs.length} eligible pairs above minimum score`);
  return scoredPairs;
}

// ===========================================
// GREEDY MATCHING ALGORITHM
// ===========================================

/**
 * Run the greedy matching algorithm
 *
 * Strategy:
 * 1. Sort all pairs by bidirectional score (highest first)
 * 2. For each pair, check if both users have capacity
 * 3. If yes, create the match
 * 4. Continue until all pairs processed or all users at capacity
 */
export function runGreedyMatching(
  scoredPairs: ScoredPair[],
  maxMatchesPerUser: number = ALGORITHM_MATCHES_PER_USER
): AlgorithmMatch[] {
  // Sort pairs by score (highest first)
  const sortedPairs = [...scoredPairs].sort(
    (a, b) => b.bidirectionalScore - a.bidirectionalScore
  );

  // Track matches per user
  const matchCount = new Map<string, number>();
  const existingMatches = new Set<string>(); // "user1-user2" format

  const matches: AlgorithmMatch[] = [];

  for (const pair of sortedPairs) {
    const user1Matches = matchCount.get(pair.user1Id) || 0;
    const user2Matches = matchCount.get(pair.user2Id) || 0;

    // Check capacity
    if (
      user1Matches >= maxMatchesPerUser ||
      user2Matches >= maxMatchesPerUser
    ) {
      continue;
    }

    // Check for duplicate (shouldn't happen with proper pair generation)
    const pairKey1 = `${pair.user1Id}-${pair.user2Id}`;
    const pairKey2 = `${pair.user2Id}-${pair.user1Id}`;
    if (existingMatches.has(pairKey1) || existingMatches.has(pairKey2)) {
      continue;
    }

    // Create match (bidirectional - both users get matched to each other)
    matches.push({
      userId: pair.user1Id,
      matchedUserId: pair.user2Id,
      compatibilityScore: pair.bidirectionalScore,
      matchType: "algorithm",
    });

    matches.push({
      userId: pair.user2Id,
      matchedUserId: pair.user1Id,
      compatibilityScore: pair.bidirectionalScore,
      matchType: "algorithm",
    });

    // Update counts
    matchCount.set(pair.user1Id, user1Matches + 1);
    matchCount.set(pair.user2Id, user2Matches + 1);
    existingMatches.add(pairKey1);
  }

  console.log(
    `Generated ${matches.length / 2} mutual matches (${matches.length} match records)`
  );
  return matches;
}

// ===========================================
// DATABASE OPERATIONS
// ===========================================

/**
 * Store compatibility scores in database
 */
export async function storeCompatibilityScores(
  pairs: ScoredPair[],
  batchNumber: number
): Promise<void> {
  console.log(`Storing ${pairs.length} compatibility scores...`);

  // Use upsert to handle re-runs
  for (const pair of pairs) {
    await prisma.compatibilityScore.upsert({
      where: {
        userId_targetUserId_batchNumber: {
          userId: pair.user1Id,
          targetUserId: pair.user2Id,
          batchNumber,
        },
      },
      create: {
        userId: pair.user1Id,
        targetUserId: pair.user2Id,
        section1Score: 0, // TODO: Store detailed section scores
        section2Score: 0,
        section3Score: 0,
        section5Score: 0,
        totalScore: pair.score1to2,
        bidirectionalScore: pair.bidirectionalScore,
        batchNumber,
      },
      update: {
        totalScore: pair.score1to2,
        bidirectionalScore: pair.bidirectionalScore,
      },
    });

    // Store reverse direction too
    await prisma.compatibilityScore.upsert({
      where: {
        userId_targetUserId_batchNumber: {
          userId: pair.user2Id,
          targetUserId: pair.user1Id,
          batchNumber,
        },
      },
      create: {
        userId: pair.user2Id,
        targetUserId: pair.user1Id,
        section1Score: 0,
        section2Score: 0,
        section3Score: 0,
        section5Score: 0,
        totalScore: pair.score2to1,
        bidirectionalScore: pair.bidirectionalScore,
        batchNumber,
      },
      update: {
        totalScore: pair.score2to1,
        bidirectionalScore: pair.bidirectionalScore,
      },
    });
  }
}

/**
 * Store matches in database
 */
export async function storeMatches(
  matches: AlgorithmMatch[],
  batchNumber: number
): Promise<void> {
  console.log(`Storing ${matches.length} matches...`);

  const revealedAt = TEST_MODE_REVEAL ? new Date() : null;

  for (const match of matches) {
    await prisma.match.upsert({
      where: {
        userId_matchedUserId_batchNumber_matchType: {
          userId: match.userId,
          matchedUserId: match.matchedUserId,
          batchNumber,
          matchType: match.matchType,
        },
      },
      create: {
        userId: match.userId,
        matchedUserId: match.matchedUserId,
        compatibilityScore: match.compatibilityScore,
        matchType: match.matchType,
        batchNumber,
        revealedAt,
      },
      update: {
        compatibilityScore: match.compatibilityScore,
        revealedAt,
      },
    });
  }
}

/**
 * Update or create matching batch record
 */
async function updateMatchingBatch(
  batchNumber: number,
  status: string,
  stats?: Partial<{
    totalUsers: number;
    totalPairs: number;
    algorithmMatches: number;
    scoringStartedAt: Date;
    scoringCompletedAt: Date;
    matchingStartedAt: Date;
    matchingCompletedAt: Date;
  }>
): Promise<void> {
  await prisma.matchingBatch.upsert({
    where: { batchNumber },
    create: {
      batchNumber,
      status,
      ...stats,
    },
    update: {
      status,
      ...stats,
    },
  });
}

// ===========================================
// MAIN MATCHING FUNCTION
// ===========================================

/**
 * Run the complete matching algorithm for a batch
 *
 * This is the main entry point for running matching.
 */
export async function runMatching(
  batchNumber: number = CURRENT_BATCH
): Promise<MatchingResult> {
  console.log(`\n========================================`);
  console.log(`Starting matching for Batch ${batchNumber}`);
  console.log(`========================================\n`);

  const startTime = Date.now();

  // Update batch status
  await updateMatchingBatch(batchNumber, "scoring", {
    scoringStartedAt: new Date(),
  });

  // Step 1: Load eligible users
  console.log("Step 1: Loading eligible users...");
  const users = await loadEligibleUsers();

  if (users.length < 2) {
    console.log("Not enough users for matching");
    await updateMatchingBatch(batchNumber, "completed", {
      totalUsers: users.length,
      totalPairs: 0,
      algorithmMatches: 0,
      matchingCompletedAt: new Date(),
    });

    return {
      batchNumber,
      algorithmMatches: [],
      totalUsers: users.length,
      totalPairsScored: 0,
      averageScore: 0,
      medianScore: 0,
      matchedUsers: 0,
      unmatchedUsers: users.length,
    };
  }

  // Step 2: Score all pairs
  console.log("\nStep 2: Scoring all pairs...");
  const scoredPairs = await scoreAllPairs(users);

  await updateMatchingBatch(batchNumber, "scoring", {
    totalUsers: users.length,
    totalPairs: scoredPairs.length,
    scoringCompletedAt: new Date(),
  });

  // Store compatibility scores
  await storeCompatibilityScores(scoredPairs, batchNumber);

  // Step 3: Run greedy matching
  console.log("\nStep 3: Running greedy matching algorithm...");
  await updateMatchingBatch(batchNumber, "matching", {
    matchingStartedAt: new Date(),
  });

  const matches = runGreedyMatching(scoredPairs);

  // Step 4: Store matches
  console.log("\nStep 4: Storing matches...");
  await storeMatches(matches, batchNumber);

  // Calculate statistics
  const scores = scoredPairs.map((p) => p.bidirectionalScore);
  const averageScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  const sortedScores = [...scores].sort((a, b) => a - b);
  const medianScore =
    sortedScores.length > 0
      ? sortedScores[Math.floor(sortedScores.length / 2)]
      : 0;

  const matchedUserIds = new Set(matches.map((m) => m.userId));
  const matchedUsers = matchedUserIds.size;
  const unmatchedUsers = users.length - matchedUsers;

  // Update batch status
  await updateMatchingBatch(batchNumber, "cupid_review", {
    algorithmMatches: matches.length / 2, // Divide by 2 since each match creates 2 records
    matchingCompletedAt: new Date(),
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n========================================`);
  console.log(`Matching Complete!`);
  console.log(`========================================`);
  console.log(`Total users: ${users.length}`);
  console.log(`Eligible pairs: ${scoredPairs.length}`);
  console.log(`Matches created: ${matches.length / 2} mutual matches`);
  console.log(`Matched users: ${matchedUsers}`);
  console.log(`Unmatched users: ${unmatchedUsers}`);
  console.log(`Average score: ${averageScore.toFixed(1)}`);
  console.log(`Median score: ${medianScore.toFixed(1)}`);
  console.log(`Time elapsed: ${elapsed}s`);
  console.log(`========================================\n`);

  return {
    batchNumber,
    algorithmMatches: matches,
    totalUsers: users.length,
    totalPairsScored: scoredPairs.length,
    averageScore,
    medianScore,
    matchedUsers,
    unmatchedUsers,
  };
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get matching statistics for a batch
 */
export async function getMatchingStats(batchNumber: number): Promise<{
  batch: unknown;
  userStats: {
    total: number;
    matched: number;
    matchDistribution: Record<number, number>;
  };
}> {
  const batch = await prisma.matchingBatch.findUnique({
    where: { batchNumber },
  });

  const matches = await prisma.match.findMany({
    where: { batchNumber, matchType: "algorithm" },
    select: { userId: true },
  });

  // Count matches per user
  const matchesPerUser = new Map<string, number>();
  for (const match of matches) {
    const count = matchesPerUser.get(match.userId) || 0;
    matchesPerUser.set(match.userId, count + 1);
  }

  // Calculate distribution
  const distribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const count of matchesPerUser.values()) {
    distribution[count] = (distribution[count] || 0) + 1;
  }

  return {
    batch,
    userStats: {
      total: matchesPerUser.size,
      matched: matches.length,
      matchDistribution: distribution,
    },
  };
}

/**
 * Clear all matching data for a batch (for testing)
 */
export async function clearBatchData(batchNumber: number): Promise<void> {
  console.log(`Clearing all data for batch ${batchNumber}...`);

  await prisma.match.deleteMany({ where: { batchNumber } });
  await prisma.compatibilityScore.deleteMany({ where: { batchNumber } });
  await prisma.cupidAssignment.deleteMany({ where: { batchNumber } });
  await prisma.matchingBatch.deleteMany({ where: { batchNumber } });

  console.log("Done.");
}
