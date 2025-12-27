import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Reset to Batch 1
 * POST /api/admin/reset-to-batch-1
 *
 * Resets the entire system back to batch 1 for testing purposes
 * WARNING: This is destructive and should only be used in development/testing
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

    // Delete all matches (all batches)
    const matchResult = await prisma.match.deleteMany({});

    // Delete all compatibility scores
    const scoreResult = await prisma.compatibilityScore.deleteMany({});

    // Delete all cupid assignments
    const assignmentResult = await prisma.cupidAssignment.deleteMany({});

    // Delete batch 2
    await prisma.matchingBatch.deleteMany({
      where: { batchNumber: 2 },
    });

    // Reset batch 1
    await prisma.matchingBatch.upsert({
      where: { batchNumber: 1 },
      create: {
        batchNumber: 1,
        status: "pending",
      },
      update: {
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
      message: "System reset to batch 1",
      matchesDeleted: matchResult.count,
      scoresDeleted: scoreResult.count,
      assignmentsDeleted: assignmentResult.count,
    });
  } catch (error) {
    console.error("Error resetting to batch 1:", error);
    return NextResponse.json(
      { error: "Failed to reset to batch 1" },
      { status: 500 }
    );
  }
}
