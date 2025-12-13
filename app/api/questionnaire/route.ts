import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { decryptJSON } from "@/lib/encryption";

/**
 * GET /api/questionnaire
 * Fetch the current user's questionnaire responses
 *
 * Returns:
 * - responses: User's answers (decrypted, empty object if none)
 * - importance: Question importance ratings (decrypted, empty object if none)
 * - isSubmitted: Whether questionnaire is locked
 * - submittedAt: Timestamp of submission (null if not submitted)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Fetch user's questionnaire response
    const questionnaireResponse = await prisma.questionnaireResponse.findUnique(
      {
        where: { userId: session.user.id },
        select: {
          responses: true,
          importance: true,
          isSubmitted: true,
          submittedAt: true,
        },
      }
    );

    // Return empty state if no responses yet
    if (!questionnaireResponse) {
      return NextResponse.json({
        responses: {},
        importance: {},
        isSubmitted: false,
        submittedAt: null,
      });
    }

    // Decrypt data before sending to client
    const decryptedResponses = questionnaireResponse.responses
      ? decryptJSON(questionnaireResponse.responses as string)
      : {};
    const decryptedImportance = questionnaireResponse.importance
      ? decryptJSON(questionnaireResponse.importance as string)
      : {};

    return NextResponse.json({
      responses: decryptedResponses,
      importance: decryptedImportance,
      isSubmitted: questionnaireResponse.isSubmitted,
      submittedAt: questionnaireResponse.submittedAt,
    });
  } catch (error) {
    console.error("Error fetching questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to fetch questionnaire" },
      { status: 500 }
    );
  }
}
