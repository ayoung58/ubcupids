import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Reveal Matches to Production Candidates ONLY
 * POST /api/admin/reveal-matches-production
 *
 * Makes all matches visible to production match candidates only
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

    // Check if matches exist for non-test users
    const matchCount = await prisma.match.count({
      where: {
        batchNumber,
        user: { isTestUser: false },
      },
    });

    if (matchCount === 0) {
      return NextResponse.json(
        {
          error: "No matches found for production users. Create matches first.",
        },
        { status: 400 }
      );
    }

    // Step 1: Cupid-initiated matches handled by existing cupid system

    // Step 2: Update all matches for non-test users to set revealedAt timestamp
    // Also update the batch revealedAt only when production users are revealed
    const result = await prisma.match.updateMany({
      where: {
        batchNumber,
        revealedAt: null,
        user: { isTestUser: false },
      },
      data: {
        revealedAt: new Date(),
      },
    });

    // Update batch status when production matches are revealed
    await prisma.matchingBatch.update({
      where: { batchNumber },
      data: {
        revealedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Revealed ${result.count} matches to production candidates`,
      revealed: result.count,
    });
  } catch (error) {
    console.error("Error revealing matches for production users:", error);
    return NextResponse.json(
      { error: "Failed to reveal matches to production candidates" },
      { status: 500 }
    );
  }
}
