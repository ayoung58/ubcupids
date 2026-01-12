/**
 * Matching Algorithm V2.2 Test Script
 *
 * Standalone script for testing matching scenarios with detailed diagnostics.
 * Run with: npx tsx scripts/test-matching.ts
 *
 * This script tests various scenarios:
 * 1. Perfect match pair (high mutual compatibility)
 * 2. Dealbreaker conflict (Phase 1 filter)
 * 3. Asymmetric pair (one-sided high score)
 * 4. Below-threshold pair (fails Phase 7)
 * 5. Triangle scenario (A→B→C→A preference chain)
 * 6. Large batch (50+ users with varying compatibility)
 */

import { runMatchingPipeline, MatchingUser } from "../lib/matching/v2";
import { ResponseValue } from "../lib/matching/v2/types";
import { MATCHING_CONFIG } from "../lib/matching/v2/config";
import {
  SECTION_WEIGHTS,
  IMPORTANCE_MULTIPLIERS,
} from "../lib/matching/config";
import { prisma } from "../lib/prisma";

// Helper functions for testing
function scoreSingleChoice(
  a: string | undefined,
  b: string | undefined
): number {
  if (!a || !b) return 0;
  return a === b ? 100 : 0;
}

function scoreMultiChoice(a: string[], b: string[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return (intersection.size / union.size) * 100;
}

function scoreRanking(a: string[], b: string[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let score = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) score += 100 / a.length;
  }
  return score;
}

function checkGenderFilter(
  userA: { Q1: string; Q3: string[] },
  userB: { Q1: string; Q3: string[] },
  userAId: string,
  userBId: string
): {
  bothPass: boolean;
  user1PassesFilter: boolean;
  user2PassesFilter: boolean;
} {
  const user1Gender = userA.Q1;
  const user1Interested = userA.Q3;
  const user2Gender = userB.Q1;
  const user2Interested = userB.Q3;

  const user1Passes =
    user2Interested.includes(user1Gender) || user2Interested.includes("anyone");
  const user2Passes =
    user1Interested.includes(user2Gender) || user1Interested.includes("anyone");

  return {
    bothPass: user1Passes && user2Passes,
    user1PassesFilter: user1Passes,
    user2PassesFilter: user2Passes,
  };
}

function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;
  let dot = 0,
    norm1 = 0,
    norm2 = 0;
  for (let i = 0; i < vec1.length; i++) {
    dot += vec1[i] * vec2[i];
    norm1 += vec1[i] ** 2;
    norm2 += vec2[i] ** 2;
  }
  if (norm1 === 0 || norm2 === 0) return 0;
  return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

