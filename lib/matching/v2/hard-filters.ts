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
  userB: MatchingUser,
): HardFilterResult {
  // Phase 1.0: Campus compatibility check
  const campusCompatible = checkCampusCompatibility(userA, userB);
  if (!campusCompatible) {
    return {
      passed: false,
      reason: "Campus incompatibility",
    };
  }

  // Phase 1.1: Age compatibility check
  const ageCompatible = checkAgeCompatibility(userA, userB);
  if (!ageCompatible) {
    return {
      passed: false,
      reason: "Age incompatibility",
      failedQuestions: ["q4"],
    };
  }

  // Phase 1.2: Gender compatibility check
  const genderCompatible = checkGenderCompatibility(userA, userB);
  if (!genderCompatible) {
    return {
      passed: false,
      reason: "Gender incompatibility",
    };
  }

  // Phase 1.3: Check all dealbreaker questions
  const dealbreakerResult = checkAllDealbreakers(userA, userB);
  if (!dealbreakerResult.passed) {
    return dealbreakerResult;
  }

  return {
    passed: true,
  };
}

/**
 * Checks if two users are compatible based on campus preferences
 *
 * For userA to be compatible with userB:
 * - If userA is NOT ok matching different campus, userB must be from the same campus
 * - If userB is NOT ok matching different campus, userA must be from the same campus
 * - If both are ok matching different campus, they can match regardless of campus
 *
 * @param userA - First user
 * @param userB - Second user
 * @returns True if both users are compatible based on campus preferences
 */
export function checkCampusCompatibility(
  userA: MatchingUser,
  userB: MatchingUser,
): boolean {
  // If userA is not ok with different campus, userB must be from same campus
  if (!userA.okMatchingDifferentCampus && userA.campus !== userB.campus) {
    return false;
  }

  // If userB is not ok with different campus, userA must be from same campus
  if (!userB.okMatchingDifferentCampus && userA.campus !== userB.campus) {
    return false;
  }

  // If both are ok with different campus, or they're from same campus, they're compatible
  return true;
}

/**
 * Checks if two users' ages fall within each other's preferred age ranges
 *
 * For userA to be compatible with userB:
 * - userB's age must be within userA's preferred age range (minAge to maxAge)
 * - userA's age must be within userB's preferred age range (minAge to maxAge)
 *
 * Handles multiple data formats:
 * - Format 1: answer: { age: number }, preference: { minAge, maxAge }
 * - Format 2: answer: { userAge: number, minAge, maxAge }
 * - Format 3: answer: number, preference: { min, max }
 *
 * @param userA - First user
 * @param userB - Second user
 * @returns True if both users' ages are within each other's ranges
 */
