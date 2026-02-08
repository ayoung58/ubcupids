import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import * as cupidLib from "@/lib/matching/cupid";

/**
 * Reveal Matches to Test Candidates ONLY
 * POST /api/admin/reveal-matches-test
 *
 * Makes all matches visible to test match candidates only
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

    const batchNumber = 1;

    // Check if matches exist for test users
    const matchCount = await prisma.match.count({
      where: {
        batchNumber,
        user: { isTestUser: true },
      },
    });

    if (matchCount === 0) {
      return NextResponse.json(
        { error: "No matches found for test users. Create matches first." },
        { status: 400 },
      );
    }

    // Step 1: Create Match records from cupid selections (only those already made)
    const cupidMatchResult = await cupidLib.createCupidSelectedMatches(
      batchNumber,
      true,
    ); // true = test users only
    console.log(
      `Created ${cupidMatchResult.created} cupid-initiated matches, updated ${cupidMatchResult.updated}, skipped ${cupidMatchResult.skipped}`,
    );

    // Step 2: Update all matches for test users to set revealedAt timestamp
    const result = await prisma.match.updateMany({
      where: {
        batchNumber,
        revealedAt: null,
        user: { isTestUser: true },
      },
      data: {
        revealedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Revealed ${result.count} matches to test candidates`,
      revealed: result.count,
      cupidMatches: {
        created: cupidMatchResult.created,
        updated: cupidMatchResult.updated,
        skipped: cupidMatchResult.skipped,
      },
    });
  } catch (error) {
    console.error("Error revealing matches for test users:", error);
    return NextResponse.json(
      { error: "Failed to reveal matches to test candidates" },
      { status: 500 },
    );
  }
}
