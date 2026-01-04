import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Delete Account
 * POST /api/profile/delete-account
 *
 * Deletes user account(s) based on selection
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { accountTypes } = body; // Array of "match" and/or "cupid"

    if (
      !accountTypes ||
      !Array.isArray(accountTypes) ||
      accountTypes.length === 0
    ) {
      return NextResponse.json(
        { error: "Account types must be specified" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const deleteMatch = accountTypes.includes("match");
    const deleteCupid = accountTypes.includes("cupid");

    // If deleting both, just delete the entire user account
    if (deleteMatch && deleteCupid) {
      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id: userId },
      });

      return NextResponse.json({
        message: "Your account has been permanently deleted",
        deletedAccounts: ["match", "cupid"],
      });
    }

    // Handle partial deletion
    if (deleteMatch) {
      // Delete match-related data
      await prisma.$transaction(async (tx) => {
        // Delete questionnaire response
        await tx.questionnaireResponse.deleteMany({
          where: { userId },
        });

        // Delete all matches where this user is involved
        await tx.match.deleteMany({
          where: {
            OR: [{ userId }, { matchedUserId: userId }],
          },
        });

        // Delete compatibility scores
        await tx.compatibilityScore.deleteMany({
          where: {
            OR: [{ userId }, { targetUserId: userId }],
          },
        });

        // Delete cupid assignments where this user is the candidate
        await tx.cupidAssignment.deleteMany({
          where: { candidateId: userId },
        });

        // Update user flags
        await tx.user.update({
          where: { id: userId },
          data: {
            isBeingMatched: false,
            age: null,
            major: null,
            profilePicture: null,
            showBioToMatches: true,
            showProfilePicToMatches: true,
            showInterestsToMatches: true,
            showPointOfContactToMatches: true,
          },
        });
      });

      // Notify cupids who had this user as a potential match
      // We'll update their potential matches lists to remove this user
      const affectedAssignments = await prisma.cupidAssignment.findMany({
        where: {
          batchNumber: 1, // Current batch
        },
        select: {
          id: true,
          potentialMatches: true,
        },
      });

      for (const assignment of affectedAssignments) {
        if (assignment.potentialMatches) {
          const potentialMatches = assignment.potentialMatches as Array<{
            userId: string;
            score: number;
          }>;

          // Check if this user is in the potential matches
          const hasUser = potentialMatches.some((pm) => pm.userId === userId);

          if (hasUser) {
            const filtered = potentialMatches.filter(
              (pm) => pm.userId !== userId
            );

            await prisma.cupidAssignment.update({
              where: { id: assignment.id },
              data: { potentialMatches: filtered },
            });
          }
        }
      }

      // Check if user has no remaining accounts after deletion
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { isBeingMatched: true, isCupid: true },
      });

      // If user has neither match nor cupid account, delete entirely
      if (updatedUser && !updatedUser.isBeingMatched && !updatedUser.isCupid) {
        await prisma.user.delete({
          where: { id: userId },
        });
        return NextResponse.json({
          message: "Your account has been permanently deleted",
          deletedAccounts: ["match"],
        });
      }

      return NextResponse.json({
        message: "Your match account has been deleted",
        deletedAccounts: ["match"],
      });
    }

    if (deleteCupid) {
      // Delete cupid-related data
      await prisma.$transaction(async (tx) => {
        // Delete cupid profile
        await tx.cupidProfile.deleteMany({
          where: { userId },
        });

        // Delete cupid assignments where this user is the cupid
        await tx.cupidAssignment.deleteMany({
          where: { cupidUserId: userId },
        });

        // Delete matches where this user was the cupid who created them
        await tx.match.deleteMany({
          where: { cupidId: userId },
        });

        // Update user flags
        await tx.user.update({
          where: { id: userId },
          data: {
            isCupid: false,
            cupidDisplayName: null,
            preferredCandidateEmail: null,
          },
        });
      });

      // Check if user has no remaining accounts after deletion
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { isBeingMatched: true, isCupid: true },
      });

      // If user has neither match nor cupid account, delete entirely
      if (updatedUser && !updatedUser.isBeingMatched && !updatedUser.isCupid) {
        await prisma.user.delete({
          where: { id: userId },
        });
        return NextResponse.json({
          message: "Your account has been permanently deleted",
          deletedAccounts: ["cupid"],
        });
      }

      return NextResponse.json({
        message: "Your cupid account has been deleted",
        deletedAccounts: ["cupid"],
      });
    }

    return NextResponse.json(
      { error: "No valid account type specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
