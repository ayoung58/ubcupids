/**
 * Matching Algorithm V2.2 - Phase 1: Hard Filters & Dealbreakers
 *
 * Determines if two users are compatible based on hard constraints:
 * 1. Gender compatibility (mutual interest)
 * 2. Dealbreaker questions (any question marked with dealbreaker flag)
 *
 * Per V2.2 spec: "A pair (A, B) is immediately disqualified if either user
 * marks a question as Dealbreaker and the other user provides an incompatible response."
 *
 * @see docs/Questionnaire/Questionnaire_Updated_Version/Questionnaire_Version_2.2_Matching_Algo_Raw.md Phase 1
 */

import { HardFilterResult, MatchingUser } from "./types";

export type { HardFilterResult };

/**
 * Questions that are hard filters by design (cannot have dealbreaker flag)
 * Q1: Gender Identity
 * Q2: Gender Preference
 * Q4: Age
 */
const HARD_FILTER_QUESTIONS = ["q1", "q2", "q4"] as const;

/**
 * Checks if two users pass all hard filters
 *
 * @param userA - First user
 * @param userB - Second user
 * @returns Filter result indicating eligibility and failure reasons
 */
export function checkHardFilters(
  userA: MatchingUser,
  userB: MatchingUser
): HardFilterResult {
  // Phase 1.1: Gender compatibility check
  const genderCompatible = checkGenderCompatibility(userA, userB);
  if (!genderCompatible) {
    return {
      passed: false,
      reason: "Gender incompatibility",
    };
  }

  // Phase 1.2: Check all dealbreaker questions
  const dealbreakerResult = checkAllDealbreakers(userA, userB);
  if (!dealbreakerResult.passed) {
    return dealbreakerResult;
  }

  return {
    passed: true,
  };
}

/**
 * Checks if two users are mutually interested in each other's genders
 *
 * For userA to be compatible with userB:
 * - userB's gender must be in userA's interestedInGenders
 * - userA's gender must be in userB's interestedInGenders
 *
 * @param userA - First user
 * @param userB - Second user
 * @returns True if both users are interested in each other's genders
 */
function checkGenderCompatibility(
  userA: MatchingUser,
  userB: MatchingUser
): boolean {
  const aInterestedInB = userA.interestedInGenders.includes(userB.gender);
  const bInterestedInA = userB.interestedInGenders.includes(userA.gender);

  return aInterestedInB && bInterestedInA;
}

/**
 * Checks all questions marked as dealbreakers by either user
 *
 * Generic dealbreaker logic per V2.2:
 * - If User A marks question as dealbreaker AND User B's answer is incompatible → fail
 * - If User B marks question as dealbreaker AND User A's answer is incompatible → fail
 * - Compatibility is determined by question type and preference specification
 *
 * @param userA - First user
 * @param userB - Second user
 * @returns Filter result indicating if dealbreakers passed
 */
function checkAllDealbreakers(
  userA: MatchingUser,
  userB: MatchingUser
): HardFilterResult {
  const failedQuestions: string[] = [];

  // Get all question IDs from both users (excluding hard filters)
  const allQuestionIds = new Set([
    ...Object.keys(userA.responses),
    ...Object.keys(userB.responses),
  ]);

  for (const questionId of allQuestionIds) {
    // Skip hard filter questions
    if (HARD_FILTER_QUESTIONS.includes(questionId as any)) {
      continue;
    }

    const aResponse = userA.responses[questionId];
    const bResponse = userB.responses[questionId];

    // Skip if either response is missing
    if (!aResponse || !bResponse) continue;

    // Check if User A has dealbreaker for this question
    if (aResponse.isDealbreaker || aResponse.importance === "dealbreaker") {
      if (!isCompatibleWithPreference(bResponse, aResponse)) {
        failedQuestions.push(questionId);
        continue;
      }
    }

    // Check if User B has dealbreaker for this question
    if (bResponse.isDealbreaker || bResponse.importance === "dealbreaker") {
      if (!isCompatibleWithPreference(aResponse, bResponse)) {
        failedQuestions.push(questionId);
      }
    }
  }

  if (failedQuestions.length > 0) {
    return {
      passed: false,
      userA,
      userB,
      failedQuestions,
    };
  }

  return {
    passed: true,
    userA,
    userB,
    failedQuestions: [],
  };
}

/**
 * Checks if match's answer is compatible with user's preference
 *
 * This is a simplified compatibility check for dealbreakers.
 * For detailed similarity scoring, see similarity.ts
 *
 * @param matchResponse - The match's response to the question
 * @param userResponse - The user's response (with dealbreaker set)
 * @returns True if compatible, false if dealbreaker conflict
 */
function isCompatibleWithPreference(
  matchResponse: any,
  userResponse: any
): boolean {
  const matchAnswer = matchResponse.answer;
  const userPreference = userResponse.preference;
  const userAnswer = userResponse.answer;

  // If user has no preference specified, can't be incompatible
  if (!userPreference || userPreference === "doesntMatter") {
    return true;
  }

  // Handle "Prefer not to answer" - dealbreaker conflicts with uncertainty
  if (
    matchAnswer === "prefer-not-to-answer" ||
    matchAnswer === null ||
    matchAnswer === undefined
  ) {
    return false;
  }

  // Categorical single-select with "same" preference
  if (typeof userPreference === "string" && userPreference === "same") {
    return matchAnswer === userAnswer;
  }

  // Multi-select preference (array of acceptable values)
  if (Array.isArray(userPreference)) {
    // If match's answer is an array (multi-select question)
    if (Array.isArray(matchAnswer)) {
      // Check if there's any overlap
      return matchAnswer.some((ans: any) => userPreference.includes(ans));
    }
    // Single-select answer with multi-select preference
    return userPreference.includes(matchAnswer);
  }

  // Same/similar/different preferences for Likert scales
  if (
    typeof userPreference === "string" &&
    (userPreference === "same" ||
      userPreference === "similar" ||
      userPreference === "different")
  ) {
    if (typeof matchAnswer === "number" && typeof userAnswer === "number") {
      const diff = Math.abs(matchAnswer - userAnswer);

      if (userPreference === "same") {
        return diff === 0;
      } else if (userPreference === "similar") {
        return diff <= 1; // Within 1 point on scale
      } else if (userPreference === "different") {
        return diff >= 2; // At least 2 points apart
      }
    }
  }

  // Directional preferences (more/less/similar/same)
  if (
    typeof userPreference === "string" &&
    (userPreference === "more" ||
      userPreference === "less" ||
      userPreference === "similar" ||
      userPreference === "same")
  ) {
    if (typeof matchAnswer === "number" && typeof userAnswer === "number") {
      const diff = matchAnswer - userAnswer;

      if (userPreference === "more") {
        return diff > 0; // Match must be higher
      } else if (userPreference === "less") {
        return diff < 0; // Match must be lower
      } else if (userPreference === "similar") {
        return Math.abs(diff) <= 1;
      } else if (userPreference === "same") {
        return diff === 0;
      }
    }
  }

  // Age range check (special case)
  if (userPreference.minAge && userPreference.maxAge) {
    const matchAge = matchAnswer?.age || matchAnswer;
    if (typeof matchAge === "number") {
      return (
        matchAge >= userPreference.minAge && matchAge <= userPreference.maxAge
      );
    }
  }

  // Default: if we can't determine compatibility, assume compatible
  // (More lenient approach - false positives better than false negatives for dealbreakers)
  return true;
}
