/**
 * Script to reset questionnaire data for users
 * Use this if encrypted data became corrupted during the encryption migration
 *
 * Usage:
 * - Reset all users: npm run reset-questionnaire
 * - Reset specific user: npm run reset-questionnaire -- user@example.com
 */

import { prisma } from "../lib/prisma";

async function resetQuestionnaireData(userEmail?: string) {
  try {
    if (userEmail) {
      // Reset specific user
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, email: true },
      });

      if (!user) {
        console.error(`❌ User not found: ${userEmail}`);
        return;
      }

      const deleted = await prisma.questionnaireResponse.delete({
        where: { userId: user.id },
      });

      console.log(`✅ Reset questionnaire data for ${user.email}`);
      console.log(`   - Questions answered: ${deleted ? "cleared" : "none"}`);
    } else {
      // Reset all users
      const count = await prisma.questionnaireResponse.deleteMany({
        where: { isSubmitted: false }, // Only delete drafts, not submitted questionnaires
      });

      console.log(`✅ Reset ${count.count} draft questionnaire(s)`);
      console.log("   (Submitted questionnaires were preserved)");
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      console.log("ℹ️  No questionnaire data to reset");
    } else {
      console.error("❌ Error resetting questionnaire data:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line args
const userEmail = process.argv[2];

resetQuestionnaireData(userEmail).catch(console.error);
