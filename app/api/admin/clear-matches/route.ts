import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Clear All Matches for Current Batch
 * POST /api/admin/clear-matches
 *
 * Deletes all matches for the current batch
 */
export async function POST(request: NextRequest) {
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

    // Get current batch
    const batches = await prisma.matchingBatch.findMany({
      orderBy: { batchNumber: "desc" },
      take: 1,
    });

    const currentBatch = batches[0]?.batchNumber || 1;

    // Delete all matches for current batch
    const matchResult = await prisma.match.deleteMany({
      where: { batchNumber: currentBatch },
    });

    // Delete compatibility scores for current batch
    const scoreResult = await prisma.compatibilityScore.deleteMany({
      where: { batchNumber: currentBatch },
    });

    // Delete cupid assignments for current batch
    const assignmentResult = await prisma.cupidAssignment.deleteMany({
      where: { batchNumber: currentBatch },
    });

    // Reset batch status
    await prisma.matchingBatch.update({
      where: { batchNumber: currentBatch },
      data: {
        status: "pending",
        totalUsers: 0,
        totalPairs: 0,
        algorithmMatches: 0,
        cupidMatches: 0,
        scoringStartedAt: null,
        scoringCompletedAt: null,
        matchingStartedAt: null,
        matchingCompletedAt: null,
        revealedAt: null,
      },
    });

    return NextResponse.json({
      message: `Cleared all matches for batch ${currentBatch}`,
      matchesDeleted: matchResult.count,
      scoresDeleted: scoreResult.count,
      assignmentsDeleted: assignmentResult.count,
      batch: currentBatch,
    });
  } catch (error) {
    console.error("Error clearing matches:", error);
    return NextResponse.json(
      { error: "Failed to clear matches" },
      { status: 500 }
    );
  }
}
