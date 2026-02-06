/**
 * Matches API - Get User's Matches
 *
 * GET /api/matches
 * Returns the authenticated user's matches for the current batch
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { CURRENT_BATCH } from "@/lib/matching/config";
import { MatchDisplay, UserMatchesData } from "@/lib/matching/types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is a test user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isTestUser: true },
    });

    // Get all matches for this user in the current batch
    const matches = await prisma.match.findMany({
      where: {
        userId,
        batchNumber: CURRENT_BATCH,
        revealedAt: { not: null }, // Only show revealed matches
      },
      include: {
        matchedUser: {
          select: {
            id: true,
            firstName: true,
            displayName: true,
            age: true,
            email: true,
            profilePicture: true,
            bio: true,
            interests: true,
            pointOfContact: true,
            showBioToMatches: true,
            showProfilePicToMatches: true,
            showInterestsToMatches: true,
            showPointOfContactToMatches: true,
            showFreeResponseToMatches: true,
            questionnaireResponseV2: {
              select: {
                freeResponse1: true,
                freeResponse2: true,
                freeResponse3: true,
                freeResponse4: true,
                freeResponse5: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get cupid information for matches that have cupidId
    const cupidIds = matches
      .filter((m) => m.cupidId)
      .map((m) => m.cupidId as string);

    const cupids =
      cupidIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: cupidIds } },
            select: {
              id: true,
              cupidDisplayName: true,
              displayName: true,
              firstName: true,
            },
          })
        : [];

    // Create a map for quick cupid lookup
    const cupidMap = new Map(
      cupids.map((c) => [
        c.id,
        c.cupidDisplayName || c.displayName || c.firstName || null,
      ]),
    );

    // Format matches for display, respecting privacy settings
    const displayMatches: MatchDisplay[] = matches.map((match) => {
      // Hide contact info for pending cupid_received matches
      const isPendingRequest =
        match.matchType === "cupid_received" && match.status === "pending";

      // Determine free responses to show
      const freeResponses =
        match.matchedUser.showFreeResponseToMatches &&
        match.matchedUser.questionnaireResponseV2
          ? {
              freeResponse1:
                match.matchedUser.questionnaireResponseV2.freeResponse1,
              freeResponse2:
                match.matchedUser.questionnaireResponseV2.freeResponse2,
              freeResponse3:
                match.matchedUser.questionnaireResponseV2.freeResponse3,
              freeResponse4:
                match.matchedUser.questionnaireResponseV2.freeResponse4,
              freeResponse5:
                match.matchedUser.questionnaireResponseV2.freeResponse5,
            }
          : null;

      return {
        matchId: match.id,
        matchType: match.matchType as
          | "algorithm"
          | "cupid_sent"
          | "cupid_received",
        compatibilityScore: match.compatibilityScore,
        cupidComment: match.cupidComment,
        cupidName: match.cupidId ? cupidMap.get(match.cupidId) || null : null,
        status: match.status as "accepted" | "pending" | "declined",
        matchedUser: {
          firstName: match.matchedUser.firstName,
          displayName: match.matchedUser.displayName,
          age: match.matchedUser.age || 0,
          email: isPendingRequest ? "" : match.matchedUser.email,
          profilePicture: match.matchedUser.showProfilePicToMatches
            ? match.matchedUser.profilePicture
            : null,
          bio: match.matchedUser.showBioToMatches
            ? match.matchedUser.bio
            : null,
          interests: match.matchedUser.showInterestsToMatches
            ? match.matchedUser.interests
            : null,
          pointOfContact:
            isPendingRequest || !match.matchedUser.showPointOfContactToMatches
              ? null
              : match.matchedUser.pointOfContact,
          freeResponses,
          showFreeResponseToMatches:
            match.matchedUser.showFreeResponseToMatches,
        },
        revealedAt: match.revealedAt,
        createdAt: match.createdAt,
        respondedAt: match.respondedAt,
      };
    });

    // Separate matches by type
    const algorithmMatches = displayMatches.filter(
      (m) => m.matchType === "algorithm",
    );
    const requestsSent = displayMatches.filter(
      (m) => m.matchType === "cupid_sent",
    );
    const requestsReceived = displayMatches.filter(
      (m) => m.matchType === "cupid_received",
    );

    // Check if matches are revealed for this batch
    const batch = await prisma.matchingBatch.findUnique({
      where: { batchNumber: CURRENT_BATCH },
      select: { revealedAt: true },
    });

    // Check if matches have been revealed for this user type
    let isRevealed: boolean;
    if (currentUser?.isTestUser) {
      // Test users: Check if any test user matches have been revealed
      const anyTestMatchRevealed = await prisma.match.findFirst({
        where: {
          batchNumber: CURRENT_BATCH,
          revealedAt: { not: null },
          user: { isTestUser: true },
        },
        select: { id: true },
      });
      isRevealed = anyTestMatchRevealed !== null;
    } else {
      // Production users: Check if any production matches have been revealed
      // AND if batch reveal date has passed (Feb 8) or admin revealed
      // This ensures we only show results when both conditions are met
      const anyProdMatchRevealed = await prisma.match.findFirst({
        where: {
          batchNumber: CURRENT_BATCH,
          revealedAt: { not: null },
          user: { isTestUser: false },
        },
        select: { id: true },
      });

      const batchRevealed = batch !== null && batch.revealedAt !== null;

      // Show as revealed if batch is revealed (this handles both admin reveal and date passing)
      // Even users with 0 matches need to see the "no matches" screen
      isRevealed = batchRevealed;
    }

    const response: UserMatchesData = {
      algorithmMatches,
      requestsSent,
      requestsReceived,
      totalMatches: displayMatches.length,
      batchNumber: CURRENT_BATCH,
      isRevealed,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
}
