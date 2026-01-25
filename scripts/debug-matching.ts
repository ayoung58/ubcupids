import { PrismaClient } from "@prisma/client";
import { runMatchingPipeline } from "../lib/matching/v2";
import type { MatchingUser } from "../lib/matching/v2";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Debugging Matching Algorithm...\n");

  // Get test users with questionnaire responses
  const usersRaw = await prisma.user.findMany({
    where: {
      isTestUser: true,
      questionnaireResponseV2: {
        isNot: null,
      },
    },
    include: {
      questionnaireResponseV2: true,
    },
  });

  console.log(`📋 Found ${usersRaw.length} test users with questionnaires\n`);

  // Transform to MatchingUser format
  const users: MatchingUser[] = usersRaw
    .filter((u: any) => u.questionnaireResponseV2)
    .map((u: any) => {
      const responses = (u.questionnaireResponseV2?.responses as any) || {};
      const gender = responses.q1?.answer || "any";
      const interestedInGenders = responses.q2?.answer || ["any"];

      return {
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        gender: String(gender),
        interestedInGenders: Array.isArray(interestedInGenders)
          ? interestedInGenders.map(String)
          : [String(interestedInGenders)],
        campus: u.campus || "Vancouver",
        okMatchingDifferentCampus: u.okMatchingDifferentCampus ?? true,
        responses,
        responseRecord: u.questionnaireResponseV2!,
      };
    });

  console.log(`✅ Transformed ${users.length} users for matching\n`);

  // Sample user data
  console.log("👥 Sample User Data:");
  users.slice(0, 3).forEach((user) => {
    console.log(`  ${user.email}:`);
    console.log(`    Gender: ${user.gender}`);
    console.log(
      `    Interested in: ${JSON.stringify(user.interestedInGenders)}`
    );
    console.log(`    Campus: ${user.campus}`);
  });
  console.log();

  // Check gender compatibility manually
  console.log("🔍 Checking Gender Compatibility:");
  const compatiblePairs: Array<[MatchingUser, MatchingUser]> = [];

  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const userA = users[i];
      const userB = users[j];

      // Check if A is interested in B's gender
      const aInterestedInB =
        userA.interestedInGenders.includes("any") ||
        userA.interestedInGenders.includes(userB.gender);

      // Check if B is interested in A's gender
      const bInterestedInA =
        userB.interestedInGenders.includes("any") ||
        userB.interestedInGenders.includes(userA.gender);

      if (aInterestedInB && bInterestedInA) {
        compatiblePairs.push([userA, userB]);
      }
    }
  }

  console.log(`  Compatible pairs (by gender): ${compatiblePairs.length}\n`);

  // Run matching algorithm
  console.log("🚀 Running Matching Algorithm...\n");
  const result = runMatchingPipeline(users);

  console.log("📊 Results:");
  console.log(`  Total Users: ${result.diagnostics.totalUsers}`);
  console.log(
    `  Phase 1 - Dealbreaker Filtered: ${result.diagnostics.phase1_filteredPairs}`
  );
  console.log(
    `  Phase 2-6 - Pair Scores Calculated: ${result.diagnostics.phase2to6_pairScoresCalculated}`
  );
  console.log(
    `  Phase 2-6 - Average Score: ${result.diagnostics.phase2to6_averageRawScore.toFixed(2)}`
  );
  console.log(
    `  Phase 7 - Eligible Pairs: ${result.diagnostics.phase7_eligiblePairs}`
  );
  console.log(
    `  Phase 7 - Failed Absolute: ${result.diagnostics.phase7_failedAbsolute}`
  );
  console.log(
    `  Phase 7 - Failed Relative A: ${result.diagnostics.phase7_failedRelativeA}`
  );
  console.log(
    `  Phase 7 - Failed Relative B: ${result.diagnostics.phase7_failedRelativeB}`
  );
  console.log(
    `  Phase 8 - Matches Created: ${result.diagnostics.phase8_matchesCreated}`
  );
  console.log(
    `  Phase 8 - Unmatched Users: ${result.diagnostics.phase8_unmatchedUsers}\n`
  );

  // Show sample dealbreakers if any
  if (result.diagnostics.phase1_dealbreakers.length > 0) {
    console.log("⚠️ Sample Dealbreakers (first 5):");
    result.diagnostics.phase1_dealbreakers.slice(0, 5).forEach((db) => {
      console.log(
        `  ${db.userAId.slice(0, 8)}... ↔ ${db.userBId.slice(0, 8)}...`
      );
      console.log(`    Reason: ${db.reason}`);
    });
    console.log();
  }

  // Show unmatched details
  if (result.unmatched.length > 0) {
    console.log("😔 Unmatched Users (first 5):");
    result.unmatched.slice(0, 5).forEach((u) => {
      console.log(`  ${u.userId.slice(0, 8)}...`);
      console.log(`    Reason: ${u.reason}`);
      console.log(`    Best Score: ${u.bestPossibleScore ?? "N/A"}`);
    });
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
