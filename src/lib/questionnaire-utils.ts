/**
 * Utility functions for the UBCupids Questionnaire
 */

import questionnaireConfig from "@/src/data/questionnaire-config.json";
import {
  QuestionnaireConfig,
  Responses,
  Question,
} from "./questionnaire-types";

/**
 * Get the complete questionnaire configuration
 */
export function getQuestionnaireConfig(): QuestionnaireConfig {
  return questionnaireConfig as QuestionnaireConfig;
}

/**
 * Get all questions flattened from all sections
 */
export function getAllQuestions(): Question[] {
  const config = getQuestionnaireConfig();
  return config.sections.flatMap((section) => section.questions);
}

/**
 * Get total number of questions
 */
export function getTotalQuestions(): number {
  const config = getQuestionnaireConfig();
  return config.sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );
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
 * Validate that all required questions have been answered
 * @returns Array of validation errors with question IDs (empty if valid)
 */
export function validateResponses(responses: Responses): ValidationError[] {
  const errors: ValidationError[] = [];
  const requiredQuestions = getRequiredQuestions();

  requiredQuestions.forEach((question) => {
    const response = responses[question.id];

    // Check if response exists and is not empty
    if (
      !response ||
      (typeof response === "string" && response.trim() === "") ||
      (Array.isArray(response) && response.length === 0)
    ) {
      errors.push({
        questionId: question.id,
        questionText: question.text,
        errorMessage: "Please provide an answer to this question",
      });
      return; // Skip further validation for this question
    }

    // Additional validation for text/textarea fields
    if (question.type === "text" || question.type === "textarea") {
      const textResponse = response as string;

      // Only validate length if we have a string response
      if (typeof textResponse === "string") {
        if (question.minLength && textResponse.length < question.minLength) {
          errors.push({
            questionId: question.id,
            questionText: question.text,
            errorMessage: `Please provide at least ${question.minLength} characters (currently ${textResponse.length})`,
          });
        }

        if (question.maxLength && textResponse.length > question.maxLength) {
          errors.push({
            questionId: question.id,
            questionText: question.text,
            errorMessage: `Please keep your response under ${question.maxLength} characters (currently ${textResponse.length})`,
          });
        }
      }
    }

    // Additional validation for text inputs in options
    if (question.type === "single-choice" && question.options) {
      const responseValue = response;
      if (
        responseValue &&
        typeof responseValue === "object" &&
        "value" in responseValue
      ) {
        // This is a response with a text input
        const optionResponse = responseValue as { value: string; text: string };
        const selectedOption = question.options.find(
          (opt) => opt.value === optionResponse.value
        );
        if (
          selectedOption?.hasTextInput &&
          (!optionResponse.text || optionResponse.text.trim() === "")
        ) {
          errors.push({
            questionId: question.id,
            questionText: question.text,
            errorMessage: `Please provide a description for "${selectedOption.label}"`,
          });
        }
      }
    }
    if (question.type === "multi-choice") {
      const arrayResponse = response as string[];

      // No specific multi-choice validations needed currently
    }

    // Additional validation for ranking questions requiring specific counts
    if (question.type === "ranking") {
      const arrayResponse = response as string[];

      if (question.id === "q30") {
        // Love languages you RECEIVE - require exactly 3 rankings
        if (!Array.isArray(arrayResponse) || arrayResponse.length !== 3) {
          errors.push({
            questionId: question.id,
            questionText: question.text,
            errorMessage:
              "Please rank 3 love languages for how you prefer to receive affection",
          });
        }
      }

      if (question.id === "q41") {
        // Love languages you GIVE - require exactly 3 rankings
        if (!Array.isArray(arrayResponse) || arrayResponse.length !== 3) {
          errors.push({
            questionId: question.id,
            questionText: question.text,
            errorMessage:
              "Please rank 3 love languages that you most naturally give",
          });
        }
      }
    }

    // Validation for age-range questions
    if (question.type === "age-range") {
      if (
        !response ||
        typeof response !== "object" ||
        !("minAge" in response) ||
        !("maxAge" in response)
      ) {
        errors.push({
          questionId: question.id,
          questionText: question.text,
          errorMessage: "Please provide both minimum and maximum age",
        });
      } else {
        const ageRange = response as { minAge: number; maxAge: number };
        if (ageRange.maxAge <= ageRange.minAge) {
          errors.push({
            questionId: question.id,
            questionText: question.text,
            errorMessage: "Maximum age must be greater than minimum age",
          });
        }
      }
    }
  });

  return errors;
}

/**
 * Calculate completion progress as a percentage (0-100)
 */
export function calculateProgress(responses: Responses): number {
  const totalQuestions = getTotalQuestions();
  const answeredQuestions = Object.keys(responses).filter((key) => {
    const response = responses[key];
    // Count as answered if not empty
    return (
      response &&
      (typeof response !== "string" || response.trim() !== "") &&
      (!Array.isArray(response) || response.length > 0)
    );
  }).length;

  return Math.round((answeredQuestions / totalQuestions) * 100);
}

/**
 * Check if questionnaire is complete (all required questions answered)
 */
export function isQuestionnaireComplete(responses: Responses): boolean {
  return validateResponses(responses).length === 0;
}

/**
 * Get a question by ID
 */
export function getQuestionById(questionId: string): Question | undefined {
  return getAllQuestions().find((q) => q.id === questionId);
}

/**
 * Get section progress (percentage of questions answered in a section)
 */
export function getSectionProgress(
  sectionId: string,
  responses: Responses
): number {
  const config = getQuestionnaireConfig();
  const section = config.sections.find((s) => s.id === sectionId);

  if (!section) return 0;

  const answeredInSection = section.questions.filter((q) => {
    const response = responses[q.id];
    return (
      response &&
      (typeof response !== "string" || response.trim() !== "") &&
      (!Array.isArray(response) || response.length > 0)
    );
  }).length;

  return Math.round((answeredInSection / section.questions.length) * 100);
}

/**
 * Count total answered questions
 */
export function countAnsweredQuestions(responses: Responses): number {
  return Object.keys(responses).filter((key) => {
    const response = responses[key];
    return (
      response &&
      (typeof response !== "string" || response.trim() !== "") &&
      (!Array.isArray(response) || response.length > 0)
    );
  }).length;
}

/**
 * Format progress message for UI
 */
export function getProgressMessage(responses: Responses): string {
  const answered = countAnsweredQuestions(responses);
  const total = getTotalQuestions();
  const remaining = total - answered;

  if (remaining === 0) {
    return "All questions answered! You're ready to submit.";
  }

  if (remaining === 1) {
    return "Almost there! Just 1 question left.";
  }

  return `${remaining} questions remaining`;
}
