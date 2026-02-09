/**
 * Cleanup Orphaned Questionnaire Responses
 *
 * This script removes questionnaire responses (V2) where the associated user
 * has been deleted but the response wasn't cascade deleted.
 *
 * Usage: npx tsx scripts/cleanup-orphaned-responses.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupOrphanedResponses() {
  console.log("🔍 Scanning for orphaned questionnaire responses...\n");

  try {
    // Get all questionnaire responses
    const allResponses = await prisma.questionnaireResponseV2.findMany({
      select: {
        id: true,
        userId: true,
      },
    });

    console.log(`Found ${allResponses.length} total questionnaire responses`);

    // Get all user IDs that exist
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
      },
    });

    const existingUserIds = new Set(existingUsers.map((u) => u.id));
    console.log(`Found ${existingUserIds.size} existing users\n`);

    // Find orphaned responses
    const orphanedResponses = allResponses.filter(
      (response) => !existingUserIds.has(response.userId),
    );

    if (orphanedResponses.length === 0) {
      console.log("✅ No orphaned responses found. Database is clean!");
      return;
    }

    console.log(`⚠️  Found ${orphanedResponses.length} orphaned responses:`);
    orphanedResponses.forEach((response, index) => {
      console.log(
        `  ${index + 1}. Response ID: ${response.id}, User ID: ${response.userId}`,
      );
    });

    console.log("\n🗑️  Deleting orphaned responses...");

    // Delete orphaned responses
    const deleteResult = await prisma.questionnaireResponseV2.deleteMany({
      where: {
        id: {
          in: orphanedResponses.map((r) => r.id),
        },
      },
    });

    console.log(
      `✅ Deleted ${deleteResult.count} orphaned questionnaire responses`,
    );
    console.log("\n✨ Cleanup complete!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupOrphanedResponses()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
