import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateResponses } from "@/src/lib/questionnaire-utils";

/**
 * POST /api/questionnaire/submit
 * Submit questionnaire as final (locks responses, prevents editing)
 *
 * Request body:
 * - responses: Object mapping questionId -> answer
 * - importance: Optional object mapping questionId -> importance level
 *
 * Validation:
 * - All required questions must be answered
 * - Text fields must meet min/max length requirements
 *
 * After submission:
 * - isSubmitted set to true
 * - submittedAt timestamp recorded
 * - User cannot edit responses anymore (read-only)
 */

// Validation schema for submit request
const submitSchema = z.object({
  responses: z.record(
    z.string(),
    z.union([z.string(), z.array(z.string()), z.number()])
  ),
  importance: z
    .record(
      z.string(),
      z.enum([
        "dealbreaker",
        "very-important",
        "somewhat-important",
        "not-important",
      ])
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = submitSchema.parse(body);

    // Validate all required questions are answered
    const validationErrors = validateResponses(validatedData.responses as any);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Please answer all required questions",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Check if already submitted
    const existing = await prisma.questionnaireResponse.findUnique({
      where: { userId: session.user.id },
      select: { isSubmitted: true },
    });

    if (existing?.isSubmitted) {
      return NextResponse.json(
        { error: "Questionnaire already submitted" },
        { status: 400 }
      );
    }

    // Submit questionnaire (lock responses)
    await prisma.questionnaireResponse.upsert({
      where: { userId: session.user.id },
      update: {
        responses: validatedData.responses as any,
        importance: (validatedData.importance || {}) as any,
        isSubmitted: true,
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        responses: validatedData.responses as any,
        importance: (validatedData.importance || {}) as any,
        isSubmitted: true,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Questionnaire submitted successfully",
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error submitting questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to submit questionnaire" },
      { status: 500 }
    );
  }
}
