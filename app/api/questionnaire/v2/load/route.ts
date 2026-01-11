import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/questionnaire/v2/load
 * Load existing questionnaire V2 responses for the current user
 *
 * Returns:
 * - responses: Object mapping questionId -> { answer, preference, importance, doesntMatter, isDealer }
 * - freeResponses: Object with freeResponse1-5 keys
 * - questionsCompleted: Number of completed questions
 * - isSubmitted: Whether questionnaire is locked
 * - submittedAt: Submission timestamp (if submitted)
 * - lastSaved: Last update timestamp
 *
 * Returns 404 if no responses found
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Fetch user's questionnaire responses
    const questionnaireResponse =
      await prisma.questionnaireResponseV2.findUnique({
        where: { userId: session.user.id },
        select: {
          responses: true,
          freeResponse1: true,
          freeResponse2: true,
          freeResponse3: true,
          freeResponse4: true,
          freeResponse5: true,
          questionsCompleted: true,
          isSubmitted: true,
          submittedAt: true,
          updatedAt: true,
          createdAt: true,
        },
      });

    // Return 404 if no responses found
    if (!questionnaireResponse) {
      return NextResponse.json(
        {
          error: "No questionnaire responses found",
          message: "User has not started the questionnaire yet",
        },
        { status: 404 }
      );
    }

    // Return responses
    return NextResponse.json({
      success: true,
      responses: questionnaireResponse.responses,
      freeResponses: {
        freeResponse1: questionnaireResponse.freeResponse1,
        freeResponse2: questionnaireResponse.freeResponse2,
        freeResponse3: questionnaireResponse.freeResponse3,
        freeResponse4: questionnaireResponse.freeResponse4,
        freeResponse5: questionnaireResponse.freeResponse5,
      },
      questionsCompleted: questionnaireResponse.questionsCompleted,
      isSubmitted: questionnaireResponse.isSubmitted,
      submittedAt: questionnaireResponse.submittedAt?.toISOString(),
      lastSaved: questionnaireResponse.updatedAt.toISOString(),
      createdAt: questionnaireResponse.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error loading questionnaire V2:", error);

    return NextResponse.json(
      { error: "Failed to load questionnaire" },
      { status: 500 }
    );
  }
}
