/**
 * Matching Filters Module
 *
 * Hard filters that determine eligibility for matching.
 * These are pass/fail - users who don't pass are not considered.
 */

import {
  DecryptedResponses,
  GenderFilterResult,
  AgeFilterResult,
} from "./types";

// ===========================================
// GENDER FILTER (Section 0: Q1-Q3)
// ===========================================

/**
 * Q1: What is your gender identity?
 * Values: 'man', 'woman', 'non-binary', 'other'
 */
type GenderIdentity = "man" | "woman" | "non-binary" | "other";

/**
 * Q2: What is your sexual orientation?
 * Values: 'straight', 'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'queer', 'other', 'prefer-not-to-say'
 * Note: Currently not used for filtering, kept for documentation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SexualOrientation =
  | "straight"
  | "gay"
  | "lesbian"
  | "bisexual"
  | "pansexual"
  | "asexual"
  | "queer"
  | "other"
  | "prefer-not-to-say";

/**
 * Q3: Who are you looking to be matched with?
 * Values: 'men', 'women', 'non-binary', 'anyone'
 */
type MatchPreference = "men" | "women" | "non-binary" | "anyone";

/**
 * Maps gender identity to what preference would match them
 */
function genderToPreference(gender: GenderIdentity): MatchPreference {
  switch (gender) {
    case "man":
      return "men";
    case "woman":
      return "women";
    case "non-binary":
      return "non-binary";
    case "other":
      // 'other' is matched by 'anyone' only
      return "anyone";
    default:
      return "anyone";
  }
}

/**
 * Check if user1's preference is satisfied by user2's gender
 *
 * "Anyone" satisfies THEIR side only (one-directional)
 * If User A says "anyone" and User B says "women",
 * User A passes (anyone is satisfied by any gender)
 * User B passes only if User A is a woman
 *
 * @param user1Preference - What user1 is looking for (Q3)
 * @param user2Gender - User2's gender identity (Q1)
 * @returns true if user1's preference is satisfied
 */
export function checkPreferenceSatisfied(
  user1Preference: MatchPreference,
  user2Gender: GenderIdentity
): boolean {
  // "Anyone" is always satisfied
  if (user1Preference === "anyone") {
    return true;
  }

  // Check if user2's gender matches user1's preference
  const user2AsPreference = genderToPreference(user2Gender);

  // Direct match
  if (user1Preference === user2AsPreference) {
    return true;
  }

  // Non-binary can be matched by anyone preference (already handled above)
  // But specific preferences (men, women, non-binary) require exact match
  return false;
}

/**
 * Check gender filter for a pair of users
 *
 * Both users must satisfy each other's preferences for the pair to pass.
 * Uses one-directional "anyone" logic as specified.
 *
 * @param user1Responses - User1's questionnaire responses
 * @param user2Responses - User2's questionnaire responses
 * @param user1Id - User1's ID (for result object)
 * @param user2Id - User2's ID (for result object)
 * @returns GenderFilterResult with pass/fail for each direction
 */
export function checkGenderFilter(
  user1Responses: DecryptedResponses,
  user2Responses: DecryptedResponses,
  user1Id: string,
  user2Id: string
): GenderFilterResult {
  // Get gender identities (Q1)
  const user1Gender = (user1Responses["Q1"] as GenderIdentity) || "other";
  const user2Gender = (user2Responses["Q1"] as GenderIdentity) || "other";

  // Get match preferences (Q3)
  const user1Preference = (user1Responses["Q3"] as MatchPreference) || "anyone";
  const user2Preference = (user2Responses["Q3"] as MatchPreference) || "anyone";

  // Check each direction
  const user1PassesFilter = checkPreferenceSatisfied(
    user1Preference,
    user2Gender
  );
  const user2PassesFilter = checkPreferenceSatisfied(
    user2Preference,
    user1Gender
  );

  return {
    user1Id,
    user2Id,
    user1PassesFilter,
    user2PassesFilter,
    bothPass: user1PassesFilter && user2PassesFilter,
  };
}

// ===========================================
// AGE FILTER (Future Enhancement)
// ===========================================

/**
 * Check age filter for a pair of users
 *
 * Currently returns true for all pairs (age filter not yet implemented).
 * When implemented, will use age preferences from questionnaire.
 *
 * @param user1Age - User1's age
 * @param user2Age - User2's age
 * @param user1Id - User1's ID
 * @param user2Id - User2's ID
 * @returns AgeFilterResult (currently always passes)
 */
export function checkAgeFilter(
  user1Age: number,
  user2Age: number,
  user1Id: string,
  user2Id: string
): AgeFilterResult {
  // TODO: Implement age preference filtering when added to questionnaire
  // For now, all age pairs pass
  return {
    user1Id,
    user2Id,
    user1PassesFilter: true,
    user2PassesFilter: true,
    bothPass: true,
  };
}

// ===========================================
// COMBINED FILTER CHECK
// ===========================================

/**
 * Run all hard filters on a pair of users
 *
 * @param user1Responses - User1's questionnaire responses
 * @param user2Responses - User2's questionnaire responses
 * @param user1Age - User1's age
 * @param user2Age - User2's age
 * @param user1Id - User1's ID
 * @param user2Id - User2's ID
 * @returns true if both users pass all filters in both directions
 */
export function checkAllFilters(
  user1Responses: DecryptedResponses,
  user2Responses: DecryptedResponses,
  user1Age: number,
  user2Age: number,
  user1Id: string,
  user2Id: string
): boolean {
  const genderResult = checkGenderFilter(
    user1Responses,
    user2Responses,
    user1Id,
    user2Id
  );
  const ageResult = checkAgeFilter(user1Age, user2Age, user1Id, user2Id);

  return genderResult.bothPass && ageResult.bothPass;
}
