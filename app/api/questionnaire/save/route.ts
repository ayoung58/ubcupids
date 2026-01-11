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
 *   V2 Format: { "q7": { ownAnswer: 2, preference: {...}, importance: 4, dealbreaker: false } }
 *   V1 Format (Legacy): { "q1": "man", "q2": "pizza" }
 * - importance: Optional (V1 only, deprecated in V2)
 *
 * Behavior:
 * - Creates new record if none exists
 * - Updates existing record if found
 * - Rejects if questionnaire already submitted (locked)
 * - Encrypts responses and importance before saving to database
 * - Supports both V1 and V2 formats for backward compatibility
 */

// V2 Response value types (union of all possible answer formats)
const responseValueSchema = z.union([
  z.string(), // Single-choice, text, textarea
  z.array(z.string()), // Multi-choice, ranking
  z.number(), // Scale, age
  z.object({ value: z.string(), text: z.string() }), // Single-choice with text input
  z.object({ minAge: z.number(), maxAge: z.number() }), // Age-range
]);

// V2 Preference configuration
const preferenceConfigSchema = z.object({
  type: z.enum([
    "same",
    "similar",
    "different",
    "same_or_similar",
    "more",
    "less",
    "compatible",
    "specific_values",
  ]),
  value: responseValueSchema.optional(), // For specific_values preference type
  doesntMatter: z.boolean(), // When true, importance/dealbreaker disabled
});

// V2 Question response structure
const questionResponseSchema = z.object({
  ownAnswer: responseValueSchema, // User's own answer (left side)
  preference: preferenceConfigSchema, // User's preference for match (right side)
  importance: z.number().int().min(1).max(5), // 1-5 scale (ignored if doesntMatter=true)
  dealbreaker: z.boolean(), // Hard filter flag (ignored if doesntMatter=true)
});

// Validation schema for save request (supports both V1 and V2 formats)
const saveSchema = z.object({
  responses: z.record(
    z.string(),
    z.union([
      questionResponseSchema, // V2 format (split-screen)
      responseValueSchema, // V1 format (legacy, for backward compatibility)
    ])
  ),
  // V1 importance field (deprecated, kept for backward compatibility)
  importance: z
    .record(
      z.string(),
      z.number().int().min(1).max(5)
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
