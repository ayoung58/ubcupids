/**
 * Matching Algorithm V2 - Phase 2: Similarity Calculation (Types A-H)
 *
 * Calculates raw similarity scores between user responses for all question types.
 * Returns a value in [0, 1] where:
 * - 1.0 = Perfect match (responses are identical or maximally compatible)
 * - 0.0 = Complete mismatch (responses are opposite or incompatible)
 *
 * Similarity Types:
 * - Type A: Numeric (Likert scale) - Linear distance-based
 * - Type B: Categorical (Single-select, same preference) - Exact match
 * - Type C: Categorical (Single-select, multi preference) - Subset match
 * - Type D: Multi-select (Multiple options) - Jaccard similarity
 * - Type E: Special (Age range) - Overlap percentage
 * - Type F: Same/Similar/Different preference - 3-tier preference
 * - Type G: Directional preference (more/less/similar/same) - Will use α/β in Phase 4
 * - Type H: Binary (yes/no) - Exact match
 *
 * @see docs/Matching/MATCHING_ALGORITHM_V2.md Phase 2
 */

import { MatchingUser } from "./types";
import { MATCHING_CONFIG } from "./config";

/**
 * Calculates similarity scores for all questions between two users
 * Returns object with similarity scores by question
 */
export function calculateSimilarity(
  userA: MatchingUser,
  userB: MatchingUser
): Record<string, number> {
  const similarities: Record<string, number> = {};

  // Get all question IDs from both users
  const questionIds = new Set([
    ...Object.keys(userA.responses),
    ...Object.keys(userB.responses),
  ]);

  questionIds.forEach((qId) => {
    // Determine question type based on question ID
    const questionType = determineQuestionType(qId);
    similarities[qId] = calculateQuestionSimilarity(
      qId,
      userA,
      userB,
      questionType
    );
  });

  return similarities;
}

/**
 * Determines the similarity calculation type for a question
 */
function determineQuestionType(
  questionId: string
):
  | "numeric"
  | "categorical-same"
  | "categorical-multi"
  | "multi-select"
  | "age"
  | "same-similar-different"
  | "directional"
  | "binary" {
  // Map question IDs to their types
  const typeMap: Record<string, any> = {
    q3: "age",
    q4: "age",
    q7: "numeric",
    q8: "categorical-multi",
    q10: "directional",
    q11: "numeric",
    q14: "numeric",
    q15: "multi-select",
    q16: "binary",
    q17: "binary",
    q18: "binary",
    q19: "binary",
    q20: "binary",
  };

  return typeMap[questionId] || "numeric";
}

/**
 * Calculates similarity for a single question between two users
 *
 * @param questionId - Question ID (e.g., "q10")
 * @param userA - First user
 * @param userB - Second user
 * @param questionType - Type of similarity calculation to use
 * @returns Similarity score [0, 1]
 */
export function calculateQuestionSimilarity(
  questionId: string,
  userA: MatchingUser,
  userB: MatchingUser,
  questionType:
    | "numeric"
    | "categorical-same"
    | "categorical-multi"
    | "multi-select"
    | "age"
    | "same-similar-different"
    | "directional"
    | "binary"
): number {
  const aResponse = userA.responses[questionId];
  const bResponse = userB.responses[questionId];

  // If either response is missing, return 0.5 (neutral)
  if (!aResponse || !bResponse) return 0.5;

  switch (questionType) {
    case "numeric":
      return calculateTypeA_Numeric(aResponse, bResponse);
    case "categorical-same":
      return calculateTypeB_CategoricalSame(aResponse, bResponse);
    case "categorical-multi":
      return calculateTypeC_CategoricalMulti(aResponse, bResponse);
    case "multi-select":
      return calculateTypeD_MultiSelect(aResponse, bResponse);
    case "age":
      return calculateTypeE_Age(aResponse, bResponse);
    case "same-similar-different":
      return calculateTypeF_SameSimilarDifferent(aResponse, bResponse);
    case "directional":
      return calculateTypeG_Directional(aResponse, bResponse);
    case "binary":
      return calculateTypeH_Binary(aResponse, bResponse);
    default:
      console.warn(`Unknown question type: ${questionType} for ${questionId}`);
      return 0.5;
  }
}

