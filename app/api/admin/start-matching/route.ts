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
