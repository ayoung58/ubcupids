/**
 * Validation utilities for Questionnaire V2
 *
 * Validates user responses before submission and provides detailed error messages.
 */

import {
  QuestionnaireResponses,
  QuestionResponse,
  ImportanceLevel,
} from "@/types/questionnaire-v2";
import { ALL_QUESTIONS, FREE_RESPONSE_QUESTIONS } from "./config";

export interface ValidationError {
  questionId: string;
  questionNumber: number;
  field: "answer" | "preference" | "importance" | "age" | "freeResponse";
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  completedCount: number;
  requiredCount: number;
}

/**
 * Validate age value (18-40 range)
 */
function isValidAge(age: number | null): boolean {
  if (age === null) return false;
  return age >= 18 && age <= 40;
}

/**
 * Validate age range (min < max, both in valid range)
 */
function isValidAgeRange(
  minAge: number | null,
  maxAge: number | null
): boolean {
  if (minAge === null || maxAge === null) return false;
  if (!isValidAge(minAge) || !isValidAge(maxAge)) return false;
  return minAge < maxAge;
}

/**
 * Validate a single question response
 */
function validateQuestion(
  questionId: string,
  response: QuestionResponse | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  question: any
): ValidationError[] {
  const errors: ValidationError[] = [];
  const questionNumber = parseInt(questionId.replace("q", "").split("_")[0]);

  // Question not answered at all
  if (!response) {
    errors.push({
      questionId,
      questionNumber,
      field: "answer",
      message: "Question not answered",
    });
    return errors;
  }

  // Validate answer field
  if (response.answer === null || response.answer === undefined) {
    errors.push({
      questionId,
      questionNumber,
      field: "answer",
      message: "Answer is required",
    });
  }

  // Special validation for Q4 (Age)
  if (questionId === "q4") {
    const ageAnswer = response.answer as unknown as {
      userAge: number | null;
      minAge: number | null;
      maxAge: number | null;
    };

    if (!ageAnswer || !isValidAge(ageAnswer.userAge)) {
      errors.push({
        questionId,
        questionNumber: 4,
        field: "age",
        message: "Your age must be between 18 and 40",
      });
    }

    // Check preference if not "doesn't matter"
    if (!response.doesntMatter) {
      if (!isValidAgeRange(ageAnswer?.minAge, ageAnswer?.maxAge)) {
        errors.push({
          questionId,
          questionNumber: 4,
          field: "preference",
          message: "Age preference must be a valid range (18-40, min < max)",
        });
      }
    }
  }

  // Special validation for Q21 (Love Languages)
  if (questionId === "q21") {
    const answerArray = Array.isArray(response.answer) ? response.answer : [];
    if (answerArray.length !== 2) {
      errors.push({
        questionId,
        questionNumber: 21,
        field: "answer",
        message: "You must select exactly 2 love languages you show",
      });
    }

    if (!response.doesntMatter) {
      const preferenceArray = Array.isArray(response.preference)
        ? response.preference
        : [];
      if (preferenceArray.length !== 2) {
        errors.push({
          questionId,
          questionNumber: 21,
          field: "preference",
          message:
            "You must select exactly 2 love languages you like to receive",
        });
      }
    }
  }

  // Validate preference field (if question has preferences)
  if (question.hasPreference && !response.doesntMatter) {
    if (
      response.preference === null ||
      response.preference === undefined ||
      (Array.isArray(response.preference) && response.preference.length === 0)
    ) {
      errors.push({
        questionId,
        questionNumber,
        field: "preference",
        message: 'You must specify a preference or select "Doesn\'t matter"',
      });
    }
  }

  // Validate importance field (if question has preferences and not "doesn't matter")
  if (
    question.hasPreference &&
    !response.doesntMatter &&
    !response.isDealer &&
    !response.dealbreaker
  ) {
    if (!response.importance) {
      errors.push({
        questionId,
        questionNumber,
        field: "importance",
        message:
          'You must select an importance level, mark as dealbreaker, or select "Doesn\'t matter"',
      });
    }
  }

  return errors;
}

/**
 * Validate all questionnaire responses before submission
 */
export function validateQuestionnaireV2(
  responses: Partial<QuestionnaireResponses>,
  freeResponseValues: Record<string, string>
): ValidationResult {
  const errors: ValidationError[] = [];
  let completedCount = 0;

  // Validate all main questions
  ALL_QUESTIONS.forEach((question) => {
    const questionId = question.id as keyof QuestionnaireResponses;
    const response = responses[questionId];

    const questionErrors = validateQuestion(questionId, response, question);
    errors.push(...questionErrors);

    // Count as completed if no errors
    if (questionErrors.length === 0 && response) {
      completedCount++;
    }
  });

  // Validate mandatory free response questions
  FREE_RESPONSE_QUESTIONS.filter((q) => q.required).forEach((question) => {
    const value = freeResponseValues[question.id];
    if (!value || value.trim().length === 0) {
      errors.push({
        questionId: question.id,
        questionNumber: 0, // Free response doesn't have a number
        field: "freeResponse",
        message: `Free response "${(question as any).prompt || question.id}" is required`,
      });
    } else if (value.length > (question.maxLength || 300)) {
      errors.push({
        questionId: question.id,
        questionNumber: 0,
        field: "freeResponse",
        message: `Response exceeds maximum length of ${question.maxLength || 300} characters`,
      });
    } else {
      completedCount++;
    }
  });

  // Validate optional free responses (only check length if provided)
  FREE_RESPONSE_QUESTIONS.filter((q) => !q.required).forEach((question) => {
    const value = freeResponseValues[question.id];
    if (value && value.trim().length > 0) {
      if (value.length > (question.maxLength || 300)) {
        errors.push({
          questionId: question.id,
          questionNumber: 0,
          field: "freeResponse",
          message: `Response exceeds maximum length of ${question.maxLength || 300} characters`,
        });
      } else {
        completedCount++;
      }
    }
  });

  // Required count: All questions (37) + 2 mandatory free response = 39
  const requiredCount = ALL_QUESTIONS.length + 2;

  return {
    isValid: errors.length === 0,
    errors,
    completedCount,
    requiredCount,
  };
}

/**
 * Get human-readable error messages for display
 */
export function getErrorMessages(errors: ValidationError[]): string[] {
  return errors.map((error) => {
    if (error.questionNumber > 0) {
      return `Q${error.questionNumber}: ${error.message}`;
    }
    return error.message;
  });
}