/**
 * Type A: Numeric (Likert scale)
 * Similarity = 1 - (|A - B| / max_range)
 *
 * Example: 5-point scale (1-5), A=2, B=4
 * Similarity = 1 - (|2-4| / 4) = 1 - 0.5 = 0.5
 */
function calculateTypeA_Numeric(aResponse: any, bResponse: any): number {
  const aAnswer = aResponse.answer;
  const bAnswer = bResponse.answer;

  if (typeof aAnswer !== "number" || typeof bAnswer !== "number") return 0.5;

  // Assume 1-5 scale (most common)
  const maxRange = 4; // Max distance on 1-5 scale
  const distance = Math.abs(aAnswer - bAnswer);
  const similarity = 1 - distance / maxRange;

  return Math.max(0, Math.min(1, similarity));
}

/**
 * Type B: Categorical (Single-select, same preference)
 * User wants partner with same answer
 *
 * Similarity = 1.0 if answers match, 0.0 otherwise
 */
function calculateTypeB_CategoricalSame(
  aResponse: any,
  bResponse: any
): number {
  const aAnswer = aResponse.answer;
  const bAnswer = bResponse.answer;

  return aAnswer === bAnswer ? 1.0 : 0.0;
}

/**
 * Type C: Categorical (Single-select, multi preference)
 * User specifies list of acceptable answers
 *
 * Similarity:
 * - 1.0 if partner's answer is in user's preference list
 * - 0.0 otherwise
 *
 * Returns average of (A satisfied by B, B satisfied by A)
 */
function calculateTypeC_CategoricalMulti(
  aResponse: any,
  bResponse: any
): number {
  const aAnswer = aResponse.answer;
  const bAnswer = bResponse.answer;
  const aPreference = aResponse.preference || [];
  const bPreference = bResponse.preference || [];

  // If no preferences specified, assume flexible (1.0)
  const aSatisfied =
    aPreference.length === 0 ? 1.0 : aPreference.includes(bAnswer) ? 1.0 : 0.0;
  const bSatisfied =
    bPreference.length === 0 ? 1.0 : bPreference.includes(aAnswer) ? 1.0 : 0.0;

  // Average of mutual satisfaction
  return (aSatisfied + bSatisfied) / 2;
}

/**
 * Type D: Multi-select (Multiple options)
 * Uses Jaccard similarity: |A ∩ B| / |A ∪ B|
 *
 * Example: A=[1,2,3], B=[2,3,4]
 * Intersection = [2,3] (size 2)
 * Union = [1,2,3,4] (size 4)
 * Similarity = 2/4 = 0.5
 */
function calculateTypeD_MultiSelect(aResponse: any, bResponse: any): number {
  const aAnswer = aResponse.answer || [];
  const bAnswer = bResponse.answer || [];

  if (!Array.isArray(aAnswer) || !Array.isArray(bAnswer)) return 0.5;
  if (aAnswer.length === 0 && bAnswer.length === 0) return 1.0;

  // Calculate Jaccard similarity
  const aSet = new Set(aAnswer);
  const bSet = new Set(bAnswer);
  const intersection = new Set([...aSet].filter((x) => bSet.has(x)));
  const union = new Set([...aSet, ...bSet]);

  if (union.size === 0) return 1.0;

  return intersection.size / union.size;
}

/**
 * Type E: Age (Special case)
 * Checks if userB's age falls within userA's preferred age range
 *
 * Structure:
 * - answer: { age: number }
 * - preference: { minAge: number, maxAge: number } OR { doesntMatter: true }
 *
 * Similarity:
 * - 1.0 if userB's age is within userA's range (and vice versa)
 * - 0.0 if outside range
 * - Average of both directions
 */
