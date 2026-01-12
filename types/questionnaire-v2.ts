/**
 * Questionnaire V2 Type Definitions
 *
 * Complete type system for the split-screen questionnaire.
 * Defines all response types, preference types, and question configurations.
 */

// ============================================
// ENUMS
// ============================================

/**
 * Importance levels for each question
 */
export enum ImportanceLevel {
  NOT_IMPORTANT = "not_important",
  SOMEWHAT_IMPORTANT = "somewhat_important",
  IMPORTANT = "important",
  VERY_IMPORTANT = "very_important",
}

/**
 * Question types based on matching algorithm classification
 */
export enum QuestionType {
  // Type A: Categorical single-select (no preference)
  CATEGORICAL_NO_PREFERENCE = "categorical_no_preference",

  // Type B: Categorical single-select with "same" preference
  CATEGORICAL_SAME_PREFERENCE = "categorical_same_preference",

  // Type C: Multi-select with multi-select preference
  MULTI_SELECT_WITH_PREFERENCE = "multi_select_with_preference",

  // Type D: Single-select with multi-select preference
  SINGLE_SELECT_MULTI_PREFERENCE = "single_select_multi_preference",

  // Type E: Compound question (Drug Use Q9)
  COMPOUND_SUBSTANCES_FREQUENCY = "compound_substances_frequency",

  // Type F: Likert with same/similar preference
  LIKERT_SAME_SIMILAR = "likert_same_similar",

  // Type G: Likert with directional preference (more/less)
  LIKERT_DIRECTIONAL = "likert_directional",

  // Type H: Likert with different preference
  LIKERT_DIFFERENT = "likert_different",

  // Type I: Special cases
  SPECIAL_LOVE_LANGUAGES = "special_love_languages",
  SPECIAL_SLEEP_SCHEDULE = "special_sleep_schedule",
  SPECIAL_CONFLICT_RESOLUTION = "special_conflict_resolution",
  SPECIAL_AGE = "special_age",
}

/**
 * Preference type options
 */
export enum PreferenceType {
  // For Type B questions
  SAME = "same",

  // For Type C questions (multi-select)
  SAME_OR_SIMILAR = "same_or_similar",

  // For Type F questions (Likert)
  SIMILAR = "similar",

  // For Type G questions (directional)
  MORE = "more",
  LESS = "less",

  // For Type H questions (complementary)
  DIFFERENT = "different",

  // For Q25 (Conflict Resolution)
  COMPATIBLE = "compatible",
  NO_PREFERENCE = "no_preference",

  // Universal option
  DOESNT_MATTER = "doesnt_matter",
}

/**
 * Section classification
 */
export enum Section {
  SECTION_1 = "section_1", // Q1-Q20: Lifestyle
  SECTION_2 = "section_2", // Q21-Q36: Personality
  FREE_RESPONSE = "free_response",
}

// ============================================
// ANSWER TYPES
// ============================================

/**
 * Single-select answer (string value)
 */
export type SingleSelectAnswer = string;

/**
 * Multi-select answer (array of strings)
 */
export type MultiSelectAnswer = string[];

/**
 * Likert scale answer (1-5)
 */
export type LikertAnswer = 1 | 2 | 3 | 4 | 5;

/**
 * Age range answer
 */
export interface AgeRangeAnswer {
  min: number;
  max: number;
}

/**
 * Drug use compound answer (Q9)
 */
export interface DrugUseAnswer {
  substances: string[]; // Multi-select: Cannabis, Cigarettes, Vaping, Other, None
  frequency: "never" | "occasionally" | "regularly";
}

/**
 * Love languages answer (Q21)
 */
export interface LoveLanguagesAnswer {
  show: string[]; // Exactly 2 selections
  receive: string[]; // Exactly 2 selections
}

// ============================================
// PREFERENCE TYPES
// ============================================

/**
 * Single-select preference (for Type D questions)
 */
export type SingleSelectPreference = string[];

/**
 * Multi-select preference (for Type C questions)
 */
export type MultiSelectPreference = string[];

/**
 * Same/Similar/Different preference (for Likert questions)
 */
export type SameSimilarDifferentPreference =
  | PreferenceType.SAME
  | PreferenceType.SIMILAR
  | PreferenceType.DIFFERENT
  | PreferenceType.DOESNT_MATTER;

/**
 * Directional preference (more/less/similar for Type G)
 */
