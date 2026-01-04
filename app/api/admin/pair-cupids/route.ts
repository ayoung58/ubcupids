import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { assignCandidatesToCupids } from "@/lib/matching/cupid";

/**
 * Pair Cupids with Candidates
 * POST /api/admin/pair-cupids
 *
 * Assigns candidates to cupids for manual matching
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

    // Check if matches exist for this batch (matching must be run first)
    const matchCount = await prisma.match.count({
      where: { batchNumber },
    });

    if (matchCount === 0) {
      return NextResponse.json(
        {
          error:
            "No matches found for this batch. Run the matching algorithm first.",
        },
        { status: 400 }
      );
    }

    // Run cupid assignment (this also clears existing assignments)
    const result = await assignCandidatesToCupids(batchNumber);

    // After assigning cupids, update their assignments with latest top 5 matches
    const assignments = await prisma.cupidAssignment.findMany({
      where: { batchNumber },
      select: {
        id: true,
        candidateId: true,
      },
    });

    let updatedCount = 0;
    for (const assignment of assignments) {
      // Get top 25 compatibility scores for the candidate
      const topScores = await prisma.compatibilityScore.findMany({
        where: {
          userId: assignment.candidateId,
          batchNumber,
        },
        orderBy: {
          totalScore: "desc",
        },
        take: 25, // Fetch top 25 matches
        select: {
          targetUserId: true,
          totalScore: true,
        },
      });

      if (topScores.length > 0) {
        // Update the assignment with the latest potential matches
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
      message: `Cupid assignment completed and top 25 matches revealed for batch ${batchNumber}`,
      result,
      updatedAssignments: updatedCount,
    });
  } catch (error) {
    console.error("Error pairing cupids:", error);
    return NextResponse.json(
      { error: "Failed to pair cupids with candidates" },
      { status: 500 }
    );
  }
}
