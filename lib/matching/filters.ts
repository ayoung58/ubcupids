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
 * @param user1Preference - What user1 is looking for (Q3) - can be array or single value
 * @param user2Gender - User2's gender identity (Q1)
 * @returns true if user1's preference is satisfied
 */
export function checkPreferenceSatisfied(
  user1Preference: MatchPreference | MatchPreference[],
  user2Gender: GenderIdentity
): boolean {
  // Handle array of preferences
  const preferences = Array.isArray(user1Preference)
    ? user1Preference
    : [user1Preference];

  // "Anyone" is always satisfied
  if (preferences.includes("anyone")) {
    return true;
  }

  // Check if user2's gender matches any of user1's preferences
  const user2AsPreference = genderToPreference(user2Gender);

  // Check if any preference matches
  return preferences.includes(user2AsPreference);
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
  // Get gender identities (Q1) - handle both uppercase and lowercase keys
  const user1Gender =
    ((user1Responses["Q1"] ?? user1Responses["q1"]) as GenderIdentity) ||
    "other";
  const user2Gender =
    ((user2Responses["Q1"] ?? user2Responses["q1"]) as GenderIdentity) ||
    "other";

  // Get match preferences (Q3) - handle both uppercase and lowercase keys
  // Q3 is a multi-choice array, pass directly to checkPreferenceSatisfied
  const user1Preference = normalizeQ3(
    user1Responses["Q3"] ?? user1Responses["q3"]
  );
  const user2Preference = normalizeQ3(
    user2Responses["Q3"] ?? user2Responses["q3"]
  );

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

/**
 * Helper to normalize Q3 response to array of preferences
 */
function normalizeQ3(q3Response: unknown): MatchPreference[] {
  if (!q3Response) return ["anyone"];

  if (Array.isArray(q3Response)) {
    return q3Response as MatchPreference[];
  }

  return [q3Response as MatchPreference];
}

// ===========================================
// AGE FILTER (Future Enhancement)
// ===========================================

/**
 * Check age filter for a pair of users
 *
 * Uses Q34 (age-range) to determine if each user's age falls within
 * the other's acceptable age range. Both directions must pass.
 *
 * @param user1Responses - User1's questionnaire responses
 * @param user2Responses - User2's questionnaire responses
 * @param user1Age - User1's age
 * @param user2Age - User2's age
 * @param user1Id - User1's ID
 * @param user2Id - User2's ID
 * @returns AgeFilterResult with pass/fail for each direction
 */
export function checkAgeFilter(
  user1Responses: DecryptedResponses,
  user2Responses: DecryptedResponses,
  user1Age: number,
  user2Age: number,
  user1Id: string,
  user2Id: string
): AgeFilterResult {
  // Get age range preferences from Q34 (handle both uppercase and lowercase)
  const user1AgeRangeRaw = (user1Responses["Q34"] ??
    user1Responses["q34"]) as unknown as
    | { min?: number; max?: number; minAge?: number; maxAge?: number }
    | undefined;
  const user2AgeRangeRaw = (user2Responses["Q34"] ??
    user2Responses["q34"]) as unknown as
    | { min?: number; max?: number; minAge?: number; maxAge?: number }
    | undefined;

  // Normalize to min/max format (handle both min/max and minAge/maxAge)
  const normalizeAgeRange = (
    range: typeof user1AgeRangeRaw
  ): { min: number; max: number } => {
    if (!range) return { min: 18, max: 35 };
    return {
      min: range.min ?? range.minAge ?? 18,
      max: range.max ?? range.maxAge ?? 35,
    };
  };

  const user1Range = normalizeAgeRange(user1AgeRangeRaw);
  const user2Range = normalizeAgeRange(user2AgeRangeRaw);

  // Check if user2's age falls within user1's acceptable range
  const user1PassesFilter =
    user2Age >= user1Range.min && user2Age <= user1Range.max;

  // Check if user1's age falls within user2's acceptable range
  const user2PassesFilter =
    user1Age >= user2Range.min && user1Age <= user2Range.max;

  return {
    user1Id,
    user2Id,
    user1PassesFilter,
    user2PassesFilter,
    bothPass: user1PassesFilter && user2PassesFilter,
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
  const ageResult = checkAgeFilter(
    user1Responses,
    user2Responses,
    user1Age,
    user2Age,
    user1Id,
    user2Id
  );

  return genderResult.bothPass && ageResult.bothPass;
}
