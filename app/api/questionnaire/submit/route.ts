import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateResponses } from "@/src/lib/questionnaire-utils";
import { encryptJSON } from "@/lib/encryption";

/**
 * POST /api/questionnaire/submit
 * Submit questionnaire as final (locks responses, prevents editing)
 *
 * Request body:
 * - responses: Object mapping questionId -> answer
 * - importance: Optional object mapping questionId -> importance level (1-5 scale)
 *
 * Validation:
 * - All required questions must be answered
 * - Text fields must meet min/max length requirements
 *
 * After submission:
 * - isSubmitted set to true
 * - submittedAt timestamp recorded
 * - User cannot edit responses anymore (read-only)
 * - Data encrypted before storage
 */

// Validation schema for submit request
const submitSchema = z.object({
  responses: z.record(
    z.string(),
    z.union([
      z.string(), // Single-choice, text, textarea
      z.array(z.string()), // Multi-choice, ranking
      z.number(), // Scale
      z.object({ value: z.string(), text: z.string() }), // Single-choice with text input
      z.object({ minAge: z.number(), maxAge: z.number() }), // Age-range
    ])
  ),
  importance: z
    .record(
      z.string(),
      z.number().int().min(1).max(5) // 1=Not Important, 3=Important (default), 5=Deal Breaker
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
    const validationErrors = validateResponses(validatedData.responses);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Please answer all required questions",
          details: validationErrors.map((e) => e.errorMessage),
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

    // Encrypt data before saving
    const encryptedResponses = encryptJSON(validatedData.responses);
    const encryptedImportance = validatedData.importance
      ? encryptJSON(validatedData.importance)
      : undefined;

    // Submit questionnaire (lock responses)
    const result = await prisma.questionnaireResponse.upsert({
      where: { userId: session.user.id },
      update: {
        responses: encryptedResponses,
        importance: encryptedImportance,
        isSubmitted: true,
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        responses: encryptedResponses,
        importance: encryptedImportance,
        isSubmitted: true,
        submittedAt: new Date(),
      },
    });

    console.log(
      `✅ Questionnaire submitted successfully for user ${session.user.id}`
    );
    console.log(`   Response ID: ${result.id}`);
    console.log(`   Submitted at: ${result.submittedAt}`);

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
