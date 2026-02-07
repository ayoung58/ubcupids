/**
 * Script to collect production cupid emails
 *
 * This will query the database for all users who:
 * - Have isCupid = true
 * - Have isTestUser = false (production users only)
 * - Have emailVerified (verified accounts)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getCupidEmails() {
  try {
    console.log("🔍 Querying database for production cupid emails...\n");

    // Get all production cupids with verified emails
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
        lastName: true,
        emailVerified: true,
      },
      orderBy: {
        email: "asc",
      },
    });

    console.log(
      `✅ Found ${cupids.length} production cupids with verified emails\n`,
    );

    // Display the results
    console.log("📧 Production Cupid Emails:");
    console.log("=".repeat(60));
    cupids.forEach((cupid, index) => {
      console.log(
        `${index + 1}. ${cupid.firstName} ${cupid.lastName} - ${cupid.email}`,
      );
    });
    console.log("=".repeat(60));
    console.log("");

    // Export just the emails as an array
    const emails = cupids.map((cupid) => cupid.email);
    console.log("📋 Emails array (for copying):");
    console.log(JSON.stringify(emails, null, 2));
    console.log("");

    return cupids;
  } catch (error) {
    console.error("❌ Error querying database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
getCupidEmails();
