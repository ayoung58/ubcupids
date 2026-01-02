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

    // Single batch system - always use batch 1
    const batchNumber = 1;

    // Check if cupid assignments exist
    const assignments = await prisma.cupidAssignment.findMany({
      where: { batchNumber },
      select: {
        cupidUserId: true,
        candidateId: true,
      },
    });

    if (assignments.length === 0) {
      return NextResponse.json(
        {
          error:
            "No cupid assignments found. Pair cupids with candidates first.",
        },
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
          totalScore: "desc",
        },
        take: 5,
        select: {
          userId: true,
          targetUserId: true,
          totalScore: true,
        },
      });

      revealed += topScores.length;
    }

    return NextResponse.json({
      message: "Revealed top 5 matches to cupids",
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
