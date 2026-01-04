import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { runMatchingForNonTestUsers } from "../../../../lib/matching/algorithm-non-test";

/**
 * Start Matching Algorithm for Non-Test Users ONLY
 * POST /api/admin/start-matching-production
 *
 * Runs the matching algorithm for non-test users only (isTestUser=false)
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

    // Check if cupid assignments already exist for non-test users
    const existingAssignments = await prisma.cupidAssignment.count({
      where: {
        batchNumber,
        candidate: { isTestUser: false },
      },
    });

    if (existingAssignments > 0) {
      return NextResponse.json(
        {
          error:
            "Cupid assignments already exist for production users. Clear production matches first to run matching again.",
        },
        { status: 400 }
      );
    }

    // Check if matches have been revealed for non-test users
    const revealedMatches = await prisma.match.count({
      where: {
        batchNumber,
        revealedAt: { not: null },
        user: { isTestUser: false },
      },
    });

    if (revealedMatches > 0) {
      return NextResponse.json(
        {
          error:
            "Matches have already been revealed for production users. Clear production matches first to run matching again.",
        },
        { status: 400 }
      );
    }

    // Run the matching algorithm for non-test users only
    const result = await runMatchingForNonTestUsers(batchNumber);

    return NextResponse.json({
      message: `Matching algorithm completed for production users (${result.totalUsers} users processed)`,
      result,
    });
  } catch (error) {
    console.error("Error starting matching for production users:", error);
    return NextResponse.json(
      { error: "Failed to start matching algorithm for production users" },
      { status: 500 }
    );
  }
}
