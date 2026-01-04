/**
 * Batch Status API
 *
 * GET /api/admin/batch-status
 * Returns the current status of the matching batch including whether matches have been revealed
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CURRENT_BATCH } from "@/lib/matching/config";

export async function GET() {
  try {
    // Get the current batch status
    const batch = await prisma.matchingBatch.findUnique({
      where: { batchNumber: CURRENT_BATCH },
      select: {
        status: true,
        revealedAt: true,
        totalUsers: true,
        algorithmMatches: true,
        cupidMatches: true,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error fetching batch status:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch status" },
      { status: 500 }
    );
  }
}
