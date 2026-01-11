import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  validateQuestionnaireV2,
  getErrorMessages,
} from "@/lib/questionnaire/v2/validation";
import { QuestionnaireResponses } from "@/types/questionnaire-v2";
import { z } from "zod";

/**
 * POST /api/questionnaire/v2/validate
 * Validate questionnaire V2 responses before submission
 *
 * Request body:
 * - responses: Object mapping questionId -> { answer, preference, importance, doesntMatter, isDealer }
 * - freeResponses: Object with freeResponse1-5 keys
 *
 * Returns:
 * - isValid: Boolean indicating if all validations pass
 * - errors: Array of validation errors with details
 * - completedCount: Number of completed questions
 * - requiredCount: Total required questions (39)
 */

const validateSchema = z.object({
  responses: z.record(z.string(), z.any()),
  freeResponses: z.record(z.string(), z.string()).optional(),
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
    const validatedData = validateSchema.parse(body);

    // Run validation
    const validationResult = validateQuestionnaireV2(
      validatedData.responses as Partial<QuestionnaireResponses>,
      validatedData.freeResponses || {}
    );

    // Return validation results
    return NextResponse.json({
      success: true,
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      errorMessages: getErrorMessages(validationResult.errors),
      completedCount: validationResult.completedCount,
      requiredCount: validationResult.requiredCount,
      completionPercentage: Math.round(
        (validationResult.completedCount / validationResult.requiredCount) * 100
      ),
    });
  } catch (error) {
    console.error("Error validating questionnaire V2:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to validate questionnaire" },
      { status: 500 }
    );
  }
}
