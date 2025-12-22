/**
 * View Questionnaire API
 *
 * GET /api/questionnaire/view?userId=xxx
 * Allows cupids to view a user's questionnaire responses for matching
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { decryptJSON } from "@/lib/encryption";

export async function GET(request: NextRequest) {
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

    // Get userId from query params
    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    // Verify cupid has an assignment for this user (either as candidate or potential match)
    const assignments = await prisma.cupidAssignment.findMany({
      where: {
        cupidUserId: userId,
      },
      select: {
        candidateId: true,
        potentialMatches: true,
      },
    });

    // Check if targetUserId is either a candidate or in any potential matches array
    const hasAccess = assignments.some((assignment) => {
      // Check if target is the candidate
      if (assignment.candidateId === targetUserId) {
        return true;
      }

      // Check if target is in potential matches
      const matches = assignment.potentialMatches as Array<{
        userId: string;
        score: number;
      }>;
      return matches.some((match) => match.userId === targetUserId);
    });

    if (!hasAccess) {
      console.log(
        `Cupid ${userId} attempted to access questionnaire for ${targetUserId} without authorization`
      );
      return NextResponse.json(
        { error: "Not authorized to view this user's questionnaire" },
        { status: 403 }
      );
    }

    // Get questionnaire response
    const questionnaireResponse = await prisma.questionnaireResponse.findUnique(
      {
        where: { userId: targetUserId },
        select: {
          responses: true,
          importance: true,
        },
      }
    );

    if (!questionnaireResponse) {
      return NextResponse.json(
        { error: "Questionnaire not found" },
        { status: 404 }
      );
    }

    // Decrypt responses
    const responses = decryptJSON(questionnaireResponse.responses);
    const importance = questionnaireResponse.importance
      ? decryptJSON(questionnaireResponse.importance)
      : null;

    return NextResponse.json({
      responses,
      importance,
    });
  } catch (error) {
    console.error("Error fetching questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to fetch questionnaire" },
      { status: 500 }
    );
  }
}
