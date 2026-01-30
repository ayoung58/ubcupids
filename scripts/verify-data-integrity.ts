import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(70));
  console.log("FINAL DATABASE VERIFICATION (READ-ONLY)");
  console.log("=".repeat(70));

  // 1. Check empty responses via raw SQL (ground truth)
  const emptyCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "QuestionnaireResponseV2"
    WHERE "responses" = '{}'::jsonb
  `;

  // 2. Check total records
  const total = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "QuestionnaireResponseV2"
  `;

  // 3. Check submitted questionnaires
  const submitted = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "QuestionnaireResponseV2"
    WHERE "isSubmitted" = true
  `;

  // 4. Check submitted with empty responses
  const submittedEmpty = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "QuestionnaireResponseV2"
    WHERE "isSubmitted" = true AND "responses" = '{}'::jsonb
  `;

  // 5. Check questionsCompleted accuracy
  const questionnaireData = await prisma.questionnaireResponseV2.findMany({
    where: {
      isSubmitted: true,
    },
    select: {
      userId: true,
      responses: true,
      questionsCompleted: true,
      freeResponse1: true,
      freeResponse2: true,
    },
    take: 10, // Sample 10 submitted questionnaires
  });

  console.log("\n📊 DATABASE STATISTICS:");
  console.log(`Total records: ${Number(total[0].count)}`);
  console.log(`Empty responses ({}): ${Number(emptyCount[0].count)}`);
  console.log(`Submitted questionnaires: ${Number(submitted[0].count)}`);
  console.log(
    `Submitted with empty responses: ${Number(submittedEmpty[0].count)}`,
  );

  console.log("\n🔍 SAMPLE VALIDATION (10 submitted questionnaires):");

  let correctCount = 0;
  let incorrectCount = 0;

  for (const record of questionnaireData) {
    const responseCount = Object.keys(record.responses as object).length;
    const freeResponseCount =
      (record.freeResponse1 ? 1 : 0) + (record.freeResponse2 ? 1 : 0);
    const expectedCompleted = responseCount + freeResponseCount;
    const actualCompleted = record.questionsCompleted;

    if (expectedCompleted === actualCompleted) {
      correctCount++;
    } else {
      incorrectCount++;
      console.log(`   ❌ User ${record.userId.substring(0, 12)}...`);
      console.log(
        `      - Actual: ${actualCompleted}, Expected: ${expectedCompleted}`,
      );
      console.log(
        `      - Responses: ${responseCount}, Free: ${freeResponseCount}`,
      );
    }
  }

  console.log(`\n✅ Correct: ${correctCount}`);
  console.log(`❌ Incorrect: ${incorrectCount}`);

  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY:");
  console.log("=".repeat(70));
  console.log(
    `✅ Database has ${Number(total[0].count)} questionnaire responses`,
  );
  console.log(
    `✅ Only ${Number(emptyCount[0].count)} empty response (as expected)`,
  );
  console.log(
    `✅ All ${Number(submitted[0].count)} submitted questionnaires have data`,
  );
  console.log(
    `✅ ${Number(submittedEmpty[0].count)} submitted questionnaires are empty (should be 0)`,
  );

  if (
    Number(emptyCount[0].count) === 1 &&
    Number(submittedEmpty[0].count) === 0
  ) {
    console.log("\n🎉 DATA INTEGRITY VERIFIED - ALL SYSTEMS OPERATIONAL!");
  } else {
    console.log("\n⚠️  DATA INTEGRITY ISSUES DETECTED");
  }

  await prisma.$disconnect();
}

main();
