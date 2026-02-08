/**
 * Script to send cupid deadline reminder emails
 *
 * This script sends an email to all production cupids reminding them
 * about the Feb 8 match reveal deadline and encouraging them to assign
 * matches before then for maximum visibility.
 *
 * Usage:
 * - Test mode (single email): npx tsx scripts/send-cupid-deadline-emails.ts test
 * - Production mode (all cupids): npx tsx scripts/send-cupid-deadline-emails.ts production
 */

import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import CupidDeadlineEmail from "../emails/CupidDeadlineEmail";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "UBCupids <support@ubcupids.org>";
const TEST_EMAIL = "ayoung26@student.ubc.ca"; // Your test email

async function sendCupidDeadlineEmails(mode: "test" | "production") {
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
      // Production mode: send to all production cupids
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
        orderBy: {
          email: "asc",
        },
      });

      recipients = cupids;
      console.log(
        `📧 Production mode: Sending to ${recipients.length} cupids\n`,
      );
    }

    if (recipients.length === 0) {
      console.log("⚠️  No recipients found. Exiting...");
      return;
    }

    // Send emails
    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: recipient.email,
          subject: "UBCupids: Match Reveal Coming February 8th 💘",
          react: CupidDeadlineEmail({
            firstName: recipient.firstName,
          }),
        });

        if (error) {
          console.error(`❌ Failed to send to ${recipient.email}:`, error);
          failCount++;
        } else {
          console.log(`✅ Sent to ${recipient.email} (ID: ${data?.id})`);
          successCount++;
        }

        // Add a small delay to avoid rate limiting (optional)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error sending to ${recipient.email}:`, error);
        failCount++;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Email Send Summary:");
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📧 Total recipients: ${recipients.length}`);
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
    "  Test mode:       npx tsx scripts/send-cupid-deadline-emails.ts test",
  );
  console.error(
    "  Production mode: npx tsx scripts/send-cupid-deadline-emails.ts production\n",
  );
  process.exit(1);
}

if (mode === "production") {
  console.log(
    "\n⚠️  WARNING: You are about to send emails to ALL production cupids!",
  );
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");

  setTimeout(() => {
    sendCupidDeadlineEmails(mode);
  }, 5000);
} else {
  // Test mode - run immediately
  sendCupidDeadlineEmails(mode);
}
