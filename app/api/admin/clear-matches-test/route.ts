import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Clear All Matches for Test Users
 * POST /api/admin/clear-matches-test
 *
 * Deletes all matches, scores, and assignments for test users only
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

    // Delete all matches for test users
    const matchResult = await prisma.match.deleteMany({
      where: {
        batchNumber,
        user: { isTestUser: true },
      },
    });

    // Delete compatibility scores for test users
    const scoreResult = await prisma.compatibilityScore.deleteMany({
      where: {
        batchNumber,
        user: { isTestUser: true },
      },
    });

    // Delete cupid assignments for test users
    const assignmentResult = await prisma.cupidAssignment.deleteMany({
      where: {
        batchNumber,
        candidate: { isTestUser: true },
      },
    });

    return NextResponse.json({
      message: `Cleared all matches for test users in batch ${batchNumber}`,
      matchesDeleted: matchResult.count,
      scoresDeleted: scoreResult.count,
      assignmentsDeleted: assignmentResult.count,
      batch: batchNumber,
    });
  } catch (error) {
    console.error("Error clearing test user matches:", error);
    return NextResponse.json(
      { error: "Failed to clear test user matches" },
      { status: 500 }
    );
  }
}
