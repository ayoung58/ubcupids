/**
 * POST /api/questionnaire/v2/submit
 *
 * Submits the questionnaire and locks it from further editing.
 * Validates all required fields before submission.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { validateQuestionnaireV2 } from "@/lib/questionnaire/v2/validation";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Load existing responses
    const existingResponse = await prisma.questionnaireResponseV2.findUnique({
      where: { userId },
    });

    if (!existingResponse) {
      return NextResponse.json(
        {
          error:
            "No questionnaire responses found. Please complete the questionnaire first.",
        },
        { status: 400 }
      );
    }

    // Check if already submitted
    if (existingResponse.isSubmitted) {
      return NextResponse.json(
        {
          error: "Questionnaire already submitted",
          submittedAt: existingResponse.submittedAt,
        },
        { status: 400 }
      );
    }

    // Validate responses
    const validation = validateQuestionnaireV2(
      existingResponse.responses as any,
      {
        freeResponse1: existingResponse.freeResponse1 || "",
        freeResponse2: existingResponse.freeResponse2 || "",
        freeResponse3: existingResponse.freeResponse3 || "",
        freeResponse4: existingResponse.freeResponse4 || "",
        freeResponse5: existingResponse.freeResponse5 || "",
      }
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Questionnaire validation failed",
          errors: validation.errors,
          completionPercentage: Math.round(
            (validation.completedCount / validation.requiredCount) * 100
          ),
        },
        { status: 400 }
      );
    }

    // Submit questionnaire
    const submittedResponse = await prisma.questionnaireResponseV2.update({
      where: { userId },
      data: {
        isSubmitted: true,
        submittedAt: new Date(),
      },
    });

    // Update user flag to indicate they completed V2 questionnaire
    await prisma.user.update({
      where: { id: userId },
      data: {
        needsQuestionnaireUpdate: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Questionnaire submitted successfully",
      submittedAt: submittedResponse.submittedAt,
    });
  } catch (error) {
    console.error("[SUBMIT_V2_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to submit questionnaire" },
      { status: 500 }
    );
  }
}