export function checkAgeCompatibility(
  userA: MatchingUser,
  userB: MatchingUser,
): boolean {
  const aResponse = userA.responses.q4;
  const bResponse = userB.responses.q4;

  // If either user hasn't answered age question, skip check
  if (!aResponse || !bResponse) return true;

  // Extract age values - handle multiple formats
  let aAge: number | undefined;
  let bAge: number | undefined;
  let aMinAge: number | undefined;
  let aMaxAge: number | undefined;
  let bMinAge: number | undefined;
  let bMaxAge: number | undefined;

  // User A formats
  if (typeof aResponse.answer === "number") {
    // Format 3: answer is just the age number
    aAge = aResponse.answer;
    aMinAge = aResponse.preference?.min;
    aMaxAge = aResponse.preference?.max;
  } else if (aResponse.answer?.age !== undefined) {
    // Format 1: answer.age + preference.minAge/maxAge
    aAge = aResponse.answer.age;
    aMinAge = aResponse.preference?.minAge;
    aMaxAge = aResponse.preference?.maxAge;
  } else if (aResponse.answer?.userAge !== undefined) {
    // Format 2: answer.userAge + answer.minAge/maxAge
    aAge = aResponse.answer.userAge;
    aMinAge = aResponse.answer.minAge;
    aMaxAge = aResponse.answer.maxAge;
  }

  // User B formats
  if (typeof bResponse.answer === "number") {
    bAge = bResponse.answer;
    bMinAge = bResponse.preference?.min;
    bMaxAge = bResponse.preference?.max;
  } else if (bResponse.answer?.age !== undefined) {
    bAge = bResponse.answer.age;
    bMinAge = bResponse.preference?.minAge;
    bMaxAge = bResponse.preference?.maxAge;
  } else if (bResponse.answer?.userAge !== undefined) {
    bAge = bResponse.answer.userAge;
    bMinAge = bResponse.answer.minAge;
    bMaxAge = bResponse.answer.maxAge;
  }

  // If we couldn't extract ages, skip check (data format issue)
  if (typeof aAge !== "number" || typeof bAge !== "number") return true;

  // Check if A's age is within B's range (if B has valid preferences)
  // Note: null means "no preference", so we treat null as having no restriction
  if (
    typeof bMinAge === "number" &&
    typeof bMaxAge === "number" &&
    bMinAge !== null &&
    bMaxAge !== null
  ) {
    if (aAge < bMinAge || aAge > bMaxAge) {
      return false; // A's age is outside B's preferred range
    }
  }

  // Check if B's age is within A's range (if A has valid preferences)
  // Note: null means "no preference", so we treat null as having no restriction
  if (
    typeof aMinAge === "number" &&
    typeof aMaxAge === "number" &&
    aMinAge !== null &&
    aMaxAge !== null
  ) {
    if (bAge < aMinAge || bAge > aMaxAge) {
      return false; // B's age is outside A's preferred range
    }
  }

  return true;
}

/**
 * Checks if two users are mutually interested in each other's genders
 *
 * For userA to be compatible with userB:
 * - userB's gender must be in userA's interestedInGenders
 * - userA's gender must be in userB's interestedInGenders
 *
 * Special case: If either user selected "Prefer not to say" for gender identity,
 * they can only match with users who selected "anyone" for gender preference.
 *
 * @param userA - First user
 * @param userB - Second user
 * @returns True if both users are interested in each other's genders
 */
export function checkGenderCompatibility(
  userA: MatchingUser,
  userB: MatchingUser,
): boolean {
  // Handle "Prefer not to say" special case
  const aPreferNotToSay = userA.gender === "prefer_not_to_answer";
  const bPreferNotToSay = userB.gender === "prefer_not_to_answer";

  // If userA chose "Prefer not to say", userB must have "anyone" in their preferences
  if (aPreferNotToSay) {
    const bInterestedInAnyone = userB.interestedInGenders.includes("anyone");
    if (!bInterestedInAnyone) return false;
  }

  // If userB chose "Prefer not to say", userA must have "anyone" in their preferences
  if (bPreferNotToSay) {
    const aInterestedInAnyone = userA.interestedInGenders.includes("anyone");
    if (!aInterestedInAnyone) return false;
  }

  // If both chose "Prefer not to say", both must have "anyone" (already checked above)
  if (aPreferNotToSay && bPreferNotToSay) {
    return true;
  }

  // If only one chose "Prefer not to say", the "anyone" check is sufficient
  if (aPreferNotToSay || bPreferNotToSay) {
    return true;
  }

  // Normal case: both specified their gender
  // If either user selected "anyone", they're compatible with any gender
  const aInterestedInB =
    userA.interestedInGenders.includes("anyone") ||
    userA.interestedInGenders.includes(userB.gender);
  const bInterestedInA =
    userB.interestedInGenders.includes("anyone") ||
    userB.interestedInGenders.includes(userA.gender);

  return aInterestedInB && bInterestedInA;
}

