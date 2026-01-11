import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateResponses } from "@/src/lib/questionnaire-utils";
import { Responses } from "@/src/lib/questionnaire-types";
import { encryptJSON } from "@/lib/encryption";
import { QUESTIONNAIRE_DEADLINE } from "@/lib/matching/config";

/**
 * POST /api/questionnaire/submit
 * Submit questionnaire as final (locks responses, prevents editing)
 *
 * Request body:
 * - responses: Object mapping questionId -> answer
 *   V2 Format: { "q7": { ownAnswer: 2, preference: {...}, importance: 4, dealbreaker: false } }
 *   V1 Format (Legacy): { "q1": "man", "q2": "pizza" }
 * - importance: Optional (V1 only, deprecated in V2)
 *
 * Validation:
 * - All required questions must be answered
 * - Text fields must meet min/max length requirements
 * - V2: ownAnswer must be present for all required questions
 *
 * After submission:
 * - isSubmitted set to true
 * - submittedAt timestamp recorded
 * - User cannot edit responses anymore (read-only)
 * - Data encrypted before storage
 */

// V2 Response value types (union of all possible answer formats)
const responseValueSchema = z.union([
  z.string(), // Single-choice, text, textarea
  z.array(z.string()), // Multi-choice, ranking
  z.number(), // Scale, age
  z.object({ value: z.string(), text: z.string() }), // Single-choice with text input
  z.object({ min: z.number(), max: z.number() }), // Age-range (q4a)
  z.object({ show: z.array(z.string()), receive: z.array(z.string()) }), // Love languages (q21)
  z.object({ substance: z.string(), frequency: z.string().nullable() }), // Drug use (q9)
]);

// V2 Preference value types (subset of response values used for preferences)
const preferenceValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
  z.object({ min: z.number(), max: z.number() }), // Age-range preferences
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
  value: preferenceValueSchema.optional(), // For specific_values preference type
  doesntMatter: z.boolean(), // When true, importance/dealbreaker disabled
});

// V2 Question response structure
const questionResponseSchema = z.object({
  ownAnswer: responseValueSchema, // User's own answer (left side)
  preference: preferenceConfigSchema, // User's preference for match (right side)
  importance: z.number().int().min(1).max(5), // 1-5 scale (ignored if doesntMatter=true)
  dealbreaker: z.boolean(), // Hard filter flag (ignored if doesntMatter=true)
});

// Validation schema for submit request (V2 format only)
const submitSchema = z.object({
  responses: z.record(z.string(), questionResponseSchema), // V2 format only
  // V1 importance field removed (V2 handles importance per question)
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
    const validatedData = submitSchema.parse(body);

    // Validate all required questions are answered
    const validationErrors = validateResponses(
      validatedData.responses as Responses
    );
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

    // Submit questionnaire (lock responses)
    const result = await prisma.questionnaireResponse.upsert({
      where: { userId: session.user.id },
      update: {
        responses: encryptedResponses,
        isSubmitted: true,
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        responses: encryptedResponses,
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
