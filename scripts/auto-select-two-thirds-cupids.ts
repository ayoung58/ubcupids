/**
 * Script: Auto-Select for Two-Thirds of Test Cupids
 *
 * This script automatically makes random match selections for approximately
 * 2/3 of TEST cupids with pending assignments. This simulates real-world
 * completion rates where not all cupids complete their assignments.
 *
 * SAFETY: Only touches TEST users (isTestUser = true)
 *
 * Usage: npx tsx scripts/auto-select-two-thirds-cupids.ts
 */

import { prisma } from "../lib/prisma";
import { submitCupidSelection } from "../lib/matching/cupid";

// Sample rationales for random selection
const RATIONALES = [
  "They share similar interests and values based on their questionnaire responses.",
  "Great compatibility on communication styles and relationship goals.",
  "Strong alignment on life priorities and future plans.",
  "Their personalities seem like they would complement each other well.",
  "Similar interests in hobbies and activities, should have lots to talk about.",
  "Both seem to value similar things in a relationship.",
  "Their answers suggest they have compatible lifestyles.",
  "Good match on both personality traits and practical preferences.",
  "They both expressed similar values about what matters most to them.",
  "Strong compatibility across multiple dimensions of the questionnaire.",
  "They complement each other well in terms of communication and values.",
  "Both expressed interest in similar activities and life goals.",
  "Their responses show great emotional compatibility.",
  "I think they would have good chemistry based on their answers.",
  "They seem to be looking for similar things in a relationship.",
];

function getRandomRationale(): string {
  return RATIONALES[Math.floor(Math.random() * RATIONALES.length)];
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function autoSelectTwoThirdsCupids() {
  console.log("🎯 Starting automatic selections for ~2/3 of TEST cupids...\n");

  // SAFETY CHECK: Verify we're only getting TEST users
  const allCupids = await prisma.user.findMany({
    where: {
      isCupid: true,
      isTestUser: false, // Check if there are any production cupids
    },
    select: { id: true, email: true },
  });

  if (allCupids.length > 0) {
    console.log(
      "⚠️  WARNING: Found production cupids in database. Script will only touch TEST users.\n",
    );
  }

  // Get all TEST cupids with pending assignments
  const pendingAssignments = await prisma.cupidAssignment.findMany({
    where: {
      selectedMatchId: null, // Not yet reviewed
      cupidUser: {
        isTestUser: true, // CRITICAL: Only process test cupids
      },
    },
    include: {
      cupidUser: {
        select: {
          id: true,
          firstName: true,
          cupidDisplayName: true,
          isTestUser: true,
          email: true,
        },
      },
      candidate: {
        select: {
          id: true,
          firstName: true,
          isTestUser: true,
        },
      },
    },
  });

  if (pendingAssignments.length === 0) {
    console.log(
      "✅ No pending assignments found. All cupids have completed their selections!",
    );
    return;
  }

  // SAFETY CHECK: Verify all assignments are for test users
  const nonTestAssignments = pendingAssignments.filter(
    (a) => !a.cupidUser.isTestUser || !a.candidate.isTestUser,
  );

  if (nonTestAssignments.length > 0) {
    console.error("❌ ERROR: Found assignments involving production users!");
    console.error("   This should never happen. Aborting for safety.");
    process.exit(1);
  }

  console.log(
    `📊 Found ${pendingAssignments.length} pending assignments from TEST cupids\n`,
  );

  // Calculate 2/3 of assignments (round down for conservative approach)
  const twoThirds = Math.floor((pendingAssignments.length * 2) / 3);
  console.log(`🎲 Will process approximately 2/3 = ${twoThirds} assignments\n`);

  // Shuffle and select 2/3 of the assignments
  const shuffledAssignments = shuffleArray(pendingAssignments);
  const selectedAssignments = shuffledAssignments.slice(0, twoThirds);
  const skippedAssignments = shuffledAssignments.slice(twoThirds);

  console.log("📝 Selected assignments to process:");
  console.log(`   - Processing: ${selectedAssignments.length}`);
  console.log(`   - Leaving incomplete: ${skippedAssignments.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  console.log("🚀 Processing selected assignments...\n");

  for (const assignment of selectedAssignments) {
    const cupidName =
      assignment.cupidUser.cupidDisplayName || assignment.cupidUser.firstName;
    const candidateName = assignment.candidate.firstName;

    // Parse potential matches from JSON
    const potentialMatches = assignment.potentialMatches as Array<{
      userId: string;
      score: number;
    }>;

    if (!potentialMatches || potentialMatches.length === 0) {
      console.log(
        `⚠️  Assignment ${assignment.id} has no potential matches. Skipping.`,
      );
      errorCount++;
      continue;
    }

    // Select a random match from the options
    const randomIndex = Math.floor(Math.random() * potentialMatches.length);
    const selectedMatch = potentialMatches[randomIndex];

    try {
      // Generate a random rationale
      const rationale = getRandomRationale();

      // Submit the selection
      await submitCupidSelection(
        assignment.id,
        assignment.cupidUserId,
        selectedMatch.userId,
        rationale,
      );

      console.log(
        `✅ ${cupidName} → selected match ${randomIndex + 1}/${potentialMatches.length} for ${candidateName} (Score: ${selectedMatch.score.toFixed(1)}%)`,
      );
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to submit selection for ${cupidName}:`, error);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successful selections: ${successCount}`);
  console.log(`❌ Failed selections: ${errorCount}`);
  console.log(
    `⏭️  Left incomplete (for realism): ${skippedAssignments.length}`,
  );
  console.log(`📝 Total assignments processed: ${selectedAssignments.length}`);
  console.log(`📌 Total assignments available: ${pendingAssignments.length}`);
  console.log(
    `📈 Completion rate: ${((successCount / pendingAssignments.length) * 100).toFixed(1)}%`,
  );

  if (skippedAssignments.length > 0) {
    console.log(
      "\n🔍 Cupids who were NOT assigned (left incomplete for realism):",
    );
    const skippedCupidNames = new Set<string>();
    for (const assignment of skippedAssignments) {
      const cupidName =
        assignment.cupidUser.cupidDisplayName || assignment.cupidUser.firstName;
      const candidateName = assignment.candidate.firstName;
      skippedCupidNames.add(cupidName);
      console.log(`   - ${cupidName} (candidate: ${candidateName})`);
    }
  }

  console.log("\n✅ Script completed successfully!");
  console.log(
    "💡 You can now manually reveal matches to test the match reveal screen!",
  );
}

// Run the script
autoSelectTwoThirdsCupids()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed with error:", error);
    process.exit(1);
  });
