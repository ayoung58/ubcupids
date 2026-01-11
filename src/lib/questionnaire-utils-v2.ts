/**
 * Utility functions for the UBCupids Questionnaire V2
 */

import {
  questionnaireConfigV2,
  getTotalQuestions as getV2TotalQuestions,
} from "@/app/(dashboard)/questionnaire/_components/questionnaireConfigV2";
import {
  QuestionnaireConfig,
  Responses,
  Question,
  QuestionResponse,
} from "./questionnaire-types";

/**
 * Get the complete questionnaire configuration (V2)
 */
export function getQuestionnaireConfig(): QuestionnaireConfig {
  return questionnaireConfigV2;
}

/**
 * Get all questions flattened from all sections
 */
export function getAllQuestions(): Question[] {
  const config = getQuestionnaireConfig();
  return config.sections.flatMap((section) => section.questions);
}

/**
 * Get total number of required questions (for progress calculation)
 * V2: Q1-Q36 (algorithm) + Q37-Q38 (mandatory free response) = 38 total
 */
export function getTotalQuestions(): number {
  return getV2TotalQuestions();
}

/**
 * Get all required questions
 */
export function getRequiredQuestions(): Question[] {
  return getAllQuestions().filter((q) => q.required);
}

/**
 * Validation error with question details
 */
export interface ValidationError {
  questionId: string;
  questionText: string;
  errorMessage: string;
}

/**
 * Validate that all required questions have been answered (V2 format)
 * @returns Array of validation errors with question IDs (empty if valid)
 */
export function validateResponses(responses: Responses): ValidationError[] {
  const errors: ValidationError[] = [];
  const requiredQuestions = getRequiredQuestions();

  requiredQuestions.forEach((question) => {
    const response = responses[question.id] as QuestionResponse | undefined;

    // Check if response exists
    if (!response) {
      errors.push({
        questionId: question.id,
        questionText: question.text,
        errorMessage: "Please provide an answer to this question",
      });
      return;
    }

    // Check ownAnswer is not empty
    const ownAnswer = response.ownAnswer;
    if (
      !ownAnswer ||
      (typeof ownAnswer === "string" && ownAnswer.trim() === "") ||
      (Array.isArray(ownAnswer) && ownAnswer.length === 0)
    ) {
      errors.push({
        questionId: question.id,
        questionText: question.text,
        errorMessage: "Please provide an answer to this question",
      });
      return;
    }

    // Additional validation for text/textarea fields
    if (question.type === "text" || question.type === "textarea") {
      const textResponse = ownAnswer as string;

      if (typeof textResponse === "string") {
        // Min length validation
        if (question.minLength && textResponse.length < question.minLength) {
          errors.push({
            questionId: question.id,
            questionText: question.text,
            errorMessage: `Please provide at least ${question.minLength} characters (currently ${textResponse.length})`,
          });
        }

        // Max length validation
        if (question.maxLength && textResponse.length > question.maxLength) {
          errors.push({
            questionId: question.id,
            questionText: question.text,
            errorMessage: `Please keep your response under ${question.maxLength} characters (currently ${textResponse.length})`,
          });
        }
      }
    }

    // Validation for special cases
    if (question.id === "q21") {
      // Love languages: check both show and receive
      const loveLangs = ownAnswer as { show?: string[]; receive?: string[] };
      if (!loveLangs.show || loveLangs.show.length === 0) {
        errors.push({
          questionId: question.id,
          questionText: question.text,
          errorMessage: "Please select at least one love language you SHOW",
        });
      }
      if (
        !response.preference?.value ||
        (response.preference.value as string[]).length === 0
      ) {
        errors.push({
          questionId: question.id,
          questionText: question.text,
          errorMessage:
            "Please select at least one love language you like to RECEIVE",
        });
      }
    }
  });

  return errors;
}

/**
 * Calculate progress as a percentage (V2 format)
 * Counts only required questions with ownAnswer filled
 */
export function calculateProgress(responses: Responses): number {
  const requiredQuestions = getRequiredQuestions();
  if (requiredQuestions.length === 0) return 0;

  const answeredCount = requiredQuestions.filter((question) => {
    const response = responses[question.id] as QuestionResponse | undefined;
    if (!response || !response.ownAnswer) return false;

    const ownAnswer = response.ownAnswer;

    // Check if ownAnswer is not empty
    if (typeof ownAnswer === "string") {
      return ownAnswer.trim() !== "";
    }
    if (Array.isArray(ownAnswer)) {
      return ownAnswer.length > 0;
    }
    if (typeof ownAnswer === "number") {
      return !isNaN(ownAnswer);
    }
    if (typeof ownAnswer === "object") {
      return Object.keys(ownAnswer).length > 0;
    }

    return true;
  }).length;

  return Math.round((answeredCount / requiredQuestions.length) * 100);
}

/**
 * Get progress for a specific section (V2 format)
 */
export function getSectionProgress(
  sectionId: string,
  responses: Responses
): number {
  const config = getQuestionnaireConfig();
  const section = config.sections.find((s) => s.id === sectionId);

  if (!section) return 0;

  const requiredQuestions = section.questions.filter((q) => q.required);
  if (requiredQuestions.length === 0) return 100;

  const answeredCount = requiredQuestions.filter((question) => {
    const response = responses[question.id] as QuestionResponse | undefined;
    if (!response || !response.ownAnswer) return false;

    const ownAnswer = response.ownAnswer;

    if (typeof ownAnswer === "string") {
      return ownAnswer.trim() !== "";
    }
    if (Array.isArray(ownAnswer)) {
      return ownAnswer.length > 0;
    }
    if (typeof ownAnswer === "number") {
      return !isNaN(ownAnswer);
    }
    if (typeof ownAnswer === "object") {
      return Object.keys(ownAnswer).length > 0;
    }

    return true;
  }).length;

  return Math.round((answeredCount / requiredQuestions.length) * 100);
}

/**
 * Get a question by its ID
 */
export function getQuestionById(questionId: string): Question | undefined {
  return getAllQuestions().find((q) => q.id === questionId);
}

/**
 * Check if a question has importance rating
 * V2: All questions except hard filters (Q1, Q2, Q4) and free response (Q37-Q38)
 */
export function questionHasImportance(questionId: string): boolean {
  const hardFilters = ["q1", "q2", "q4"];
  const freeResponse = ["q37", "q38"];
  return (
    !hardFilters.includes(questionId) && !freeResponse.includes(questionId)
  );
}

/**
 * Check if a question is a hard filter
 */
export function isHardFilter(questionId: string): boolean {
  return ["q1", "q2", "q4"].includes(questionId);
}

/**
 * Check if a question is free response
 */
export function isFreeResponse(questionId: string): boolean {
  return ["q37", "q38"].includes(questionId);
}
