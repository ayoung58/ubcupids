import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { QUESTIONNAIRE_DEADLINE } from "@/lib/matching/config";

/**
 * POST /api/questionnaire/v2/save
 * Save questionnaire V2 as a draft (allows future editing)
 *
 * Request body:
 * - responses: Object mapping questionId -> { answer, preference, importance, doesntMatter, isDealer }
 * - freeResponses: Object with freeResponse1-5 keys
 * - questionsCompleted: Number of completed questions (for progress tracking)
 *
 * Behavior:
 * - Creates new record if none exists
 * - Updates existing record if found
 * - Rejects if questionnaire already submitted (locked)
 * - Stores responses as JSONB (no encryption needed for V2)
 */

// Validation schema for individual question response
const questionResponseSchema = z.object({
  answer: z.any().optional(), // Can be string, number, array, object (age, drug use)
  preference: z.any().optional(), // Can be string, array, object
  importance: z
    .enum([
      "not_important",
      "somewhat_important",
      "important",
      "very_important",
    ])
    .optional(),
  doesntMatter: z.boolean().optional(),
  isDealer: z.boolean().optional(), // Dealbreaker flag
  dealbreaker: z.boolean().optional(), // Alternative dealbreaker flag (legacy support)
});

// Validation schema for save request
const saveSchema = z.object({
  responses: z.record(z.string(), questionResponseSchema),
  freeResponses: z
    .object({
      freeResponse1: z.string().optional(),
      freeResponse2: z.string().optional(),
      freeResponse3: z.string().optional(),
      freeResponse4: z.string().optional(),
      freeResponse5: z.string().optional(),
    })
    .optional(),
  questionsCompleted: z.number().int().min(0).max(39).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    // Check if questionnaire deadline has passed
    const now = new Date();
    if (now > QUESTIONNAIRE_DEADLINE) {
      return NextResponse.json(
        {
          error: "Questionnaire submission deadline has passed",
          hint: "The deadline to submit your questionnaire was February 1, 2026 at 12:00 AM. You can no longer save changes to your questionnaire.",
        },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = saveSchema.parse(body);

    // Check if questionnaire already submitted (locked)
    const existing = await prisma.questionnaireResponseV2.findUnique({
      where: { userId: session.user.id },
      select: { isSubmitted: true },
    });

    if (existing?.isSubmitted) {
      return NextResponse.json(
        { error: "Questionnaire already submitted and cannot be edited" },
        { status: 403 },
      );
    }

    // Prepare data for database
    const updateData: any = {
      responses: validatedData.responses,
      updatedAt: new Date(),
    };

    // Add free response fields if provided
    if (validatedData.freeResponses) {
      if (validatedData.freeResponses.freeResponse1 !== undefined) {
        updateData.freeResponse1 = validatedData.freeResponses.freeResponse1;
      }
      if (validatedData.freeResponses.freeResponse2 !== undefined) {
        updateData.freeResponse2 = validatedData.freeResponses.freeResponse2;
      }
      if (validatedData.freeResponses.freeResponse3 !== undefined) {
        updateData.freeResponse3 = validatedData.freeResponses.freeResponse3;
      }
      if (validatedData.freeResponses.freeResponse4 !== undefined) {
        updateData.freeResponse4 = validatedData.freeResponses.freeResponse4;
      }
      if (validatedData.freeResponses.freeResponse5 !== undefined) {
        updateData.freeResponse5 = validatedData.freeResponses.freeResponse5;
      }
    }

    // Add completion tracking if provided
    if (validatedData.questionsCompleted !== undefined) {
      updateData.questionsCompleted = validatedData.questionsCompleted;
    }

    // Save draft (upsert: update if exists, create if not)
    const saved = await prisma.questionnaireResponseV2.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        responses: validatedData.responses,
        freeResponse1: validatedData.freeResponses?.freeResponse1,
        freeResponse2: validatedData.freeResponses?.freeResponse2,
        freeResponse3: validatedData.freeResponses?.freeResponse3,
        freeResponse4: validatedData.freeResponses?.freeResponse4,
        freeResponse5: validatedData.freeResponses?.freeResponse5,
        questionsCompleted: validatedData.questionsCompleted || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Questionnaire draft saved successfully",
      questionsCompleted: saved.questionsCompleted,
      lastSaved: saved.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error saving questionnaire V2:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to save questionnaire" },
      { status: 500 },
    );
  }
}
