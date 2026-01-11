/**
 * V2 Matching Orchestrator
 *
 * Main entry point for running the complete V2 matching algorithm:
 * 1. Load eligible users from database
 * 2. Run algorithmV2 (8 phases)
 * 3. Run Blossom for optimal matching
 * 4. Store matches in database
 */

import { prisma } from "../prisma";
import { decryptJSON } from "../encryption";
import { Responses } from "@/src/lib/questionnaire-types";
import {
  runMatchingAlgorithm,
  validateUsersForMatching,
  User,
} from "./algorithmV2";
import {
  runBlossomWithFallback,
  getBlossomStats,
  BlossomMatch,
} from "./blossomV2";

export interface MatchingResultV2 {
  batchNumber: number;
  totalUsers: number;
  eligibleUsers: number;
  ineligibleUsers: number;
  totalPairsEvaluated: number;
  filteredByDealbreaker: number;
  filteredByThreshold: number;
  eligiblePairs: number;
  finalMatches: number;
  matchedUsers: number;
  unmatchedUsers: number;
  averageScore: number;
  matchDetails: BlossomMatch[];
}

/**
 * Load users from database and convert to algorithm format
 */
async function loadUsersForMatching(): Promise<User[]> {
  const dbUsers = await prisma.user.findMany({
    where: {
      emailVerified: { not: null },
      isBeingMatched: true,
      questionnaireResponse: {
        isSubmitted: true,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      questionnaireResponse: {
        select: {
          responses: true,
        },
      },
    },
  });

  const users: User[] = [];

  for (const dbUser of dbUsers) {
    if (!dbUser.questionnaireResponse) continue;

    try {
      const responses = decryptJSON<Responses>(
        dbUser.questionnaireResponse.responses
      );

      users.push({
        id: dbUser.id,
        name: `${dbUser.firstName} ${dbUser.lastName}`,
        responses,
      });
    } catch (error) {
      console.error(`Error decrypting responses for user ${dbUser.id}:`, error);
    }
  }

  return users;
}

/**
 * Store matches in database
 */
async function storeMatches(
  matches: BlossomMatch[],
  batchNumber: number
): Promise<void> {
  console.log(`Storing ${matches.length} matches in database...`);

  // Clear existing matches for this batch
  await prisma.match.deleteMany({
    where: { batchNumber },
  });

  // Create new matches
  // Each match is stored bidirectionally (A→B and B→A)
  const matchRecords = matches.flatMap((match) => [
    {
      userId: match.userA,
      matchedUserId: match.userB,
      matchType: "algorithm",
      compatibilityScore: match.score,
      batchNumber,
      status: "accepted", // Algorithm matches are auto-accepted
    },
    {
      userId: match.userB,
      matchedUserId: match.userA,
      matchType: "algorithm",
      compatibilityScore: match.score,
      batchNumber,
      status: "accepted",
    },
  ]);

  await prisma.match.createMany({
    data: matchRecords,
  });

  console.log(`Successfully stored ${matches.length} matches`);
}

/**
 * Main V2 matching function
 */
export async function runMatchingV2(
  batchNumber: number
): Promise<MatchingResultV2> {
  console.log("=".repeat(60));
  console.log("STARTING V2 MATCHING ALGORITHM");
  console.log("=".repeat(60));

  // Step 1: Load users
  console.log("\n[Step 1] Loading users from database...");
  const allUsers = await loadUsersForMatching();
  console.log(`Loaded ${allUsers.length} users`);

  // Step 2: Validate users
  console.log("\n[Step 2] Validating users...");
  const { valid: eligibleUsers, invalid: ineligibleUsers } =
    validateUsersForMatching(allUsers);
  console.log(
    `Eligible: ${eligibleUsers.length}, Ineligible: ${ineligibleUsers.length}`
  );

  if (ineligibleUsers.length > 0) {
    console.log("Ineligible users:");
    ineligibleUsers.forEach((user) => {
      console.log(`  - ${user.userId}: ${user.reason}`);
    });
  }

  if (eligibleUsers.length < 2) {
    throw new Error(
      `Not enough eligible users (${eligibleUsers.length}). Need at least 2.`
    );
  }

  // Step 3: Run algorithmV2 (8 phases)
  console.log("\n[Step 3] Running 8-phase matching algorithm...");
  const algorithmResult = runMatchingAlgorithm(eligibleUsers);

  console.log(`
Algorithm Results:
  - Total pairs evaluated: ${algorithmResult.eligiblePairs.length + algorithmResult.filteredByDealbreaker.length + algorithmResult.filteredByThreshold.length}
  - Filtered by dealbreaker: ${algorithmResult.filteredByDealbreaker.length}
  - Filtered by threshold: ${algorithmResult.filteredByThreshold.length}
  - Eligible pairs: ${algorithmResult.eligiblePairs.length}
  `);

  if (algorithmResult.eligiblePairs.length === 0) {
    throw new Error("No eligible pairs found. Cannot proceed with matching.");
  }

  // Step 4: Run Blossom matching
  console.log("\n[Step 4] Running Blossom maximum-weight matching...");
  const userIds = eligibleUsers.map((u) => u.id);
  const matches = runBlossomWithFallback(
    algorithmResult.blossomEdges,
    algorithmResult.eligiblePairs,
    userIds,
    3 // Max 3 matches per user
  );

  const blossomStats = getBlossomStats(matches, eligibleUsers.length);
  console.log(`
Blossom Results:
  - Total matches: ${blossomStats.totalMatches}
  - Matched users: ${blossomStats.matchedUsers}
  - Unmatched users: ${blossomStats.unmatchedUsers}
  - Average score: ${blossomStats.averageScore.toFixed(3)}
  - Score range: ${blossomStats.minScore.toFixed(3)} - ${blossomStats.maxScore.toFixed(3)}
  `);

  // Step 5: Store matches in database
  console.log("\n[Step 5] Storing matches in database...");
  await storeMatches(matches, batchNumber);

  // Step 6: Update batch status
  await prisma.matchingBatch.upsert({
    where: { batchNumber },
    update: {
      status: "completed",
      matchingCompletedAt: new Date(),
      algorithmMatches: matches.length,
      totalUsers: eligibleUsers.length,
      totalPairs: algorithmResult.eligiblePairs.length,
    },
    create: {
      batchNumber,
      status: "completed",
      matchingStartedAt: new Date(),
      matchingCompletedAt: new Date(),
      algorithmMatches: matches.length,
      totalUsers: eligibleUsers.length,
      totalPairs: algorithmResult.eligiblePairs.length,
    },
  });

  console.log("\n" + "=".repeat(60));
  console.log("V2 MATCHING COMPLETE");
  console.log("=".repeat(60));

  return {
    batchNumber,
    totalUsers: allUsers.length,
    eligibleUsers: eligibleUsers.length,
    ineligibleUsers: ineligibleUsers.length,
    totalPairsEvaluated:
      algorithmResult.eligiblePairs.length +
      algorithmResult.filteredByDealbreaker.length +
      algorithmResult.filteredByThreshold.length,
    filteredByDealbreaker: algorithmResult.filteredByDealbreaker.length,
    filteredByThreshold: algorithmResult.filteredByThreshold.length,
    eligiblePairs: algorithmResult.eligiblePairs.length,
    finalMatches: matches.length,
    matchedUsers: blossomStats.matchedUsers,
    unmatchedUsers: blossomStats.unmatchedUsers,
    averageScore: blossomStats.averageScore,
    matchDetails: matches,
  };
}
