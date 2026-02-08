/**
 * Script to send match reveal announcement emails
 *
 * This script sends an email to all match users who completed the questionnaire
 * AND all cupids (with deduplication). Announces that matches have been revealed
 * and provides important information about ongoing updates, statistics, and feedback.
 *
 * Sends at a rate of 1 email per 2 seconds to avoid rate limits.
 *
 * Usage:
 * - Test mode (single email): npx tsx scripts/send-match-reveal-emails.ts test
 * - Production mode (all users): npx tsx scripts/send-match-reveal-emails.ts production
 */

import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import MatchRevealEmail from "../emails/MatchRevealEmail";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "UBCupids <support@ubcupids.org>";
const TEST_EMAIL = "ayoung26@student.ubc.ca"; // Your test email
const DELAY_BETWEEN_EMAILS_MS = 2000; // 2 seconds

async function sendMatchRevealEmails(mode: "test" | "production") {
  try {
    console.log(`\n🚀 Starting email send in ${mode.toUpperCase()} mode...\n`);

    let recipients: { email: string; firstName: string }[] = [];

    if (mode === "test") {
      // Test mode: send only to the test email
      const testUser = await prisma.user.findUnique({
        where: { email: TEST_EMAIL },
        select: {
          email: true,
          firstName: true,
        },
      });

      if (!testUser) {
        console.error(`❌ Test user not found: ${TEST_EMAIL}`);
        return;
      }

      recipients = [testUser];
      console.log(`📧 Test mode: Sending to ${TEST_EMAIL}\n`);
    } else {
      // Production mode: send to all match users who completed questionnaire + all cupids
      console.log("🔍 Fetching recipients...\n");

      // Get all match users who completed the questionnaire
      const matchUsers = await prisma.user.findMany({
        where: {
          isTestUser: false,
          emailVerified: {
            not: null,
          },
          questionnaireResponseV2: {
            isSubmitted: true,
          },
        },
        select: {
          email: true,
          firstName: true,
          isCupid: true,
        },
      });

      console.log(
        `📝 Found ${matchUsers.length} match users who completed questionnaire`,
      );

      // Get all cupids (will be deduplicated with match users)
      const cupids = await prisma.user.findMany({
        where: {
          isCupid: true,
          isTestUser: false,
          emailVerified: {
            not: null,
          },
        },
        select: {
          email: true,
          firstName: true,
        },
      });

      console.log(`🏹 Found ${cupids.length} cupids`);

      // Combine and deduplicate by email
      const emailMap = new Map<string, { email: string; firstName: string }>();

      // Add match users first
      matchUsers.forEach((user) => {
        emailMap.set(user.email, {
          email: user.email,
          firstName: user.firstName,
        });
      });

      // Add cupids (will automatically deduplicate if they're also match users)
      cupids.forEach((cupid) => {
        if (!emailMap.has(cupid.email)) {
          emailMap.set(cupid.email, {
            email: cupid.email,
            firstName: cupid.firstName,
          });
        }
      });

      recipients = Array.from(emailMap.values()).sort((a, b) =>
        a.email.localeCompare(b.email),
      );

      console.log(
        `\n📧 Production mode: Sending to ${recipients.length} unique recipients`,
      );
      console.log(
        `   (${matchUsers.length} match users + ${cupids.length} cupids, deduplicated)`,
      );
      console.log(
        `⏱️  Estimated time: ${Math.ceil((recipients.length * DELAY_BETWEEN_EMAILS_MS) / 1000 / 60)} minutes\n`,
      );
    }

    if (recipients.length === 0) {
      console.log("⚠️  No recipients found. Exiting...");
      return;
    }

    // Send emails with 2-second delay between each
    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: recipient.email,
          subject: "UBCupids: Your Matches Have Been Revealed! 💘",
          react: MatchRevealEmail({
            firstName: recipient.firstName,
          }),
        });

        if (error) {
          console.error(`❌ Failed to send to ${recipient.email}:`, error);
          failCount++;
        } else {
          console.log(
            `✅ [${i + 1}/${recipients.length}] Sent to ${recipient.email} (ID: ${data?.id})`,
          );
          successCount++;
        }

        // Wait 2 seconds before sending the next email (except for the last one)
        if (i < recipients.length - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS),
          );
        }
      } catch (error) {
        console.error(`❌ Error sending to ${recipient.email}:`, error);
        failCount++;

        // Still wait before the next attempt
        if (i < recipients.length - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS),
          );
        }
      }
    }

    const endTime = Date.now();
    const totalTimeSeconds = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(totalTimeSeconds / 60);
    const seconds = totalTimeSeconds % 60;

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Email Send Summary:");
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📧 Total recipients: ${recipients.length}`);
    console.log(
      `⏱️  Total time: ${minutes}m ${seconds}s (avg ${(totalTimeSeconds / recipients.length).toFixed(1)}s per email)`,
    );
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const mode = process.argv[2];

if (mode !== "test" && mode !== "production") {
  console.error("\n❌ Invalid mode. Usage:");
  console.error(
    "  Test mode:       npx tsx scripts/send-match-reveal-emails.ts test",
  );
  console.error(
    "  Production mode: npx tsx scripts/send-match-reveal-emails.ts production\n",
  );
  process.exit(1);
}

if (mode === "production") {
  console.log(
    "\n⚠️  WARNING: You are about to send emails to ALL match users and cupids!",
  );
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");

  setTimeout(() => {
    sendMatchRevealEmails(mode);
  }, 5000);
} else {
  // Test mode - run immediately
  sendMatchRevealEmails(mode);
}
