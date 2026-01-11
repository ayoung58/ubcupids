import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { encryptJSON } from "@/lib/encryption";
import { QUESTIONNAIRE_DEADLINE } from "@/lib/matching/config";

/**
 * POST /api/questionnaire/save
 * Save questionnaire as a draft (allows future editing)
 *
 * Request body:
 * - responses: Object mapping questionId -> answer
 * - importance: Optional object mapping questionId -> importance level (1-5 scale)
 *
 * Behavior:
 * - Creates new record if none exists
 * - Updates existing record if found
 * - Rejects if questionnaire already submitted (locked)
 * - Encrypts responses and importance before saving to database
 */

// Validation schema for save request
const saveSchema = z.object({
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

    // Check if questionnaire deadline has passed
    const now = new Date();
    if (now > QUESTIONNAIRE_DEADLINE) {
      return NextResponse.json(
        {
          error: "Questionnaire submission deadline has passed",
          hint: "You have missed the questionnaire submission deadline. The matching algorithm has already run.",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = saveSchema.parse(body);

    // Check if questionnaire already submitted (locked)
    const existing = await prisma.questionnaireResponse.findUnique({
      where: { userId: session.user.id },
      select: { isSubmitted: true },
    });

    if (existing?.isSubmitted) {
      return NextResponse.json(
        { error: "Questionnaire already submitted and cannot be edited" },
        { status: 403 }
      );
    }

    // Encrypt data before saving
    const encryptedResponses = encryptJSON(validatedData.responses);
    const encryptedImportance = validatedData.importance
      ? encryptJSON(validatedData.importance)
      : undefined;

    // Save draft (upsert: update if exists, create if not)
    await prisma.questionnaireResponse.upsert({
      where: { userId: session.user.id },
      update: {
        responses: encryptedResponses,
        importance: encryptedImportance,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        responses: encryptedResponses,
        importance: encryptedImportance,
        isSubmitted: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Draft saved successfully",
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error saving questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to save questionnaire" },
      { status: 500 }
    );
  }
}
