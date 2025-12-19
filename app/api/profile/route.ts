import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile
 * Fetch current user's profile data
 */
export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        displayName: true,
        cupidDisplayName: true,
        age: true,
        major: true,
        interests: true,
        bio: true,
        profilePicture: true,
        showBioToMatches: true,
        showProfilePicToMatches: true,
        showInterestsToMatches: true,
        isCupid: true,
        isBeingMatched: true,
        lastActiveDashboard: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile
 * Update user's profile data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      displayName,
      cupidDisplayName,
      age,
      major,
      interests,
      bio,
      showBioToMatches,
      showProfilePicToMatches,
      showInterestsToMatches,
    } = body;

    // Validate required fields
    if (!displayName || displayName.trim() === "") {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    if (!age || age < 16 || age > 100) {
      return NextResponse.json(
        { error: "Valid age is required (16-100)" },
        { status: 400 }
      );
    }

    // Validate character limits
    if (displayName.length > 50) {
      return NextResponse.json(
        { error: "Display name must be 50 characters or less" },
        { status: 400 }
      );
    }

    if (cupidDisplayName && cupidDisplayName.length > 50) {
      return NextResponse.json(
        { error: "Cupid display name must be 50 characters or less" },
        { status: 400 }
      );
    }

    if (interests && interests.length > 300) {
      return NextResponse.json(
        { error: "Interests must be 300 characters or less" },
        { status: 400 }
      );
    }

    if (bio && bio.length > 300) {
      return NextResponse.json(
        { error: "Bio must be 300 characters or less" },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName: displayName.trim(),
        cupidDisplayName: cupidDisplayName?.trim() || null,
        age: parseInt(age),
        major: major?.trim() || null,
        interests: interests?.trim() || null,
        bio: bio?.trim() || null,
        showBioToMatches: showBioToMatches ?? true,
        showProfilePicToMatches: showProfilePicToMatches ?? true,
        showInterestsToMatches: showInterestsToMatches ?? true,
      },
      select: {
        firstName: true,
        lastName: true,
        displayName: true,
        cupidDisplayName: true,
        age: true,
        major: true,
        interests: true,
        bio: true,
        profilePicture: true,
        showBioToMatches: true,
        showProfilePicToMatches: true,
        showInterestsToMatches: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
