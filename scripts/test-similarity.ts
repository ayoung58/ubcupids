import { PrismaClient } from "@prisma/client";
import type { MatchingUser } from "../lib/matching/v2";
import { calculateSimilarity } from "../lib/matching/v2/similarity";

const prisma = new PrismaClient();

// Normalize gender values (same as in matching pipeline)
function normalizeGenderValue(gender: string): string {
  if (gender === "man") return "men";
  if (gender === "woman") return "women";
  if (gender === "non-binary") return "non_binary";
  return gender;
}

async function main() {
  console.log("🔍 Testing Similarity Calculation...\n");

  // Get just 2 test users
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
    take: 2,
  });

  // Transform to MatchingUser format
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

  if (users.length < 2) {
    console.log("Not enough users to compare");
    await prisma.$disconnect();
    return;
  }

  const userA = users[0];
  const userB = users[1];

  console.log(`User A: ${userA.email}`);
  console.log(`  Gender: ${userA.gender}`);
  console.log(`  Interested in: ${JSON.stringify(userA.interestedInGenders)}`);
  console.log(`  Questions answered: ${Object.keys(userA.responses).length}`);
  console.log();

  console.log(`User B: ${userB.email}`);
  console.log(`  Gender: ${userB.gender}`);
  console.log(`  Interested in: ${JSON.stringify(userB.interestedInGenders)}`);
  console.log(`  Questions answered: ${Object.keys(userB.responses).length}`);
  console.log();

  // Calculate similarities
  console.log("📊 Calculating Similarities (A → B):\n");
  const similarities = calculateSimilarity(userA, userB);

  console.log(
    `Total questions with similarities: ${Object.keys(similarities).length}`
  );
  console.log();

  // Show first 10 similarities
  const questionIds = Object.keys(similarities).slice(0, 10);
  questionIds.forEach((qid) => {
    const sim = similarities[qid];
    const aResponse = userA.responses[qid];
    console.log(`${qid}: ${sim.toFixed(3)}`);
    console.log(`  User A answer: ${JSON.stringify(aResponse?.answer)}`);
    console.log(
      `  User A preference: ${JSON.stringify(aResponse?.preference)}`
    );
    console.log(`  User A importance: ${aResponse?.importance || "N/A"}`);
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  console.error(error.stack);
  process.exit(1);
});