export type DirectionalPreference =
  | PreferenceType.MORE
  | PreferenceType.LESS
  | PreferenceType.SIMILAR
  | PreferenceType.DOESNT_MATTER;

/**
 * Conflict resolution preference (Q25)
 */
export type ConflictResolutionPreference =
  | PreferenceType.SAME
  | PreferenceType.COMPATIBLE
  | PreferenceType.NO_PREFERENCE;

/**
 * Drug use preference (Q9)
 */
export interface DrugUsePreference {
  substances: string[]; // Which substances are acceptable
  frequency: PreferenceType.SIMILAR | PreferenceType.DOESNT_MATTER;
}

/**
 * Generic preference type (union of all preference types)
 */
export type QuestionPreference =
  | null // Q1, Q2, Q4 (hard filters with no preference UI)
  | string // Single value like "same"
  | string[] // Multi-select like ["Asian", "White"]
  | SameSimilarDifferentPreference
  | DirectionalPreference
  | ConflictResolutionPreference
  | DrugUsePreference
  | AgeRangeAnswer;

// ============================================
// QUESTION RESPONSE
// ============================================

/**
 * Complete response for a single question
 * This is what gets stored in the responses JSON field
 */
export interface QuestionResponse {
  // User's answer (left side of split screen)
  answer:
    | SingleSelectAnswer
    | MultiSelectAnswer
    | LikertAnswer
    | AgeRangeAnswer
    | DrugUseAnswer
    | LoveLanguagesAnswer
    | null;

  // User's preference for their match (right side of split screen)
  // Null for Q1, Q2, Q4 (hard filters) or when doesntMatter is true
  preference: QuestionPreference;

  // Importance level (disabled when doesntMatter = true)
  importance: ImportanceLevel | null;

  // Dealbreaker flag (disabled when doesntMatter = true)
  dealbreaker: boolean;

  // "Doesn't matter" flag - when true, this question is excluded from matching
  // Also aliased as isDealer for dealbreaker to maintain compatibility
  doesntMatter?: boolean;
  isDealer?: boolean; // Alias for dealbreaker
}

/**
 * Complete questionnaire response structure
 * This matches the `responses` JSON field in QuestionnaireResponseV2 model
 */
export interface QuestionnaireResponses {
  q1?: QuestionResponse;
  q2?: QuestionResponse;
  q3?: QuestionResponse;
  q4?: QuestionResponse;
  q5?: QuestionResponse;
  q6?: QuestionResponse;
  q7?: QuestionResponse;
  q8?: QuestionResponse;
  q9?: QuestionResponse;
  q10?: QuestionResponse;
  q11?: QuestionResponse;
  q12?: QuestionResponse;
  q13?: QuestionResponse;
  q14?: QuestionResponse;
  q15?: QuestionResponse;
  q16?: QuestionResponse;
  q17?: QuestionResponse;
  q18?: QuestionResponse;
  q19?: QuestionResponse;
  q20?: QuestionResponse;
  q21?: QuestionResponse;
  q22?: QuestionResponse;
  q23?: QuestionResponse;
  q24?: QuestionResponse;
  q25?: QuestionResponse;
  q26?: QuestionResponse;
  q27?: QuestionResponse;
  q28?: QuestionResponse;
  q29?: QuestionResponse;
  q30?: QuestionResponse;
  q31?: QuestionResponse;
  q32?: QuestionResponse;
  q33?: QuestionResponse;
  q34?: QuestionResponse;
  q35?: QuestionResponse;
  q36?: QuestionResponse;
}

// ============================================
// QUESTION CONFIGURATION
// ============================================

/**
 * Option for single-select or multi-select questions
 */
export interface QuestionOption {
  value: string;
  label: string;
  // If true, selecting this option disables other options (e.g., "Anyone" in Q2)
  exclusive?: boolean;
  // If true, this option allows custom text input (e.g., "Other" with text field)
  allowCustomInput?: boolean;
}

/**
 * Likert scale configuration
 */
export interface LikertConfig {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  midLabel?: string; // Optional label for middle value
}

/**
 * Validation rules for a question
 */
export interface QuestionValidation {
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  customValidator?: (value: any) => string | null; // Returns error message or null
}

/**
 * Complete question configuration
 */
export interface QuestionConfig {
  id: string; // e.g., "q1", "q2", etc.
  section: Section;
  type: QuestionType;

  // Question text (left side)
  questionText: string;

  // Answer configuration (left side)
  answerFormat:
    | "single-select"
    | "multi-select"
    | "likert"
    | "numeric"
    | "compound";
  options?: QuestionOption[]; // For single/multi-select
  likertConfig?: LikertConfig; // For Likert scales

