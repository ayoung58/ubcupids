/**
 * Load More Matches API
 *
 * POST /api/cupid/load-more
 * Loads the next 5 matches for a cupid's assignment (up to 25 total)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is an approved cupid
    const cupidProfile = await prisma.cupidProfile.findUnique({
      where: { userId },
      select: { approved: true },
    });

    if (!cupidProfile?.approved) {
      return NextResponse.json(
        { error: "Not an approved cupid" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Missing assignmentId" },
        { status: 400 }
      );
    }

    // Get the assignment
    const assignment = await prisma.cupidAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Verify this assignment belongs to the cupid
    if (assignment.cupidUserId !== userId) {
      return NextResponse.json(
        { error: "Not authorized for this assignment" },
        { status: 403 }
      );
    }

    // Get all potential matches stored in the assignment
    const allMatches = assignment.potentialMatches as {
      userId: string;
      score: number;
    }[];

    if (!allMatches || allMatches.length === 0) {
      return NextResponse.json(
        { error: "No matches available for this assignment" },
        { status: 404 }
      );
    }

    // Check if we've reached the limit
    if (allMatches.length >= 25) {
      return NextResponse.json(
        { error: "Maximum limit of 25 matches reached" },
        { status: 400 }
      );
    }

    // Load profiles for all matches (they'll be shown progressively on frontend)
    const matchProfiles = [];
    for (const match of allMatches) {
      const user = await prisma.user.findUnique({
        where: { id: match.userId },
        select: {
          id: true,
          firstName: true,
          age: true,
          bio: true,
          interests: true,
          major: true,
          profilePicture: true,
          cupidProfileSummary: {
            select: {
              summary: true,
              keyTraits: true,
              lookingFor: true,
            },
          },
        },
      });

      if (user) {
        matchProfiles.push({
          userId: user.id,
          score: match.score,
          profile: {
            userId: user.id,
            firstName: user.firstName || "Unknown",
            age: user.age || 0,
            bio: user.bio,
            interests: user.interests,
            major: user.major,
            profilePicture: user.profilePicture,
            summary: user.cupidProfileSummary?.summary || "",
            keyTraits: (user.cupidProfileSummary?.keyTraits as string[]) || [],
            lookingFor: user.cupidProfileSummary?.lookingFor || "",
            highlights: [],
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      potentialMatches: matchProfiles,
      total: allMatches.length,
    });
  } catch (error) {
    console.error("Error loading more matches:", error);
    return NextResponse.json(
      { error: "Failed to load more matches" },
      { status: 500 }
    );
  }
}
