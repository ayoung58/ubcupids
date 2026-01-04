import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { runMatchingForTestUsers } from "../../../../lib/matching/algorithm-test";

/**
 * Start Matching Algorithm for Test Users ONLY
 * POST /api/admin/start-matching-test
 *
 * Runs the matching algorithm for test users only (isTestUser=true)
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

    // Check if cupid assignments already exist for test users
    const existingAssignments = await prisma.cupidAssignment.count({
      where: {
        batchNumber,
        candidate: { isTestUser: true },
      },
    });

    if (existingAssignments > 0) {
      return NextResponse.json(
        {
          error:
            "Cupid assignments already exist for test users. Clear test user matches first to run matching again.",
        },
        { status: 400 }
      );
    }

    // Check if matches have been revealed for test users
    const revealedMatches = await prisma.match.count({
      where: {
        batchNumber,
        revealedAt: { not: null },
        user: { isTestUser: true },
      },
    });

    if (revealedMatches > 0) {
      return NextResponse.json(
        {
          error:
            "Matches have already been revealed for test users. Clear test user matches first to run matching again.",
        },
        { status: 400 }
      );
    }

    // Run the matching algorithm for test users only
    const result = await runMatchingForTestUsers(batchNumber);

    return NextResponse.json({
      message: `Matching algorithm completed for test users (${result.totalUsers} users processed)`,
      result,
    });
  } catch (error) {
    console.error("Error starting matching for test users:", error);
    return NextResponse.json(
      { error: "Failed to start matching algorithm for test users" },
      { status: 500 }
    );
  }
}
