import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { runMatching } from "@/lib/matching/algorithm";

/**
 * Start Matching Algorithm
 * POST /api/admin/start-matching
 *
 * Runs the matching algorithm for a specific batch
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

    const body = await request.json();
    const { batchNumber } = body;

    if (!batchNumber || (batchNumber !== 1 && batchNumber !== 2)) {
      return NextResponse.json(
        { error: "Invalid batch number" },
        { status: 400 }
      );
    }

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

    // Check if cupid assignments already exist for this batch
    const existingAssignments = await prisma.cupidAssignment.count({
      where: { batchNumber },
    });

    if (existingAssignments > 0) {
      return NextResponse.json(
        {
          error:
            "Cupid assignments already exist for this batch. Clear matches first to run matching again.",
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
            "Matches have already been revealed for this batch. Clear matches first to run matching again.",
        },
        { status: 400 }
      );
    }

    // Run the matching algorithm
    const result = await runMatching(batchNumber);

    return NextResponse.json({
      message: `Matching algorithm completed for batch ${batchNumber}`,
      result,
    });
  } catch (error) {
    console.error("Error starting matching:", error);
    return NextResponse.json(
      { error: "Failed to start matching algorithm" },
      { status: 500 }
    );
  }
}
