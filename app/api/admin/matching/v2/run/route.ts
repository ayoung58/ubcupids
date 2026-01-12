import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { runMatchingPipeline, MatchingUser } from "@/lib/matching/v2";

/**
 * Run Matching Algorithm V2.2
 * POST /api/admin/matching/v2/run
 *
 * Runs the complete 8-phase matching algorithm:
 * 1. Hard Filtering (dealbreakers)
 * 2. Similarity Calculation
 * 3. Importance Weighting
 * 4. Directional Scoring
 * 5. Section Weighting
 * 6. Pair Score Construction
 * 7. Eligibility Thresholding
 * 8. Global Matching (Blossom)
 *
 * Request body:
 * - userIds: string[] (optional) - Specific users to match. If omitted, matches all eligible users.
 * - dryRun: boolean (optional) - If true, runs algorithm but doesn't save matches to database.
 * - includeDiagnostics: boolean (optional) - If true, returns detailed diagnostics.
 *
 * Response:
 * - runId: string - Unique ID for this matching run
 * - timestamp: string - ISO timestamp
 * - userCount: number - Number of users in matching pool
 * - pairScoresCalculated: number - Number of pair scores calculated (Phase 2-6)
 * - eligiblePairs: number - Number of pairs that passed Phase 7
 * - matchesCreated: number - Number of matches created
 * - unmatchedUsers: number - Number of users not matched
 * - diagnostics: object (optional) - Detailed phase-by-phase diagnostics
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

    // Parse request body
    const body = await request.json();
    const { userIds, dryRun = false, includeDiagnostics = false } = body;

    // Fetch users with questionnaire responses
    const usersQuery: any = {
      where: {
        isTestUser: false, // Exclude test users from production matching
        questionnaireResponseV2: {
          isSubmitted: true, // Only include users who submitted V2
        },
      },
      include: {
        questionnaireResponseV2: true, // Include full V2 response
      },
    };

    // Filter by specific user IDs if provided
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      usersQuery.where.id = { in: userIds };
    }

    const usersRaw = await prisma.user.findMany(usersQuery);

    // Transform users to MatchingUser format
    const users: MatchingUser[] = usersRaw
      .filter((u: any) => u.questionnaireResponseV2)
      .map((u: any) => {
        const responses = (u.questionnaireResponseV2?.responses as any) || {};
        const gender = responses.q1?.answer || "any";
        const interestedInGenders = responses.q2?.answer || ["any"];

        return {
          id: u.id,
          email: u.email,
          name: `${u.firstName} ${u.lastName}`,
          gender: String(gender),
          interestedInGenders: Array.isArray(interestedInGenders)
            ? interestedInGenders.map(String)
            : [String(interestedInGenders)],
          responses,
          responseRecord: u.questionnaireResponseV2!,
        };
      });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No eligible users found with completed questionnaires" },
        { status: 400 }
      );
    }

    // Run matching algorithm
    const result = runMatchingPipeline(users);

    // Generate run ID
    const runId = `match-run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Save matches to database (unless dry run)
    if (!dryRun) {
      const batchNumber = 1; // Single batch system

      // Delete existing algorithm matches for matched users
      const matchedUserIds = new Set<string>();
      result.matches.forEach((m) => {
        matchedUserIds.add(m.userAId);
        matchedUserIds.add(m.userBId);
      });

      await prisma.match.deleteMany({
        where: {
          matchType: "algorithm",
          batchNumber,
          OR: [
            { userId: { in: Array.from(matchedUserIds) } },
            { matchedUserId: { in: Array.from(matchedUserIds) } },
          ],
        },
      });

      // Create new matches (bidirectional - one record per user)
      const matchRecords = [];
      for (const m of result.matches) {
        // Create match for userA -> userB
        matchRecords.push({
          userId: m.userAId,
          matchedUserId: m.userBId,
          matchType: "algorithm",
          compatibilityScore: m.pairScore,
          batchNumber,
          status: "accepted",
        });

        // Create match for userB -> userA
        matchRecords.push({
          userId: m.userBId,
          matchedUserId: m.userAId,
          matchType: "algorithm",
          compatibilityScore: m.pairScore,
          batchNumber,
          status: "accepted",
        });
      }

      await prisma.match.createMany({
        data: matchRecords,
      });
    }

    // Prepare response
    const response: any = {
      runId,
      timestamp,
      dryRun,
      userCount: users.length,
      pairScoresCalculated: result.diagnostics.phase2to6_pairScoresCalculated,
      eligiblePairs: result.diagnostics.phase7_eligiblePairs,
      matchesCreated: result.diagnostics.phase8_matchesCreated,
      unmatchedUsers: result.diagnostics.phase8_unmatchedUsers,
    };

    // Include diagnostics if requested
    if (includeDiagnostics) {
      response.diagnostics = {
        executionTimeMs: result.diagnostics.executionTimeMs,

        phase1: {
          filteredPairs: result.diagnostics.phase1_filteredPairs,
          dealbreakers: result.diagnostics.phase1_dealbreakers,
        },

        phase2to6: {
          pairScoresCalculated:
            result.diagnostics.phase2to6_pairScoresCalculated,
          averageRawScore:
            Math.round(result.diagnostics.phase2to6_averageRawScore * 100) /
            100,
          scoreDistribution: result.diagnostics.scoreDistribution,
        },

        phase7: {
          eligiblePairs: result.diagnostics.phase7_eligiblePairs,
          failedAbsoluteThreshold: result.diagnostics.phase7_failedAbsolute,
          failedRelativeThresholdA: result.diagnostics.phase7_failedRelativeA,
          failedRelativeThresholdB: result.diagnostics.phase7_failedRelativeB,
          perfectionistUsers: result.diagnostics.phase7_perfectionists,
        },

        phase8: {
          matchesCreated: result.diagnostics.phase8_matchesCreated,
          unmatchedUsers: result.diagnostics.phase8_unmatchedUsers,
          averageMatchScore:
            Math.round(result.diagnostics.phase8_averageMatchScore * 100) / 100,
          medianMatchScore:
            Math.round(result.diagnostics.phase8_medianMatchScore * 100) / 100,
          minMatchScore:
            Math.round(result.diagnostics.phase8_minMatchScore * 100) / 100,
          maxMatchScore:
            Math.round(result.diagnostics.phase8_maxMatchScore * 100) / 100,
        },

        unmatchedDetails: result.unmatched.map((u) => ({
          userId: u.userId,
          reason: u.reason,
          bestPossibleScore: u.bestPossibleScore
            ? Math.round(u.bestPossibleScore * 100) / 100
            : undefined,
          bestPossibleMatchId: u.bestPossibleMatchId,
        })),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error running matching algorithm:", error);
    return NextResponse.json(
      {
        error: "Failed to run matching algorithm",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
