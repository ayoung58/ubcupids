import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Reset for Batch 2
 * POST /api/admin/reset-batch-2
 *
 * Prepares the system for batch 2 by:
 * - Creating batch 2 record if it doesn't exist
 * - Resetting user match counts
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

    // Check if batch 1 has completed
    const batch1 = await prisma.matchingBatch.findUnique({
      where: { batchNumber: 1 },
    });

    if (!batch1 || batch1.status === "pending") {
      return NextResponse.json(
        { error: "Batch 1 must be completed before resetting for batch 2" },
        { status: 400 }
      );
    }

    // Create or reset batch 2
    const batch2 = await prisma.matchingBatch.upsert({
      where: { batchNumber: 2 },
      create: {
        batchNumber: 2,
        status: "pending",
      },
      update: {
        status: "pending",
        totalUsers: 0,
        totalPairs: 0,
        algorithmMatches: 0,
        cupidMatches: 0,
        scoringStartedAt: null,
        scoringCompletedAt: null,
        matchingStartedAt: null,
        matchingCompletedAt: null,
        revealedAt: null,
      },
    });

    return NextResponse.json({
      message: "System reset for batch 2",
      batch2,
    });
  } catch (error) {
    console.error("Error resetting for batch 2:", error);
    return NextResponse.json(
      { error: "Failed to reset for batch 2" },
      { status: 500 }
    );
  }
}