  // Preference configuration (right side)
  hasPreference: boolean; // False for Q1, Q2, Q4
  preferenceText?: string; // e.g., "I prefer my match to..."
  preferenceFormat?:
    | "same"
    | "same-or-similar"
    | "similar"
    | "same-similar-different"
    | "directional"
    | "multi-select"
    | "special";
  preferenceOptions?: QuestionOption[]; // For multi-select preferences

  // Validation
  validation: QuestionValidation;

  // UI hints
  helpText?: string;
  warningText?: string;
  placeholder?: string;
}

// ============================================
// FREE RESPONSE TYPES
// ============================================

/**
 * Free response question configuration
 */
export interface FreeResponseConfig {
  id: string; // e.g., "freeResponse1"
  questionText: string;
  required: boolean;
  maxLength: number;
  placeholder?: string;
  helpText?: string;
}

// ============================================
// FORM STATE TYPES
// ============================================

/**
 * Questionnaire form state
 */
export interface QuestionnaireFormState {
  responses: QuestionnaireResponses;
  freeResponse1: string;
  freeResponse2: string;
  freeResponse3: string;
  freeResponse4: string;
  freeResponse5: string;
  questionsCompleted: number;
  isSubmitted: boolean;
  lastSaved: Date | null;
  isDirty: boolean; // Has unsaved changes
}

/**
 * Validation error for a question
 */
export interface ValidationError {
  questionId: string;
  field: "answer" | "preference" | "importance";
  message: string;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================
// API TYPES
// ============================================

/**
 * Request body for saving questionnaire
 */
export interface SaveQuestionnaireRequest {
  responses: QuestionnaireResponses;
  freeResponse1?: string;
  freeResponse2?: string;
  freeResponse3?: string;
  freeResponse4?: string;
  freeResponse5?: string;
  questionsCompleted: number;
  isSubmitted: boolean;
}

/**
 * Response from save endpoint
 */
export interface SaveQuestionnaireResponse {
  success: boolean;
  message: string;
  savedAt: string;
  questionsCompleted: number;
}

/**
 * Response from load endpoint
 */
export interface LoadQuestionnaireResponse {
  success: boolean;
  data: QuestionnaireFormState | null;
  needsQuestionnaireUpdate: boolean;
}

/**
 * Response from validate endpoint
 */
export interface ValidateQuestionnaireResponse {
  success: boolean;
  validation: ValidationResult;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Extract answer type for a specific question
 */
export type QuestionAnswerType<Q extends QuestionType> = Q extends
  | QuestionType.CATEGORICAL_NO_PREFERENCE
  | QuestionType.CATEGORICAL_SAME_PREFERENCE
  | QuestionType.SINGLE_SELECT_MULTI_PREFERENCE
  ? SingleSelectAnswer
  : Q extends QuestionType.MULTI_SELECT_WITH_PREFERENCE
    ? MultiSelectAnswer
    : Q extends
          | QuestionType.LIKERT_SAME_SIMILAR
          | QuestionType.LIKERT_DIRECTIONAL
          | QuestionType.LIKERT_DIFFERENT
      ? LikertAnswer
      : Q extends QuestionType.COMPOUND_SUBSTANCES_FREQUENCY
        ? DrugUseAnswer
        : Q extends QuestionType.SPECIAL_LOVE_LANGUAGES
          ? LoveLanguagesAnswer
          : never;

/**
 * Type guard to check if a value is a valid ImportanceLevel
 */
export function isImportanceLevel(value: any): value is ImportanceLevel {
  return Object.values(ImportanceLevel).includes(value);
}

/**
 * Type guard to check if a value is a valid PreferenceType
 */
export function isPreferenceType(value: any): value is PreferenceType {
  return Object.values(PreferenceType).includes(value);
}

/**
 * Type guard to check if a value is a valid LikertAnswer
 */
export function isLikertAnswer(value: any): value is LikertAnswer {
  return (
    typeof value === "number" &&
    value >= 1 &&
    value <= 5 &&
    Number.isInteger(value)
  );
}

/**
 * Helper type for question IDs
 */
export type QuestionId = keyof QuestionnaireResponses;

/**
 * Helper type for free response IDs
 */
export type FreeResponseId =
  | "freeResponse1"
  | "freeResponse2"
  | "freeResponse3"
  | "freeResponse4"
  | "freeResponse5";