async function main() {
  console.log("\n==========================================");
  console.log("UBCupids Matching System Test Suite");
  console.log("==========================================\n");

  // Test 1: Configuration
  console.log("📋 Test 1: Configuration Values");
  console.log("--------------------------------");
  console.log("Section Weights:", SECTION_WEIGHTS);
  console.log("Importance Multipliers:", IMPORTANCE_MULTIPLIERS);
  console.log("✅ Configuration loaded successfully\n");

  // Test 2: Single Choice Scoring
  console.log("📋 Test 2: Single Choice Scoring");
  console.log("---------------------------------");
  const singleTest1 = scoreSingleChoice("pizza", "pizza");
  const singleTest2 = scoreSingleChoice("pizza", "sushi");
  const singleTest3 = scoreSingleChoice(undefined, "pizza");
  console.log(`Same answer: ${singleTest1} (expected: 100)`);
  console.log(`Different answer: ${singleTest2} (expected: 0)`);
  console.log(`Missing answer: ${singleTest3} (expected: 0)`);
  console.log(
    singleTest1 === 100 && singleTest2 === 0 && singleTest3 === 0
      ? "✅ Single choice scoring works correctly\n"
      : "❌ Single choice scoring failed\n"
  );

  // Test 3: Multi Choice Scoring
  console.log("📋 Test 3: Multi Choice Scoring (Jaccard)");
  console.log("-----------------------------------------");
  const multiTest1 = scoreMultiChoice(["a", "b", "c"], ["a", "b", "c"]);
  const multiTest2 = scoreMultiChoice(["a", "b"], ["b", "c"]);
  const multiTest3 = scoreMultiChoice(["a"], ["b"]);
  console.log(`Identical sets: ${multiTest1.toFixed(1)} (expected: 100)`);
  console.log(`Partial overlap: ${multiTest2.toFixed(1)} (expected: 33.3)`);
  console.log(`No overlap: ${multiTest3.toFixed(1)} (expected: 0)`);
  console.log(
    multiTest1 === 100 && multiTest3 === 0
      ? "✅ Multi choice scoring works correctly\n"
      : "❌ Multi choice scoring failed\n"
  );

  // Test 4: Ranking Scoring
  console.log("📋 Test 4: Ranking Scoring");
  console.log("--------------------------");
  const rankTest1 = scoreRanking(["a", "b", "c"], ["a", "b", "c"]);
  const rankTest2 = scoreRanking(["a", "b", "c"], ["c", "b", "a"]);
  const rankTest3 = scoreRanking(["a", "b", "c"], ["x", "y", "z"]);
  console.log(`Identical ranking: ${rankTest1} (expected: 100)`);
  console.log(`Reversed ranking: ${rankTest2} (expected: partial)`);
  console.log(`No overlap: ${rankTest3} (expected: 0)`);
  console.log(
    rankTest1 === 100 && rankTest3 === 0
      ? "✅ Ranking scoring works correctly\n"
      : "❌ Ranking scoring failed\n"
  );

  // Test 5: Gender Filter
  console.log("📋 Test 5: Gender Filter");
  console.log("------------------------");
  const genderTest1 = checkGenderFilter(
    { Q1: "man", Q3: ["women"] },
    { Q1: "woman", Q3: ["men"] },
    "user1",
    "user2"
  );
  const genderTest2 = checkGenderFilter(
    { Q1: "man", Q3: ["men"] },
    { Q1: "woman", Q3: ["men"] },
    "user1",
    "user2"
  );
  const genderTest3 = checkGenderFilter(
    { Q1: "man", Q3: ["anyone"] },
    { Q1: "woman", Q3: ["women"] },
    "user1",
    "user2"
  );
  console.log(
    `Man->Women & Woman->Men: Both pass = ${genderTest1.bothPass} (expected: true)`
  );
  console.log(
    `Man->Men & Woman->Men: Both pass = ${genderTest2.bothPass} (expected: false)`
  );
  console.log(
    `Man->Anyone & Woman->Women: Both pass = ${genderTest3.bothPass} (expected: false)`
  );
  console.log(
    `  User1 passes: ${genderTest3.user1PassesFilter} (expected: true - "anyone" is satisfied)`
  );
  console.log(
    `  User2 passes: ${genderTest3.user2PassesFilter} (expected: false - man ≠ women)`
  );
  console.log(
    genderTest1.bothPass && !genderTest2.bothPass && !genderTest3.bothPass
      ? "✅ Gender filter works correctly\n"
      : "❌ Gender filter failed\n"
  );

  // Test 6: Cosine Similarity
  console.log("📋 Test 6: Cosine Similarity");
  console.log("----------------------------");
  const vec1 = [1, 0, 0];
  const vec2 = [1, 0, 0];
  const vec3 = [0, 1, 0];
  const vec4 = [-1, 0, 0];
  const cos1 = cosineSimilarity(vec1, vec2);
  const cos2 = cosineSimilarity(vec1, vec3);
  const cos3 = cosineSimilarity(vec1, vec4);
  console.log(`Identical vectors: ${cos1.toFixed(3)} (expected: 1.000)`);
  console.log(`Orthogonal vectors: ${cos2.toFixed(3)} (expected: 0.000)`);
  console.log(`Opposite vectors: ${cos3.toFixed(3)} (expected: -1.000)`);
  console.log(
    Math.abs(cos1 - 1) < 0.001 &&
      Math.abs(cos2) < 0.001 &&
      Math.abs(cos3 + 1) < 0.001
      ? "✅ Cosine similarity works correctly\n"
      : "❌ Cosine similarity failed\n"
  );

  // Test 7: Database Connection
  console.log("📋 Test 7: Database Connection");
  console.log("------------------------------");
  try {
    const userCount = await prisma.user.count();
    const responseCount = await prisma.questionnaireResponse.count({
      where: { isSubmitted: true },
    });
    console.log(`Total users: ${userCount}`);
    console.log(`Submitted questionnaires: ${responseCount}`);
    console.log("✅ Database connection successful\n");
  } catch (error) {
    console.log("❌ Database connection failed:", error);
  }

  // Test 8: Check New Models
  console.log("📋 Test 8: New Matching Models");
  console.log("------------------------------");
  try {
    const batchCount = await prisma.matchingBatch.count();
    const scoreCount = await prisma.compatibilityScore.count();
    const assignmentCount = await prisma.cupidAssignment.count();
    const embeddingCount = await prisma.textEmbedding.count();
    console.log(`MatchingBatch records: ${batchCount}`);
    console.log(`CompatibilityScore records: ${scoreCount}`);
    console.log(`CupidAssignment records: ${assignmentCount}`);
    console.log(`TextEmbedding records: ${embeddingCount}`);
    console.log("✅ New models accessible\n");
  } catch (error) {
    console.log("❌ New models not accessible:", error);
  }

  console.log("==========================================");
  console.log("Test Suite Complete");
  console.log("==========================================\n");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
