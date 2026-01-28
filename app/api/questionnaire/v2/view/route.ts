/**
 * API Endpoint: GET /api/questionnaire/v2/view
 *
 * Returns decrypted V2 questionnaire responses for cupid review
 * Only accessible to cupids and admins for assigned candidates
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { decryptJSON } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 },
      );
    }

    // Check if the user is an admin or a cupid with assignment to this user
    const requestingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isAdmin: true,
        isCupid: true,
        cupidProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!requestingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Allow admins unrestricted access
    const isAdmin = requestingUser.isAdmin;

    // Check if cupid has assignment for this candidate or their matches
    const isCupid = requestingUser.isCupid || requestingUser.cupidProfile;
    let hasAccess = isAdmin;

    if (!hasAccess && isCupid) {
      // Check if this cupid has an assignment where:
      // 1. The userId is their assigned candidate
      // 2. The userId is one of the potential matches
      const assignment = await prisma.cupidAssignment.findFirst({
        where: {
          cupidUserId: session.user.id,
          OR: [
            { candidateId: userId },
            {
              potentialMatches: {
                path: ["$"],
                array_contains: [{ userId: userId }],
              },
            },
          ],
        },
      });

      hasAccess = !!assignment;
    }

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "Forbidden - You don't have access to this user's questionnaire",
        },
        { status: 403 },
      );
    }

    // Fetch the user's questionnaire V2 response
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        questionnaireResponseV2: {
          select: {
            responses: true,
            isSubmitted: true,
          },
        },
        showFreeResponseToMatches: true,
      },
    });

    if (!user || !user.questionnaireResponseV2) {
      return NextResponse.json(
        { error: "Questionnaire not found" },
        { status: 404 },
      );
    }

    if (!user.questionnaireResponseV2.isSubmitted) {
      return NextResponse.json(
        { error: "Questionnaire not submitted" },
        { status: 400 },
      );
    }

    // Decrypt responses
    let responses: Record<string, any>;
    try {
      const responsesData = user.questionnaireResponseV2.responses;
      if (!responsesData || typeof responsesData !== "string") {
        console.error(`Invalid responses data type for user ${userId}`);
        return NextResponse.json(
          { error: "Invalid questionnaire data format" },
          { status: 500 },
        );
      }
      responses = decryptJSON<Record<string, any>>(responsesData);
    } catch (error) {
      console.error(`Failed to decrypt responses for user ${userId}:`, error);
      return NextResponse.json(
        { error: "Failed to decrypt questionnaire data" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      responses,
      showFreeResponseToMatches: user.showFreeResponseToMatches ?? true,
    });
  } catch (error) {
    console.error("Error fetching V2 questionnaire:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
