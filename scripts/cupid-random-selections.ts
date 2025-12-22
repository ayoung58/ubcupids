/**
 * Test Script: Random Cupid Selections
 *
 * This script automatically makes random match selections for all cupids
 * with pending assignments. Useful for testing the complete workflow.
 *
 * Usage: npx tsx scripts/cupid-random-selections.ts
 */

import { prisma } from "../lib/prisma";
import { submitCupidSelection } from "../lib/matching/cupid";

async function makeCupidRandomSelections() {
  console.log("Starting random cupid selections for testing...\n");

  // Get all cupids with pending assignments
  const pendingAssignments = await prisma.cupidAssignment.findMany({
    where: {
      selectedMatchId: null, // Not yet reviewed
    },
    include: {
      cupidUser: {
        select: {
          firstName: true,
          cupidDisplayName: true,
        },
      },
      candidate: {
        select: {
          firstName: true,
        },
      },
    },
  });

  if (pendingAssignments.length === 0) {
    console.log("No pending assignments found. All cupids are done!");
    return;
  }

  console.log(`Found ${pendingAssignments.length} pending assignments\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const assignment of pendingAssignments) {
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
        `⚠️  Assignment ${assignment.id} has no potential matches. Skipping.`
      );
      errorCount++;
      continue;
    }

    // Select a random match from the 5 options
    const randomIndex = Math.floor(Math.random() * potentialMatches.length);
    const selectedMatch = potentialMatches[randomIndex];

    try {
      // Submit the selection
      await submitCupidSelection(
        assignment.id,
        assignment.cupidUserId,
        selectedMatch.userId,
        `[TEST] Random selection (match ${randomIndex + 1} of ${potentialMatches.length}, score: ${selectedMatch.score.toFixed(1)}%)`
      );

      console.log(
        `✓ ${cupidName} selected match ${randomIndex + 1}/${potentialMatches.length} for ${candidateName} (score: ${selectedMatch.score.toFixed(1)}%)`
      );
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to submit selection for ${cupidName}:`, error);
      errorCount++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`✓ Successful selections: ${successCount}`);
  console.log(`✗ Failed selections: ${errorCount}`);
  console.log(`Total processed: ${pendingAssignments.length}`);

  // Show breakdown by cupid
  const cupidCounts = new Map<string, number>();
  for (const assignment of pendingAssignments) {
    const cupidId = assignment.cupidUserId;
    cupidCounts.set(cupidId, (cupidCounts.get(cupidId) || 0) + 1);
  }

  console.log(`\nAssignments per cupid:`);
  const assignmentsWithCupids = await prisma.cupidAssignment.groupBy({
    by: ["cupidUserId"],
    where: {
      selectedMatchId: { not: null },
    },
    _count: true,
  });

  for (const group of assignmentsWithCupids) {
    const cupid = await prisma.user.findUnique({
      where: { id: group.cupidUserId },
      select: { firstName: true, cupidDisplayName: true },
    });
    const cupidName = cupid?.cupidDisplayName || cupid?.firstName || "Unknown";
    console.log(`  ${cupidName}: ${group._count} selections made`);
  }
}

// Run the script
makeCupidRandomSelections()
  .then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script failed:", error);
    process.exit(1);
  });
