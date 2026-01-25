import { PrismaClient } from "@prisma/client";
import { calculateSimilarity } from "../lib/matching/v2/similarity";
import type { MatchingUser } from "../lib/matching/v2";
import { MATCHING_CONFIG } from "../lib/matching/v2/config";

const prisma = new PrismaClient();

function normalizeGenderValue(gender: string): string {
  if (gender === "man") return "men";
  if (gender === "woman") return "women";
  if (gender === "non-binary") return "non_binary";
  return gender;
}

function calculateDirectionalScoreComplete(
  userA: MatchingUser,
  userB: MatchingUser
): number {
  const similarities = calculateSimilarity(userA, userB);
  const questionIds = Object.keys(similarities);

  console.log(`  Calculating score: ${userA.email} → ${userB.email}`);
  console.log(`    Questions with similarities: ${questionIds.length}`);

  if (questionIds.length === 0) {
    console.log(`    Result: 0 (no similarities)`);
    return 0;
  }

  let nanCount = 0;
  const totalSimilarity = questionIds.reduce((sum, qid) => {
    const rawSim = similarities[qid];
    const importance = userA.responses[qid]?.importance || 3;
    const weighted = rawSim * (importance / 5);

    if (isNaN(rawSim)) {
      nanCount++;
      console.log(`    ⚠️ ${qid}: similarity is NaN`);
    }
    if (isNaN(weighted)) {
      console.log(
        `    ⚠️ ${qid}: weighted is NaN (sim=${rawSim}, imp=${importance})`
      );
    }

    return sum + weighted;
  }, 0);

  const averageScore = totalSimilarity / questionIds.length;
  const scaledScore = averageScore * 100;

  console.log(`    Total similarity: ${totalSimilarity.toFixed(3)}`);
  console.log(`    Average score: ${averageScore.toFixed(3)}`);
  console.log(`    Scaled (0-100): ${scaledScore.toFixed(2)}`);
  console.log(`    NaN count: ${nanCount}`);

  return scaledScore;
}

async function main() {
  console.log("🔍 Deep Score Calculation Debug...\n");

  // Get just 3 users
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
    take: 3,
  });

  const users: MatchingUser[] = usersRaw
    .filter((u: any) => u.questionnaireResponseV2)
    .map((u: any) => {
      const responses = (u.questionnaireResponseV2?.responses as any) || {};
      const gender = normalizeGenderValue(responses.q1?.answer || "any");
      const interestedInGendersRaw = responses.q2?.answer || ["any"];
      const interestedInGenders = (
        Array.isArray(interestedInGendersRaw)
          ? interestedInGendersRaw
          : [interestedInGendersRaw]
      ).map(normalizeGenderValue);

      return {
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        gender,
        interestedInGenders,
        campus: u.campus || "Vancouver",
        okMatchingDifferentCampus: u.okMatchingDifferentCampus ?? true,
        responses,
        responseRecord: u.questionnaireResponseV2!,
      };
    });

  console.log(`📋 Testing ${users.length} users\n`);

  // Calculate for each pair
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const userA = users[i];
      const userB = users[j];

      console.log(`\n🔗 Pair: ${userA.email} ↔ ${userB.email}`);

      const scoreAtoB = calculateDirectionalScoreComplete(userA, userB);
      const scoreBtoA = calculateDirectionalScoreComplete(userB, userA);

      // Calculate pair score
      const alpha = 0.65;
      const minScore = Math.min(scoreAtoB, scoreBtoA);
      const meanScore = (scoreAtoB + scoreBtoA) / 2;
      const pairScore = alpha * minScore + (1 - alpha) * meanScore;

      console.log(`\n  📊 Pair Score:`);
      console.log(`    Min: ${minScore.toFixed(2)}`);
      console.log(`    Mean: ${meanScore.toFixed(2)}`);
      console.log(`    Final: ${pairScore.toFixed(2)}`);
      console.log(`    Threshold: ${MATCHING_CONFIG.T_MIN}`);
      console.log(
        `    Status: ${pairScore >= MATCHING_CONFIG.T_MIN ? "✅ PASS" : "❌ FAIL"}`
      );
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  console.error(error.stack);
  process.exit(1);
});
