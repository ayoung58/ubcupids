import { PrismaClient } from "@prisma/client";
import type { MatchingUser } from "../lib/matching/v2";
import { checkHardFilters } from "../lib/matching/v2/hard-filters";

const prisma = new PrismaClient();

// Normalize gender values (same as in matching pipeline)
function normalizeGenderValue(gender: string): string {
  // Normalize singular to plural
  if (gender === "man") return "men";
  if (gender === "woman") return "women";

  // Normalize hyphen to underscore
  if (gender === "non-binary") return "non_binary";

  return gender;
}

async function main() {
  console.log("🔍 Testing Hard Filters Directly...\n");

  // Get just 5 test users
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
    take: 5,
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

  console.log(`📋 Testing ${users.length} users\n`);

  // Show each user
  users.forEach((user, idx) => {
    console.log(`User ${idx + 1}: ${user.email}`);
    console.log(`  Gender: ${user.gender}`);
    console.log(`  Interested in: ${JSON.stringify(user.interestedInGenders)}`);
    console.log(`  Campus: ${user.campus}`);
    console.log(
      `  Ok with different campus: ${user.okMatchingDifferentCampus}`
    );
  });
  console.log();

  // Test all pairs
  console.log("🔍 Testing all pairs:\n");
  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const userA = users[i];
      const userB = users[j];

      const result = checkHardFilters(userA, userB);

      console.log(`${userA.email} ↔ ${userB.email}`);
      console.log(`  A (${userA.gender}) → B (${userB.gender})`);
      console.log(
        `  A interested in: ${JSON.stringify(userA.interestedInGenders)}`
      );
      console.log(
        `  B interested in: ${JSON.stringify(userB.interestedInGenders)}`
      );
      console.log(
        `  Result: ${result.passed ? "✅ PASSED" : `❌ FAILED (${result.reason})`}`
      );
      console.log();

      if (result.passed) {
        passedCount++;
      } else {
        failedCount++;
      }
    }
  }

  console.log(`\n📊 Summary: ${passedCount} passed, ${failedCount} failed`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
