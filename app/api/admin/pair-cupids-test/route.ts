import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { assignCandidatesToCupidsForTestUsers } from "../../../../lib/matching/cupid-test";

/**
 * Pair Cupids with Test Candidates ONLY
 * POST /api/admin/pair-cupids-test
 *
 * Assigns test candidates to cupids for manual matching
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
        {
          error:
            "No matches found for test users. Run the matching algorithm for test users first.",
        },
        { status: 400 }
      );
    }

    // Run cupid assignment for test users only
    const result = await assignCandidatesToCupidsForTestUsers(batchNumber);

    // Update assignments with latest top 25 matches
    const assignments = await prisma.cupidAssignment.findMany({
      where: {
        batchNumber,
        candidate: { isTestUser: true },
      },
      select: {
        id: true,
        candidateId: true,
      },
    });

    let updatedCount = 0;
    for (const assignment of assignments) {
      const topScores = await prisma.compatibilityScore.findMany({
        where: {
          userId: assignment.candidateId,
          batchNumber,
          targetUser: { isTestUser: true },
        },
        orderBy: {
          totalScore: "desc",
        },
        take: 25,
        select: {
          targetUserId: true,
          totalScore: true,
        },
      });

      if (topScores.length > 0) {
        const potentialMatches = topScores.map((score) => ({
          userId: score.targetUserId,
          score: score.totalScore,
        }));

        await prisma.cupidAssignment.update({
          where: { id: assignment.id },
          data: { potentialMatches },
        });

        updatedCount++;
      }
    }

    return NextResponse.json({
      message: `Cupid assignment completed for test users and top 25 matches revealed`,
      result,
      updatedAssignments: updatedCount,
    });
  } catch (error) {
    console.error("Error pairing cupids with test candidates:", error);
    return NextResponse.json(
      { error: "Failed to pair cupids with test candidates" },
      { status: 500 }
    );
  }
}
