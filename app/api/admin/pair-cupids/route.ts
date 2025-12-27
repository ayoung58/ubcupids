import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { assignCandidatesToCupids } from "@/lib/matching/cupid";

/**
 * Pair Cupids with Candidates
 * POST /api/admin/pair-cupids
 *
 * Assigns candidates to cupids for manual matching
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

    // Check if matches have been revealed
    const revealedMatches = await prisma.match.count({
      where: { batchNumber, revealedAt: { not: null } },
    });

    if (revealedMatches > 0) {
      return NextResponse.json(
        {
          error:
            "Matches have already been revealed for this batch. Clear matches first to pair cupids again.",
        },
        { status: 400 }
      );
    }

    // Run cupid assignment
    const result = await assignCandidatesToCupids(batchNumber);

    return NextResponse.json({
      message: `Cupid assignment completed for batch ${batchNumber}`,
      result,
    });
  } catch (error) {
    console.error("Error pairing cupids:", error);
    return NextResponse.json(
      { error: "Failed to pair cupids with candidates" },
      { status: 500 }
    );
  }
}
