import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Reveal Top 5 Matches to Cupids
 * POST /api/admin/reveal-top-5
 *
 * Makes the top 5 algorithm matches visible to cupids for their assigned candidates
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

    // Get all cupid assignments for this batch
    const assignments = await prisma.cupidAssignment.findMany({
      where: { batchNumber },
      select: {
        cupidUserId: true,
        candidateId: true,
      },
    });

    if (assignments.length === 0) {
      return NextResponse.json(
        { error: "No cupid assignments found for this batch" },
        { status: 400 }
      );
    }

    // For each assignment, get top 5 compatibility scores and create/update them
    let revealed = 0;

    for (const assignment of assignments) {
      // Get top 5 compatibility scores for the candidate
      const topScores = await prisma.compatibilityScore.findMany({
        where: {
          userId: assignment.candidateId,
          batchNumber,
        },
        orderBy: {
          score: "desc",
        },
        take: 5,
        select: {
          userId: true,
          targetUserId: true,
          score: true,
        },
      });

      // Update or create the scores with revealedToCupidAt timestamp
      for (const score of topScores) {
        await prisma.compatibilityScore.update({
          where: {
            userId_targetUserId_batchNumber: {
              userId: score.userId,
              targetUserId: score.targetUserId,
              batchNumber,
            },
          },
          data: {
            revealedToCupidAt: new Date(),
          },
        });
        revealed++;
      }
    }

    return NextResponse.json({
      message: `Revealed top 5 matches to cupids for batch ${batchNumber}`,
      revealed,
      assignments: assignments.length,
    });
  } catch (error) {
    console.error("Error revealing top 5:", error);
    return NextResponse.json(
      { error: "Failed to reveal top 5 to cupids" },
      { status: 500 }
    );
  }
}