/**
 * Checks all questions marked as dealbreakers by either user
 * Also includes Q3 (sexual activity) as a conditional hard filter when marked as important/very_important
 *
 * Generic dealbreaker logic per V2.2:
 * - If User A marks question as dealbreaker AND User B's answer is incompatible → fail
 * - If User B marks question as dealbreaker AND User A's answer is incompatible → fail
 * - Compatibility is determined by question type and preference specification
 *
 * Q3 Special Case:
 * - If User A marks Q3 as "important" or "very_important", it acts as a hard filter
 * - User B's answer must match User A's preference to pass
 *
 * @param userA - First user
 * @param userB - Second user
 * @returns Filter result indicating if dealbreakers passed
 */
export function checkAllDealbreakers(
  userA: MatchingUser,
  userB: MatchingUser,
): HardFilterResult {
  const failedQuestions: string[] = [];

  // Get all question IDs from both users (excluding hard filters)
  const allQuestionIds = new Set([
    ...Object.keys(userA.responses),
    ...Object.keys(userB.responses),
  ]);

  for (const questionId of allQuestionIds) {
    // Skip hard filter questions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (HARD_FILTER_QUESTIONS.includes(questionId as any)) {
      continue;
    }

    const aResponse = userA.responses[questionId];
    const bResponse = userB.responses[questionId];

    // Skip if either response is missing
    if (!aResponse || !bResponse) continue;

    // Q3 (sexual activity) special case: treat as hard filter if importance is important/very_important OR if isDealbreaker is set
    if (questionId === "q3") {
      // Check if User A marked Q3 as important/very_important or as a dealbreaker
      // Note: Check both isDealbreaker (correct) and isDealer (typo from UI) for backward compatibility
      const aIsHardFilter =
        aResponse.isDealbreaker ||
        aResponse.isDealer ||
        aResponse.dealbreaker ||
        aResponse.importance === "important" ||
        aResponse.importance === "very_important";

      if (aIsHardFilter) {
        if (!isCompatibleWithPreference(bResponse, aResponse)) {
          failedQuestions.push(questionId);
          continue;
        }
      }

      // Check if User B marked Q3 as important/very_important or as a dealbreaker
      // Note: Check both isDealbreaker (correct) and isDealer (typo from UI) for backward compatibility
      const bIsHardFilter =
        bResponse.isDealbreaker ||
        bResponse.isDealer ||
        bResponse.dealbreaker ||
        bResponse.importance === "important" ||
        bResponse.importance === "very_important";

      if (bIsHardFilter) {
        if (!isCompatibleWithPreference(aResponse, bResponse)) {
          failedQuestions.push(questionId);
          continue;
        }
      }

      // If neither marked it as important/very_important or dealbreaker, skip the hard filter check
      // and let it be handled by regular scoring
      continue;
    }

    // Q5 (ethnicity) special case: treat as hard filter if importance is very_important
    if (questionId === "q5") {
      // Check if User A marked Q5 as very_important
      const aIsHardFilter = aResponse.importance === "very_important";

      if (aIsHardFilter) {
        if (!isCompatibleWithPreference(bResponse, aResponse)) {
          failedQuestions.push(questionId);
          continue;
        }
      }

      // Check if User B marked Q5 as very_important
      const bIsHardFilter = bResponse.importance === "very_important";

      if (bIsHardFilter) {
        if (!isCompatibleWithPreference(aResponse, bResponse)) {
          failedQuestions.push(questionId);
          continue;
        }
      }

      // If neither marked it as very_important, skip the hard filter check
      // and let it be handled by regular scoring
      continue;
    }

    // Check if User A has dealbreaker for this question
    // Note: Check both isDealbreaker (correct) and isDealer (typo from UI) for backward compatibility
    if (
      aResponse.isDealbreaker ||
      aResponse.isDealer ||
      aResponse.dealbreaker
    ) {
      if (!isCompatibleWithPreference(bResponse, aResponse)) {
        failedQuestions.push(questionId);
        continue;
      }
    }

    // Check if User B has dealbreaker for this question
    // Note: Check both isDealbreaker (correct) and isDealer (typo from UI) for backward compatibility
    if (
      bResponse.isDealbreaker ||
      bResponse.isDealer ||
      bResponse.dealbreaker
    ) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matchResponse: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userResponse: any,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
