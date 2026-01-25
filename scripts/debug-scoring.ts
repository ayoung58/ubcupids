import { PrismaClient } from "@prisma/client";
import { runMatchingPipeline } from "../lib/matching/v2";
import type { MatchingUser } from "../lib/matching/v2";
import { MATCHING_CONFIG } from "../lib/matching/v2/config";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Deep Dive into Pair Scoring...\n");

  // Get just 10 test users for detailed debugging
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
    take: 10,
  });

  console.log(`📋 Analyzing ${usersRaw.length} test users\n`);

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

  console.log("📊 Current Matching Config:");
  console.log(`  T_MIN (Minimum threshold): ${MATCHING_CONFIG.T_MIN}`);
  console.log(`  ALPHA: ${MATCHING_CONFIG.ALPHA}`);
  console.log(`  BETA: ${MATCHING_CONFIG.BETA}`);
  console.log(
    `  Section Weights: Lifestyle ${MATCHING_CONFIG.SECTION_WEIGHTS.LIFESTYLE}, Personality ${MATCHING_CONFIG.SECTION_WEIGHTS.PERSONALITY}\n`
  );

  // Run matching
  const result = runMatchingPipeline(users);

  console.log("📊 Results:");
  console.log(
    `  Pair Scores Calculated: ${result.diagnostics.phase2to6_pairScoresCalculated}`
  );
  console.log(
    `  Average Score: ${result.diagnostics.phase2to6_averageRawScore}`
  );
  console.log(`  Eligible Pairs: ${result.diagnostics.phase7_eligiblePairs}`);
  console.log(`  Failed Absolute: ${result.diagnostics.phase7_failedAbsolute}`);
  console.log();

  // Check score distribution
  if (result.diagnostics.scoreDistribution) {
    console.log("📈 Score Distribution:");
    result.diagnostics.scoreDistribution.forEach((bucket) => {
      console.log(`  ${bucket.range}: ${bucket.count} pairs`);
    });
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  console.error(error.stack);
  process.exit(1);
});
