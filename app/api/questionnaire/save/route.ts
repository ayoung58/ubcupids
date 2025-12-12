import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * POST /api/questionnaire/save
 * Save questionnaire as a draft (allows future editing)
 *
 * Request body:
 * - responses: Object mapping questionId -> answer
 * - importance: Optional object mapping questionId -> importance level
 *
 * Behavior:
 * - Creates new record if none exists
 * - Updates existing record if found
 * - Rejects if questionnaire already submitted (locked)
 */

// Validation schema for save request
const saveSchema = z.object({
  responses: z.record(
    z.string(),
    z.union([
      z.string(), // Single-choice, text, textarea
      z.array(z.string()), // Multi-choice
      z.number(), // Scale, ranking
    ])
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

    // Save draft (upsert: update if exists, create if not)
    await prisma.questionnaireResponse.upsert({
      where: { userId: session.user.id },
      update: {
        responses: validatedData.responses as any,
        importance: (validatedData.importance || {}) as any,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        responses: validatedData.responses as any,
        importance: (validatedData.importance || {}) as any,
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
