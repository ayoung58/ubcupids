/**
 * Script to retry sending cupid deadline emails to failed recipients
 *
 * This script sends emails ONLY to those cupids whose emails failed
 * in the previous attempt due to rate limiting.
 *
 * Uses 500ms delay between sends (2 requests per second) to respect
 * Resend's rate limit.
 *
 * Usage:
 * npx tsx scripts/retry-failed-cupid-emails.ts
 */

import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import CupidDeadlineEmail from "../emails/CupidDeadlineEmail";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "UBCupids <support@ubcupids.org>";

// List of emails that failed in the previous send attempt
const FAILED_EMAILS = [
  "aheimlic@student.ubc.ca",
  "alexmak1@student.ubc.ca",
  "anacao1@student.ubc.ca",
  "arunark3@student.ubc.ca",
  "ashw22@student.ubc.ca",
  "ayoung26@student.ubc.ca",
  "bbhardwa@student.ubc.ca",
  "brjknox@student.ubc.ca",
  "bxiang@student.ubc.ca",
  "byi01@student.ubc.ca",
  "chriss03@student.ubc.ca",
  "ckuo02@student.ubc.ca",
  "coenc@student.ubc.ca",
  "dlee5@student.ubc.ca",
  "efurland@student.ubc.ca",
  "ehao02@student.ubc.ca",
  "esu06@student.ubc.ca",
  "eyxliq@student.ubc.ca",
  "ghilares@student.ubc.ca",
  "gleung13@student.ubc.ca",
  "hghorb01@student.ubc.ca",
  "hjin09@student.ubc.ca",
  "hruthe01@student.ubc.ca",
  "iimrosie@student.ubc.ca",
  "imathroc@student.ubc.ca",
  "javaheri@student.ubc.ca",
  "jchen007@student.ubc.ca",
  "jliu264@student.ubc.ca",
  "jyfu24@student.ubc.ca",
  "klam47@student.ubc.ca",
  "ks7226@student.ubc.ca",
  "lsolanil@student.ubc.ca",
  "lzhu29@student.ubc.ca",
  "mlastovk@student.ubc.ca",
  "mnguye33@student.ubc.ca",
  "mtoy01@student.ubc.ca",
  "mwang108@student.ubc.ca",
  "pjhcy@student.ubc.ca",
  "prisingh@student.ubc.ca",
  "ranzara@student.ubc.ca",
  "rchai@student.ubc.ca",
  "rolive02@student.ubc.ca",
  "rramanba@student.ubc.ca",
  "serenec@student.ubc.ca",
  "shar1106@student.ubc.ca",
  "sophiaz4@student.ubc.ca",
  "sterry18@student.ubc.ca",
  "syafitri@student.ubc.ca",
  "tethysmo@student.ubc.ca",
  "timj26@student.ubc.ca",
  "tyu15@student.ubc.ca",
  "vlcmj@student.ubc.ca",
  "vpavarit@student.ubc.ca",
  "xinyi72@student.ubc.ca",
  "yanzha0@student.ubc.ca",
  "yisi4@student.ubc.ca",
  "yjian126@student.ubc.ca",
  "zoe1213@student.ubc.ca",
];

async function retryFailedEmails() {
  try {
    console.log("\n🔄 Retrying failed cupid deadline emails...\n");
    console.log(
      `📧 Total failed recipients to retry: ${FAILED_EMAILS.length}\n`,
    );

    // Get user information for failed emails
    const recipients = await prisma.user.findMany({
      where: {
        email: {
          in: FAILED_EMAILS,
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

    if (recipients.length === 0) {
      console.log("⚠️  No recipients found in database. Exiting...");
      return;
    }

    console.log(`✅ Found ${recipients.length} recipients in database\n`);
    console.log(
      "📤 Starting to send emails with 500ms delay between each...\n",
    );

    // Send emails with proper rate limiting
    let successCount = 0;
    let failCount = 0;
    const failedAgain: string[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

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
          failedAgain.push(recipient.email);
        } else {
          console.log(
            `✅ [${i + 1}/${recipients.length}] Sent to ${recipient.email} (ID: ${data?.id})`,
          );
          successCount++;
        }

        // Wait 500ms between sends (2 requests per second)
        // Skip delay after last email
        if (i < recipients.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`❌ Error sending to ${recipient.email}:`, error);
        failCount++;
        failedAgain.push(recipient.email);

        // Still wait before next attempt
        if (i < recipients.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Retry Email Send Summary:");
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📧 Total attempted: ${recipients.length}`);
    console.log("=".repeat(60));

    if (failedAgain.length > 0) {
      console.log("\n⚠️  The following emails failed again:");
      failedAgain.forEach((email) => console.log(`   - ${email}`));
      console.log(
        "\nYou may need to manually investigate these or try again later.",
      );
    }

    console.log("");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
console.log("\n⏳ Starting in 3 seconds...");
console.log("Press Ctrl+C to cancel\n");

setTimeout(() => {
  retryFailedEmails();
}, 3000);
