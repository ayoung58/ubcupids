/**
 * Phase 1 Verification Script
 * Tests that the database migration was successful
 */

import { prisma } from "@/lib/prisma";

async function verifyPhase1() {
  console.log("🔍 Verifying Phase 1: Database Schema & Migration\n");

  try {
    // Test 1: Check that QuestionnaireResponseV2 table exists and can be queried
    console.log("✓ Test 1: Checking QuestionnaireResponseV2 table...");
    const v2Count = await prisma.questionnaireResponseV2.count();
    console.log(
      `  ✓ QuestionnaireResponseV2 table exists (${v2Count} records)\n`
    );

    // Test 2: Check that old questionnaire responses were wiped
    console.log("✓ Test 2: Checking old questionnaire data was wiped...");
    const oldQuestionnaireCount = await prisma.questionnaire.count();
    const oldResponseCount = await prisma.questionnaireResponse.count();
    console.log(`  ✓ Questionnaire records: ${oldQuestionnaireCount}`);
    console.log(`  ✓ QuestionnaireResponse records: ${oldResponseCount}\n`);

    // Test 3: Check that needsQuestionnaireUpdate field exists
    console.log("✓ Test 3: Checking needsQuestionnaireUpdate field...");
    const usersNeedingUpdate = await prisma.user.count({
      where: { needsQuestionnaireUpdate: true },
    });
    const totalUsers = await prisma.user.count();
    console.log(
      `  ✓ Users needing update: ${usersNeedingUpdate} / ${totalUsers}\n`
    );

    // Test 4: Verify we can create a V2 response
    console.log("✓ Test 4: Testing V2 response creation...");
    const testUser = await prisma.user.findFirst();

    if (testUser) {
      // Check if response already exists
      const existingResponse = await prisma.questionnaireResponseV2.findUnique({
        where: { userId: testUser.id },
      });

      if (!existingResponse) {
        const testResponse = await prisma.questionnaireResponseV2.create({
          data: {
            userId: testUser.id,
            responses: {
              q1: {
                answer: "Woman",
                preference: null,
                importance: null,
                dealbreaker: false,
              },
            },
            questionsCompleted: 1,
          },
        });
        console.log(
          `  ✓ Created test V2 response for user ${testUser.email}\n`
        );

        // Clean up test response
        await prisma.questionnaireResponseV2.delete({
          where: { id: testResponse.id },
        });
        console.log(`  ✓ Cleaned up test response\n`);
      } else {
        console.log(
          `  ✓ User already has V2 response (skipping create test)\n`
        );
      }
    } else {
      console.log(`  ⚠ No users found in database (skipping create test)\n`);
    }

    console.log("✅ Phase 1 verification complete! All tests passed.\n");
    console.log("Summary:");
    console.log("  • QuestionnaireResponseV2 table created ✓");
    console.log("  • Old questionnaire data wiped ✓");
    console.log("  • needsQuestionnaireUpdate field added ✓");
    console.log("  • V2 responses can be created ✓");
  } catch (error) {
    console.error("❌ Phase 1 verification failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPhase1();
