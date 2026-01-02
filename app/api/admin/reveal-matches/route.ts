import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Reveal Matches to Candidates
 * POST /api/admin/reveal-matches
 *
 * Makes all matches (algorithm + cupid) visible to match candidates
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

    // Update all matches for this batch to set revealedAt timestamp
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
    });
  } catch (error) {
    console.error("Error revealing matches:", error);
    return NextResponse.json(
      { error: "Failed to reveal matches to candidates" },
      { status: 500 }
    );
  }
}
