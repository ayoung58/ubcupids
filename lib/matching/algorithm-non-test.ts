/**
 * Matching Algorithm for Non-Test Users (Production) Only
 *
 * This is a wrapper around the main matching algorithm that only processes non-test users.
 */

import { prisma } from "../prisma";
import { decryptJSON } from "../encryption";
import {
  ALGORITHM_MATCHES_PER_USER,
  MINIMUM_MATCH_SCORE,
  SCORING_BATCH_SIZE,
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

async function loadEligibleNonTestUsers(): Promise<UserForScoring[]> {
  const users = await prisma.user.findMany({
    where: {
      emailVerified: { not: null },
      isBeingMatched: true,
      isTestUser: false, // ONLY non-test users
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
      const responses = decryptJSON<DecryptedResponses>(
        user.questionnaireResponse.responses
      );
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
      console.error(
        `Error decrypting responses for production user ${user.id}:`,
        error
      );
    }
  }

  console.log(
    `Loaded ${eligibleUsers.length} eligible PRODUCTION users for matching`
  );
  return eligibleUsers;
}

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

async function scoreAllPairs(users: UserForScoring[]): Promise<ScoredPair[]> {
  const pairs = generatePairs(users);
  const scoredPairs: ScoredPair[] = [];

  console.log(`Scoring ${pairs.length} production user pairs...`);

  for (let i = 0; i < pairs.length; i += SCORING_BATCH_SIZE) {
    const batch = pairs.slice(i, i + SCORING_BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async ([user1, user2]) => {
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
          return null;
        }

        const textSimilarities = await calculateTextSimilarities(
          user1.id,
          user2.id,
          user1.responses,
          user2.responses
        );

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

  console.log(
    `Found ${scoredPairs.length} eligible production user pairs above minimum score`
  );
  return scoredPairs;
}

function runGreedyMatching(
  scoredPairs: ScoredPair[],
  maxMatchesPerUser: number = ALGORITHM_MATCHES_PER_USER
): AlgorithmMatch[] {
  const sortedPairs = [...scoredPairs].sort(
    (a, b) => b.bidirectionalScore - a.bidirectionalScore
  );

  const matchCount = new Map<string, number>();
  const existingMatches = new Set<string>();
  const matches: AlgorithmMatch[] = [];

  for (const pair of sortedPairs) {
    const user1Matches = matchCount.get(pair.user1Id) || 0;
    const user2Matches = matchCount.get(pair.user2Id) || 0;

    if (
      user1Matches >= maxMatchesPerUser ||
      user2Matches >= maxMatchesPerUser
    ) {
      continue;
    }

    const pairKey1 = `${pair.user1Id}-${pair.user2Id}`;
    const pairKey2 = `${pair.user2Id}-${pair.user1Id}`;
    if (existingMatches.has(pairKey1) || existingMatches.has(pairKey2)) {
      continue;
    }

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

    matchCount.set(pair.user1Id, user1Matches + 1);
    matchCount.set(pair.user2Id, user2Matches + 1);
    existingMatches.add(pairKey1);
  }

  console.log(
    `Generated ${matches.length / 2} mutual production user matches (${matches.length} match records)`
  );
  return matches;
}

async function storeCompatibilityScores(
  pairs: ScoredPair[],
  batchNumber: number
): Promise<void> {
  console.log(
    `Storing ${pairs.length} production user compatibility scores...`
  );

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
        section1Score: pair.section1Score,
        section2Score: pair.section2Score,
        section3Score: pair.section3Score,
        section5Score: pair.section5Score,
        totalScore: pair.score1to2,
        bidirectionalScore: pair.bidirectionalScore,
        batchNumber,
      },
      update: {
        section1Score: pair.section1Score,
        section2Score: pair.section2Score,
        section3Score: pair.section3Score,
        section5Score: pair.section5Score,
        totalScore: pair.score1to2,
        bidirectionalScore: pair.bidirectionalScore,
      },
    });

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
        section1Score: pair.section1Score,
        section2Score: pair.section2Score,
        section3Score: pair.section3Score,
        section5Score: pair.section5Score,
        totalScore: pair.score2to1,
        bidirectionalScore: pair.bidirectionalScore,
        batchNumber,
      },
      update: {
        section1Score: pair.section1Score,
        section2Score: pair.section2Score,
        section3Score: pair.section3Score,
        section5Score: pair.section5Score,
        totalScore: pair.score2to1,
        bidirectionalScore: pair.bidirectionalScore,
      },
    });
  }
}

async function storeMatches(
  matches: AlgorithmMatch[],
  batchNumber: number
): Promise<void> {
  console.log(`Storing ${matches.length} production user matches...`);

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
        status: "accepted",
        revealedAt,
      },
      update: {
        compatibilityScore: match.compatibilityScore,
        status: "accepted",
        revealedAt,
      },
    });
  }
}

/**
 * Run the complete matching algorithm for PRODUCTION USERS ONLY
 */
export async function runMatchingForNonTestUsers(
  batchNumber: number
): Promise<MatchingResult> {
  console.log(`\n========================================`);
  console.log(`Starting matching for PRODUCTION USERS (Batch ${batchNumber})`);
  console.log(`========================================\n`);

  const startTime = Date.now();

  const users = await loadEligibleNonTestUsers();

  if (users.length < 2) {
    console.log("Not enough production users for matching");
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

  const scoredPairs = await scoreAllPairs(users);
  await storeCompatibilityScores(scoredPairs, batchNumber);

  const matches = runGreedyMatching(scoredPairs);
  await storeMatches(matches, batchNumber);

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

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n========================================`);
  console.log(`PRODUCTION USER Matching Complete!`);
  console.log(`========================================`);
  console.log(`Total production users: ${users.length}`);
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
