import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Get current matches with details (for both test and production users)
 * GET /api/admin/current-matches?isTestUser=true|false
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameter for user type
    const searchParams = request.nextUrl.searchParams;
    const isTestUser = searchParams.get("isTestUser") === "true";

    // Get all ALGORITHM matches for the user type (not cupid matches)
    const matches = await prisma.match.findMany({
      where: {
        matchType: "algorithm",
        batchNumber: 1,
        user: {
          isTestUser,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
        matchedUser: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get compatibility scores for all matches
    const compatibilityScores = await prisma.compatibilityScore.findMany({
      where: {
        OR: matches.flatMap((match) => [
          {
            userId: match.userId,
            targetUserId: match.matchedUserId,
            batchNumber: 1,
          },
          {
            userId: match.matchedUserId,
            targetUserId: match.userId,
            batchNumber: 1,
          },
        ]),
      },
      select: {
        userId: true,
        targetUserId: true,
        totalScore: true,
        bidirectionalScore: true,
      },
    });

    // Create a map for quick lookup
    const scoreMap = new Map<
      string,
      { totalScore: number; bidirectionalScore: number | null }
    >();
    compatibilityScores.forEach((score) => {
      const key = `${score.userId}-${score.targetUserId}`;
      scoreMap.set(key, {
        totalScore: score.totalScore,
        bidirectionalScore: score.bidirectionalScore,
      });
    });

    // Get all users with questionnaires
    const allUsers = await prisma.user.findMany({
      where: {
        isTestUser,
        questionnaireResponseV2: {
          isSubmitted: true,
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
      },
    });

    // Find unmatched users and deduplicate matches (keep only one direction)
    const matchedUserIds = new Set<string>();
    const seenPairs = new Set<string>();
    const uniqueMatches = matches.filter((match) => {
      // Create a consistent pair key (always sort IDs alphabetically)
      const pairKey = [match.userId, match.matchedUserId].sort().join("-");

      if (seenPairs.has(pairKey)) {
        return false; // Skip duplicate
      }

      seenPairs.add(pairKey);
      matchedUserIds.add(match.userId);
      matchedUserIds.add(match.matchedUserId);
      return true;
    });

    const unmatchedUsers = allUsers.filter(
      (user) => !matchedUserIds.has(user.id),
    );

    // For each unmatched user, find their top potential matches and reasons
    const unmatchedUsersWithReasons = await Promise.all(
      unmatchedUsers.map(async (user) => {
        // Get their compatibility scores
        const scores = await prisma.compatibilityScore.findMany({
          where: {
            userId: user.id,
            batchNumber: 1,
            bidirectionalScore: { not: null },
          },
          include: {
            targetUser: {
              select: {
                id: true,
                email: true,
                displayName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            bidirectionalScore: "desc",
          },
          take: 5,
        });

        // Determine reason why unmatched
        let reason = "No compatible matches found";
        if (scores.length === 0) {
          reason =
            "Failed hard filters - no potential matches passed dealbreaker checks";
        } else if (
          scores[0].bidirectionalScore &&
          scores[0].bidirectionalScore < 50
        ) {
          reason = `Best compatibility score too low (${scores[0].bidirectionalScore.toFixed(1)}/100) - below quality threshold`;
        } else {
          reason = `Not selected by matching algorithm - best potential match: ${scores[0].targetUser.displayName || scores[0].targetUser.email} (${scores[0].bidirectionalScore?.toFixed(1)}/100)`;
        }

        return {
          userId: user.id,
          userEmail: user.email,
          userName: user.displayName || `${user.firstName} ${user.lastName}`,
          reason,
          topPotentialMatches: scores.map((score) => ({
            userId: score.targetUser.id,
            userEmail: score.targetUser.email,
            userName:
              score.targetUser.displayName ||
              `${score.targetUser.firstName} ${score.targetUser.lastName}`,
            score: score.bidirectionalScore || 0,
          })),
        };
      }),
    );

    // Format matched users data and sort by compatibility score (use uniqueMatches)
    const formattedMatches = uniqueMatches
      .map((match) => {
        const scoreKey = `${match.userId}-${match.matchedUserId}`;
        const score = scoreMap.get(scoreKey);

        return {
          matchId: match.id,
          user1: {
            id: match.user.id,
            email: match.user.email,
            name:
              match.user.displayName ||
              `${match.user.firstName} ${match.user.lastName}`,
          },
          user2: {
            id: match.matchedUser.id,
            email: match.matchedUser.email,
            name:
              match.matchedUser.displayName ||
              `${match.matchedUser.firstName} ${match.matchedUser.lastName}`,
          },
          compatibilityScore: score?.bidirectionalScore || 0,
          totalScore: score?.totalScore || 0,
          createdAt: match.createdAt,
          revealedAt: match.revealedAt,
        };
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return NextResponse.json({
      matches: formattedMatches,
      unmatchedUsers: unmatchedUsersWithReasons,
      totalMatches: formattedMatches.length,
      totalUnmatched: unmatchedUsersWithReasons.length,
      matchRate:
        allUsers.length > 0
          ? ((formattedMatches.length * 2) / allUsers.length) * 100
          : 0,
    });
  } catch (error) {
    console.error("Error fetching current matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch current matches" },
      { status: 500 },
    );
  }
}
