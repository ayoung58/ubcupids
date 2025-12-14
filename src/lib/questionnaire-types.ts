/**
 * TypeScript types for the UBCupids Questionnaire
 */

// Question types supported in the questionnaire
export type QuestionType =
  | "single-choice" // Radio buttons (one selection)
  | "multi-choice" // Checkboxes (multiple selections)
  | "text" // Short text input
  | "textarea" // Long text input (multi-line)
  | "ranking" // Drag-to-rank items
  | "scale"; // Slider (numeric scale)

// Option for single-choice and multi-choice questions
export interface QuestionOption {
  value: string;
  label: string;
  hasTextInput?: boolean; // For "Other: ___" text input options
}

// Individual question structure
export interface Question {
  id: string; // Unique identifier (e.g., "q0.1", "q1")
  type: QuestionType; // Type of question
  text: string; // Question text shown to user
  required: boolean; // Whether answer is required
  options?: QuestionOption[]; // Options for single/multi choice
  placeholder?: string; // Placeholder for text inputs
  minLength?: number; // Min length for text inputs
  maxLength?: number; // Max length for text inputs
  min?: number; // Min value for scale questions
  max?: number; // Max value for scale questions
  step?: number; // Step for scale questions
}

// Section grouping multiple questions
export interface Section {
  id: string; // Unique identifier (e.g., "section-0")
  title: string; // Section title
  description?: string; // Optional section description
  questions: Question[];
}

// Pre-questionnaire agreement structure
export interface AgreementConfig {
  title: string;
  description: string;
  points: string[];
  commitments?: string[];
  reminder?: string;
  agreementText: string;
}

// Complete questionnaire configuration
export interface QuestionnaireConfig {
  agreement: AgreementConfig;
  sections: Section[];
}

// Response value types (what users submit)
export type ResponseValue =
  | string
  | string[]
  | number
  | { value: string; text: string };

// User's responses (questionId -> value)
export type Responses = Record<string, ResponseValue>;

// Importance levels for question weighting (1-5 numeric scale)
// 1 = Not Important
// 2 = Somewhat Important
// 3 = Important (default)
// 4 = Very Important
// 5 = Deal Breaker
export type ImportanceLevel = 1 | 2 | 3 | 4 | 5;

// User's importance ratings (questionId -> importance level)
export type ImportanceRatings = Record<string, ImportanceLevel>;

// Database model interface (matches Prisma schema)
export interface QuestionnaireResponseData {
  id: string;
  userId: string;
  responses: Responses;
  importance?: ImportanceRatings;
  isSubmitted: boolean;
  submittedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
