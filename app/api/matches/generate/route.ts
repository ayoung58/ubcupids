/**
 * Matches Generation API - Admin Only
 *
 * POST /api/matches/generate
 * Triggers the matching algorithm for a batch
 *
 * This is protected by an admin secret key in the request header
 * for now (no admin UI yet).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  runMatching,
  clearBatchData,
  getMatchingStats,
} from "@/lib/matching/algorithm";
import {
  assignPairsToCupids,
  createCupidApprovedMatches,
  revealMatches,
} from "@/lib/matching/cupid";
import { CURRENT_BATCH, RUN_MATCHING } from "@/lib/matching/config";

// Admin secret for protecting this endpoint
const ADMIN_SECRET =
  process.env.MATCHING_ADMIN_SECRET || "dev-secret-change-in-production";

/**
 * Verify admin authorization
 */
function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get("x-admin-secret");
  return authHeader === ADMIN_SECRET;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid admin secret" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action as string;
    const batchNumber = (body.batchNumber as number) || CURRENT_BATCH;

    switch (action) {
      case "run_matching": {
        // Check if matching is enabled
        if (!RUN_MATCHING) {
          return NextResponse.json(
            {
              error:
                "Matching is not enabled. Set RUN_MATCHING=true in config.",
            },
            { status: 400 }
          );
        }

        const result = await runMatching(batchNumber);
        return NextResponse.json({
          success: true,
          message: `Matching completed for batch ${batchNumber}`,
          result,
        });
      }

      case "assign_cupids": {
        const result = await assignPairsToCupids(batchNumber);
        return NextResponse.json({
          success: true,
          message: "Pairs assigned to cupids",
          result,
        });
      }

      case "finalize_cupid_matches": {
        const result = await createCupidApprovedMatches(batchNumber);
        return NextResponse.json({
          success: true,
          message: "Cupid-approved matches created",
          result,
        });
      }

      case "reveal_matches": {
        const count = await revealMatches(batchNumber);
        return NextResponse.json({
          success: true,
          message: `Revealed ${count} matches`,
          count,
        });
      }

      case "get_stats": {
        const stats = await getMatchingStats(batchNumber);
        return NextResponse.json({
          success: true,
          stats,
        });
      }

      case "clear_batch": {
        // Safety check - require explicit confirmation
        if (body.confirm !== "DELETE_ALL_DATA") {
          return NextResponse.json(
            { error: 'Must confirm with confirm: "DELETE_ALL_DATA"' },
            { status: 400 }
          );
        }

        await clearBatchData(batchNumber);
        return NextResponse.json({
          success: true,
          message: `Cleared all data for batch ${batchNumber}`,
        });
      }

      default:
        return NextResponse.json(
          {
            error: "Invalid action",
            validActions: [
              "run_matching",
              "assign_cupids",
              "finalize_cupid_matches",
              "reveal_matches",
              "get_stats",
              "clear_batch",
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Matching generation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint for checking status
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid admin secret" },
        { status: 401 }
      );
    }

    const batchNumber = parseInt(
      request.nextUrl.searchParams.get("batch") || String(CURRENT_BATCH)
    );
    const stats = await getMatchingStats(batchNumber);

    return NextResponse.json({
      batchNumber,
      config: {
        RUN_MATCHING,
        CURRENT_BATCH,
      },
      stats,
    });
  } catch (error) {
    console.error("Error getting matching status:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
