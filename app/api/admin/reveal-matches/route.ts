import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import * as cupidLib from "@/lib/matching/cupid";

/**
 * Reveal Matches to Candidates
 * POST /api/admin/reveal-matches
 *
 * Makes all matches (algorithm + cupid) visible to match candidates
 * Also automatically makes random selections for test cupids before revealing
 */
export async function POST() {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Single batch system for 2026
    const batchNumber = 1;

    // Check if matches exist for this batch
    const matchCount = await prisma.match.count({
      where: { batchNumber },
    });

    if (matchCount === 0) {
      return NextResponse.json(
        { error: "No matches found for this batch. Create matches first." },
        { status: 400 }
      );
    }

    // Step 1: Automatically make random selections for test cupids
    const autoSelectionResult = await cupidLib.makeTestCupidRandomSelections();
    console.log(
      `Auto-selected ${autoSelectionResult.successful} matches for test cupids before reveal`
    );

    // Step 2: Create Match records from ALL cupid selections (including test cupids)
    const cupidMatchResult =
      await cupidLib.createCupidSelectedMatches(batchNumber);
    console.log(
      `Created ${cupidMatchResult.created} cupid-initiated matches (${cupidMatchResult.skipped} skipped)`
    );

    // Step 3: Update all matches for this batch to set revealedAt timestamp
    const result = await prisma.match.updateMany({
      where: {
        batchNumber,
        revealedAt: null, // Only update unrevealed matches
      },
      data: {
        revealedAt: new Date(),
      },
    });

    // Update batch status
    await prisma.matchingBatch.update({
      where: { batchNumber },
      data: {
        revealedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Revealed ${result.count} matches to candidates for batch ${batchNumber}`,
      revealed: result.count,
      testCupidSelections: {
        processed: autoSelectionResult.processed,
        successful: autoSelectionResult.successful,
        skipped: autoSelectionResult.skipped,
      },
      cupidMatches: {
        created: cupidMatchResult.created,
        skipped: cupidMatchResult.skipped,
      },
    });
  } catch (error) {
    console.error("Error revealing matches:", error);
    return NextResponse.json(
      { error: "Failed to reveal matches to candidates" },
      { status: 500 }
    );
  }
}
