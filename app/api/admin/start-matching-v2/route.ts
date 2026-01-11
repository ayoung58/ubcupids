import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { runMatchingV2 } from "@/lib/matching/orchestratorV2";

/**
 * Start V2 Matching Algorithm
 * POST /api/admin/start-matching-v2
 *
 * Runs the V2 matching algorithm with Blossom optimization
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

    // Single batch system - always use batch 1
    const batchNumber = 1;

    // Check if batch exists, create if not
    let batch = await prisma.matchingBatch.findUnique({
      where: { batchNumber },
    });

    if (!batch) {
      batch = await prisma.matchingBatch.create({
        data: {
          batchNumber,
          status: "pending",
        },
      });
    }

    // Check if cupid assignments already exist
    const existingAssignments = await prisma.cupidAssignment.count({
      where: { batchNumber },
    });

    if (existingAssignments > 0) {
      return NextResponse.json(
        {
          error:
            "Cupid assignments already exist. Clear matches first to run matching again.",
        },
        { status: 400 }
      );
    }

    // Check if matches have been revealed
    const revealedMatches = await prisma.match.count({
      where: { batchNumber, revealedAt: { not: null } },
    });

    if (revealedMatches > 0) {
      return NextResponse.json(
        {
          error:
            "Matches have already been revealed. Clear matches first to run matching again.",
        },
        { status: 400 }
      );
    }

    // Run the V2 matching algorithm
    console.log("Starting V2 matching algorithm...");
    const startTime = Date.now();

    const result = await runMatchingV2(batchNumber);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`V2 matching completed in ${duration}s`);

    return NextResponse.json({
      message: "V2 matching algorithm completed successfully",
      duration: `${duration}s`,
      result: {
        batchNumber: result.batchNumber,
        totalUsers: result.totalUsers,
        eligibleUsers: result.eligibleUsers,
        ineligibleUsers: result.ineligibleUsers,
        totalPairsEvaluated: result.totalPairsEvaluated,
        filteredByDealbreaker: result.filteredByDealbreaker,
        filteredByThreshold: result.filteredByThreshold,
        eligiblePairs: result.eligiblePairs,
        finalMatches: result.finalMatches,
        matchedUsers: result.matchedUsers,
        unmatchedUsers: result.unmatchedUsers,
        averageScore: result.averageScore,
      },
    });
  } catch (error) {
    console.error("Error starting V2 matching:", error);

    // Provide detailed error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to start V2 matching algorithm",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