function calculateTypeE_Age(aResponse: any, bResponse: any): number {
  const aAge = aResponse.answer?.age;
  const bAge = bResponse.answer?.age;

  if (typeof aAge !== "number" || typeof bAge !== "number") return 0.5;

  const aPreference = aResponse.preference || {};
  const bPreference = bResponse.preference || {};

  // Check if A's preference is satisfied by B's age
  let aSatisfied = 1.0;
  if (!aPreference.doesntMatter && aPreference.minAge && aPreference.maxAge) {
    aSatisfied =
      bAge >= aPreference.minAge && bAge <= aPreference.maxAge ? 1.0 : 0.0;
  }

  // Check if B's preference is satisfied by A's age
  let bSatisfied = 1.0;
  if (!bPreference.doesntMatter && bPreference.minAge && bPreference.maxAge) {
    bSatisfied =
      aAge >= bPreference.minAge && aAge <= bPreference.maxAge ? 1.0 : 0.0;
  }

  return (aSatisfied + bSatisfied) / 2;
}

/**
 * Type F: Same/Similar/Different preference
 * 3-tier preference system
 *
 * Structure:
 * - preference: "same" | "similar" | "different"
 *
 * Similarity calculation:
 * 1. Calculate raw answer similarity using Type A (numeric distance)
 * 2. Map to preference:
 *    - "same": High similarity (0.8-1.0) = satisfied
 *    - "similar": Medium similarity (0.4-0.8) = satisfied
 *    - "different": Low similarity (0.0-0.4) = satisfied
 * 3. Return average of (A satisfied, B satisfied)
 */
function calculateTypeF_SameSimilarDifferent(
  aResponse: any,
  bResponse: any
): number {
  // First, calculate raw numeric similarity
  const rawSimilarity = calculateTypeA_Numeric(aResponse, bResponse);

  const aPreference = aResponse.preference;
  const bPreference = bResponse.preference;

  // Check if A's preference is satisfied
  let aSatisfied = 0.0;
  if (aPreference === "same") {
    aSatisfied = rawSimilarity >= 0.8 ? 1.0 : rawSimilarity / 0.8;
  } else if (aPreference === "similar") {
    aSatisfied = rawSimilarity >= 0.4 && rawSimilarity <= 0.8 ? 1.0 : 0.5;
  } else if (aPreference === "different") {
    aSatisfied = rawSimilarity <= 0.4 ? 1.0 : (1 - rawSimilarity) / 0.6;
  }

  // Check if B's preference is satisfied
  let bSatisfied = 0.0;
  if (bPreference === "same") {
    bSatisfied = rawSimilarity >= 0.8 ? 1.0 : rawSimilarity / 0.8;
  } else if (bPreference === "similar") {
    bSatisfied = rawSimilarity >= 0.4 && rawSimilarity <= 0.8 ? 1.0 : 0.5;
  } else if (bPreference === "different") {
    bSatisfied = rawSimilarity <= 0.4 ? 1.0 : (1 - rawSimilarity) / 0.6;
  }

  return (aSatisfied + bSatisfied) / 2;
}

/**
 * Type G: Directional preference (more/less/similar/same)
 * For now, returns raw numeric similarity
 * α/β multipliers will be applied in Phase 4
 *
 * Structure:
 * - answer: number (Likert scale)
 * - preference: "more" | "less" | "similar" | "same"
 */
function calculateTypeG_Directional(aResponse: any, bResponse: any): number {
  // For Phase 2, just calculate raw numeric similarity
  // Phase 4 will apply α/β based on directional preference alignment
  return calculateTypeA_Numeric(aResponse, bResponse);
}

/**
 * Type H: Binary (yes/no)
 * Simple exact match
 *
 * Similarity = 1.0 if answers match, 0.0 otherwise
 */
function calculateTypeH_Binary(aResponse: any, bResponse: any): number {
  const aAnswer = aResponse.answer;
  const bAnswer = bResponse.answer;

  return aAnswer === bAnswer ? 1.0 : 0.0;
}
