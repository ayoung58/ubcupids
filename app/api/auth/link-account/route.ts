import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import {
  MAX_MATCH_USERS,
  MAX_CUPID_USERS,
  SIGNUP_DEADLINE,
} from "@/lib/matching/config";

/**
 * Link Account API Endpoint
 *
 * POST /api/auth/link-account
 *
 * Allows authenticated users to link a second account type (Cupid or Match)
 * to their existing account.
 *
 * Request body:
 * {
 *   accountType: "cupid" | "match",
 *   firstName?: string,  // Required for Match accounts if not already set
 *   lastName?: string,   // Required for Match accounts if not already set
 *   age?: number,        // Required for Match accounts if not already set
 *   major?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if signup/linking deadline has passed
    const now = new Date();
    if (now > SIGNUP_DEADLINE) {
      return NextResponse.json(
        {
          error: "Account linking has closed",
          hint: "The deadline for creating or linking accounts has passed (February 1, 2026 at 12:00 AM). Account linking is no longer available.",
        },
        { status: 403 },
      );
    }

    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      accountType,
      firstName,
      lastName,
      age,
      major,
      campus,
      okMatchingDifferentCampus,
      preferredCandidateEmail,
    } = body;

    if (accountType !== "cupid" && accountType !== "match") {
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 },
      );
    }

    // Fetch current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isCupid: true,
        isBeingMatched: true,
        firstName: true,
        lastName: true,
        age: true,
        displayName: true,
        preferredCandidateEmail: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if they already have this account type
    if (accountType === "cupid" && currentUser.isCupid) {
      return NextResponse.json(
        { error: "There is already a Cupid account with that email" },
        { status: 400 },
      );
    }

    if (accountType === "match" && currentUser.isBeingMatched) {
      return NextResponse.json(
        { error: "There is already a Match account with that email" },
        { status: 400 },
      );
    }

    // Check user cap before allowing linking (excluding test users)
    const isCupid = accountType === "cupid";
    const currentUserCount = await prisma.user.count({
      where: {
        isTestUser: false,
        ...(isCupid ? { isCupid: true } : { isBeingMatched: true }),
      },
    });

    const maxUsers = isCupid ? MAX_CUPID_USERS : MAX_MATCH_USERS;
    const accountTypeName = isCupid ? "Cupids" : "Match candidates";

    if (currentUserCount >= maxUsers) {
      return NextResponse.json(
        {
          error: `Maximum number of ${accountTypeName.toLowerCase()} reached`,
          hint: `We've reached the maximum capacity of ${maxUsers} ${accountTypeName.toLowerCase()} for 2026. Account linking is currently closed for this account type.`,
        },
        { status: 403 },
      );
    }

    // Validate required fields for Match accounts
    if (!isCupid) {
      const missingFields: string[] = [];

      if (!currentUser.firstName && !firstName)
        missingFields.push("First Name");
      if (!currentUser.lastName && !lastName) missingFields.push("Last Name");
      if (!currentUser.age && !age) missingFields.push("Age");

      if (missingFields.length > 0) {
        const fieldList = missingFields.join(", ");
        const errorMessage =
          missingFields.length === 1
            ? `Missing required field: ${fieldList}`
            : `Missing required fields: ${fieldList}`;

        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
    }

    // Update user with new account type
    const updateData: any = {};

    if (isCupid) {
      updateData.isCupid = true;
      // Set cupidDisplayName to existing displayName if available, otherwise use firstName + lastName
      if (currentUser.displayName) {
        updateData.cupidDisplayName = currentUser.displayName;
      } else if (currentUser.firstName && currentUser.lastName) {
        updateData.cupidDisplayName = `${currentUser.firstName} ${currentUser.lastName}`;
      }
      // Save preferred candidate email if provided
      if (preferredCandidateEmail && preferredCandidateEmail.trim()) {
        const normalizedPreferredEmail = preferredCandidateEmail
          .trim()
          .toLowerCase();

        // Prevent users from entering their own email
        if (normalizedPreferredEmail === session.user.email?.toLowerCase()) {
          return NextResponse.json(
            {
              error: "You cannot set yourself as your preferred candidate",
              hint: "Please enter the email of someone you'd like to match.",
            },
            { status: 400 },
          );
        }

        // Check if the preferred candidate exists and is a match user
        const preferredCandidate = await prisma.user.findUnique({
          where: { email: normalizedPreferredEmail },
          select: { id: true, isBeingMatched: true },
        });

        if (!preferredCandidate) {
          return NextResponse.json(
            {
              error: "Preferred candidate email not found",
              hint: "This email is not registered in UBCupids. Please enter a valid match user's email or leave the field empty.",
            },
            { status: 400 },
          );
        }

        if (!preferredCandidate.isBeingMatched) {
          return NextResponse.json(
            {
              error: "This user is not participating in matching",
              hint: "The email you entered belongs to a user who is not a match participant. Please enter a match user's email or leave the field empty.",
            },
            { status: 400 },
          );
        }

        // Check if another cupid already has this preferred candidate
        const existingCupid = await prisma.user.findFirst({
          where: {
            preferredCandidateEmail: normalizedPreferredEmail,
            id: { not: session.user.id },
          },
          select: { id: true },
        });

        if (existingCupid) {
          return NextResponse.json(
            {
              error: "This candidate is already preferred by another cupid",
              hint: "Another cupid has already selected this person as their preferred match candidate.",
            },
            { status: 400 },
          );
        }

        updateData.preferredCandidateEmail = normalizedPreferredEmail;
      }
    } else {
      updateData.isBeingMatched = true;
      // Update profile fields if provided
      if (firstName) updateData.firstName = firstName.trim();
      if (lastName) updateData.lastName = lastName.trim();
      if (age) updateData.age = parseInt(age);
      if (major) updateData.major = major.trim();
      if (campus) updateData.campus = campus;
      if (okMatchingDifferentCampus !== undefined)
        updateData.okMatchingDifferentCampus = okMatchingDifferentCampus;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        isCupid: true,
        isBeingMatched: true,
        preferredCandidateEmail: true,
      },
    });

    console.log(
      `[Link Account] User ${session.user.id} linked ${accountType} account`,
    );

    return NextResponse.json(
      {
        success: true,
        message: `${accountType === "cupid" ? "Cupid" : "Match"} account linked successfully!`,
        user: updatedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Link Account] Unexpected error:", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again later.",
        ...(process.env.NODE_ENV === "development" && {
          debug: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 },
    );
  }
}
