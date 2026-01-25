import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking Test Users for Matching...\n");

  // Find test users
  const testUsers = await prisma.user.findMany({
    where: {
      isTestUser: true,
    },
    include: {
      questionnaireResponseV2: true,
    },
  });

  console.log(`📋 Total Test Users: ${testUsers.length}\n`);

  if (testUsers.length === 0) {
    console.log("❌ No test users found in database");
    await prisma.$disconnect();
    return;
  }

  // Check questionnaire completion
  const usersWithQuestionnaire = testUsers.filter(
    (u) => u.questionnaireResponseV2 !== null
  );
  const usersWithSubmittedQuestionnaire = testUsers.filter(
    (u) =>
      u.questionnaireResponseV2 !== null &&
      u.questionnaireResponseV2.isSubmitted === true
  );

  console.log(
    `✅ Users with Questionnaire V2: ${usersWithQuestionnaire.length}`
  );
  console.log(
    `✅ Users with Submitted Questionnaire: ${usersWithSubmittedQuestionnaire.length}\n`
  );

  // Check gender distribution
  const genderMap: Record<string, number> = {};
  const preferenceMap: Record<string, number> = {};

  usersWithSubmittedQuestionnaire.forEach((user) => {
    const responses = user.questionnaireResponseV2?.responses as any;
    if (responses) {
      const gender = responses.q1?.answer || "unknown";
      const preferences = responses.q2?.answer || [];

      genderMap[gender] = (genderMap[gender] || 0) + 1;

      preferences.forEach((pref: string) => {
        preferenceMap[pref] = (preferenceMap[pref] || 0) + 1;
      });
    }
  });

  console.log("📊 Gender Distribution:");
  Object.entries(genderMap).forEach(([gender, count]) => {
    console.log(`  ${gender}: ${count}`);
  });

  console.log("\n📊 Gender Preference Distribution:");
  Object.entries(preferenceMap).forEach(([pref, count]) => {
    console.log(`  Interested in ${pref}: ${count}`);
  });

  // Sample a few users to see their responses
  console.log("\n👥 Sample User Data:");
  for (const user of usersWithSubmittedQuestionnaire.slice(0, 3)) {
    const responses = user.questionnaireResponseV2?.responses as any;
    console.log(`\n  User: ${user.email}`);
    console.log(`    Gender: ${responses?.q1?.answer || "N/A"}`);
    console.log(
      `    Interested in: ${JSON.stringify(responses?.q2?.answer || [])}`
    );
    console.log(
      `    Age: ${responses?.q4?.answer || "N/A"} (Range: ${responses?.q4?.preference?.min}-${responses?.q4?.preference?.max})`
    );
    console.log(
      `    Total questions answered: ${Object.keys(responses || {}).length}`
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
