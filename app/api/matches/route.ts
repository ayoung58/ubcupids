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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format matches for display, respecting privacy settings
    const displayMatches: MatchDisplay[] = matches.map((match) => ({
      matchId: match.id,
      matchType: match.matchType as
        | "algorithm"
        | "cupid_sent"
        | "cupid_received",
      compatibilityScore: match.compatibilityScore,
      matchedUser: {
        firstName: match.matchedUser.firstName,
        displayName: match.matchedUser.displayName,
        age: match.matchedUser.age || 0,
        email: match.matchedUser.email,
        profilePicture: match.matchedUser.showProfilePicToMatches
          ? match.matchedUser.profilePicture
          : null,
        bio: match.matchedUser.showBioToMatches ? match.matchedUser.bio : null,
        interests: match.matchedUser.showInterestsToMatches
          ? match.matchedUser.interests
          : null,
        pointOfContact: match.matchedUser.showPointOfContactToMatches
          ? match.matchedUser.pointOfContact
          : null,
      },
      revealedAt: match.revealedAt,
      createdAt: match.createdAt,
    }));

    // Calculate stats
    const algorithmMatches = displayMatches.filter(
      (m) => m.matchType === "algorithm"
    ).length;
    const cupidSentMatches = displayMatches.filter(
      (m) => m.matchType === "cupid_sent"
    ).length;
    const cupidReceivedMatches = displayMatches.filter(
      (m) => m.matchType === "cupid_received"
    ).length;

    // Check if matches are revealed for this batch
    const batch = await prisma.matchingBatch.findUnique({
      where: { batchNumber: CURRENT_BATCH },
      select: { revealedAt: true },
    });

    const response: UserMatchesData = {
      matches: displayMatches,
      totalMatches: displayMatches.length,
      algorithmMatches,
      cupidSentMatches,
      cupidReceivedMatches,
      batchNumber: CURRENT_BATCH,
      isRevealed: batch !== null && batch.revealedAt !== null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
