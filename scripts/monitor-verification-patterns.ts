/**
 * Monitor Email Verification Patterns
 *
 * Run this script after deploying the POST-based verification fix
 * to ensure email scanners are no longer auto-verifying accounts.
 *
 * Expected behavior after fix:
 * - No instant verifications (< 5 seconds)
 * - Verification times should be more varied (30+ seconds typical)
 * - Users who don't click button won't be verified
 */

import { prisma } from "../lib/prisma";

async function monitorVerifications() {
  console.log("🔍 Monitoring Email Verification Patterns\n");
  console.log("Checking verifications from the last hour...\n");

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentVerifications = await prisma.user.findMany({
    where: {
      emailVerified: {
        gte: oneHourAgo,
      },
      isTestUser: false,
    },
    select: {
      email: true,
      createdAt: true,
      emailVerified: true,
    },
    orderBy: {
      emailVerified: "desc",
    },
  });

  if (recentVerifications.length === 0) {
    console.log("✅ No verifications in the last hour.\n");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${recentVerifications.length} verifications:\n`);

  let suspiciousCount = 0;
  let normalCount = 0;

  for (const user of recentVerifications) {
    const created = user.createdAt;
    const verified = user.emailVerified!;
    const diff = verified.getTime() - created.getTime();
    const seconds = Math.round(diff / 1000);

    let status = "";
    let emoji = "";

    if (seconds < 5) {
      status = "🚨 INSTANT (< 5s) - SUSPICIOUS!";
      emoji = "🚨";
      suspiciousCount++;
    } else if (seconds < 30) {
      status = "⚠️  Fast (< 30s) - Possibly scanner";
      emoji = "⚠️";
      suspiciousCount++;
    } else {
      status = "✅ Normal (> 30s)";
      emoji = "✅";
      normalCount++;
    }

    console.log(`${emoji} ${user.email}`);
    console.log(`   Created: ${created.toISOString()}`);
    console.log(`   Verified: ${verified.toISOString()}`);
    console.log(`   Time: ${seconds} seconds - ${status}`);
    console.log("");
  }

  console.log("\n📊 Summary:");
  console.log(`   Normal verifications (> 30s): ${normalCount}`);
  console.log(`   Suspicious verifications (< 30s): ${suspiciousCount}`);

  if (suspiciousCount > 0) {
    console.log("\n⚠️  WARNING: Still seeing fast verifications!");
    console.log("   This might indicate:");
    console.log("   1. Email scanners are still triggering verifications");
    console.log("   2. Users are clicking very quickly (check logs)");
    console.log("   3. The POST fix hasn't been deployed yet");
    console.log(
      "\n   Check server logs for [Verify POST] entries to confirm user-initiated verifications."
    );
  } else {
    console.log("\n✅ All verifications show normal timing patterns!");
    console.log("   The POST-based verification fix appears to be working.");
  }

  await prisma.$disconnect();
}

monitorVerifications().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
