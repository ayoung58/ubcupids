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
 * Validate that all required questions have been answered
 * @returns Array of error messages (empty if valid)
 */
export function validateResponses(responses: Responses): string[] {
  const errors: string[] = [];
  const requiredQuestions = getRequiredQuestions();

  requiredQuestions.forEach((question) => {
    const response = responses[question.id];

    // Check if response exists and is not empty
    if (
      !response ||
      (typeof response === "string" && response.trim() === "") ||
      (Array.isArray(response) && response.length === 0)
    ) {
      errors.push(`"${question.text}" is required`);
    }

    // Additional validation for text/textarea fields
    if (question.type === "text" || question.type === "textarea") {
      const textResponse = response as string;

      if (question.minLength && textResponse.length < question.minLength) {
        errors.push(
          `"${question.text}" must be at least ${question.minLength} characters`
        );
      }

      if (question.maxLength && textResponse.length > question.maxLength) {
        errors.push(
          `"${question.text}" must be no more than ${question.maxLength} characters`
        );
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
