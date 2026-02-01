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

import { MatchingUser, ResponseValue } from "./types";
import { MATCHING_CONFIG } from "./config";
import { calculateLoveLanguageCompatibility } from "./special-cases/love-languages";
import { calculateConflictResolutionCompatibility } from "./special-cases/conflict-resolution";
import { calculateSleepScheduleCompatibility } from "./special-cases/sleep-schedule";

/**
 * Normalizes gender values in responses to handle inconsistencies between Q1 and Q2
 * Q1 (Gender Identity) uses: "man", "woman", "non-binary", "genderqueer"
 * Q2 (Gender Preference) uses: "men", "women", "non_binary", "genderqueer"
 *
 * We normalize to Q2's format (plural/underscore) for consistency
 */
function normalizeGenderResponse(response: ResponseValue): ResponseValue {
  if (!response) return response;

  const normalized = { ...response };

  // Normalize answer (for q1 single values)
  if (typeof normalized.answer === "string") {
    normalized.answer = normalizeGenderValue(normalized.answer);
  }

  // Normalize preference (for q2 arrays)
  if (Array.isArray(normalized.preference)) {
    normalized.preference = normalized.preference.map(normalizeGenderValue);
  }

  return normalized;
}

/**
 * Normalizes a single gender value to Q2 format
 */
function normalizeGenderValue(gender: string): string {
  // Normalize singular to plural
  if (gender === "man") return "men";
  if (gender === "woman") return "women";

  // Normalize hyphen to underscore
  if (gender === "non-binary") return "non_binary";

  return gender;
}

/**
 * Calculates similarity scores for all questions between two users
 * Returns object with similarity scores by question
 */
export function calculateSimilarity(
  userA: MatchingUser,
  userB: MatchingUser,
  config: typeof MATCHING_CONFIG = MATCHING_CONFIG,
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
      questionType,
      config,
    );
  });

  return similarities;
}

/**
 * Determines the similarity calculation type for a question
 */
function determineQuestionType(
  questionId: string,
):
  | "numeric"
  | "ordinal"
  | "categorical-same"
  | "categorical-multi"
  | "multi-select"
  | "age"
  | "same-similar-different"
  | "directional"
  | "binary" {
  // Map question IDs to their types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeMap: Record<string, any> = {
    // Hard filters (rarely scored)
    q1: "categorical-same",
    q2: "multi-select",

    // Section 1: Lifestyle
    q3: "categorical-multi", // Sexual orientation - single with multi-pref
    q4: "age",
    q5: "multi-select", // Cultural background - multi with multi-pref
    q6: "multi-select", // Religion - multi with same/similar pref
    q7: "same-similar-different", // Political leaning - Likert same/similar
    q8: "categorical-multi", // Alcohol - single with multi-pref
    q9a: "multi-select", // Drug substances - multi with multi-pref
    q9b: "ordinal", // Drug frequency - ordinal (never < occasionally < regularly)
    q10: "directional", // Exercise - directional preference
    q11: "categorical-multi", // Relationship style - same/similar with flexible "exploring_unsure"
    q12: "ordinal", // Sexual activity - ordinal same/similar
    q13: "multi-select", // Relationship intent - multi with multi-pref
    q14: "multi-select", // Field of study - multi with multi-pref
    q15: "categorical-multi", // Living situation - single with multi-pref
    q16: "same-similar-different", // Ambition - can be different
    q17: "same-similar-different", // Financial - can be different
    q18: "same-similar-different", // Time availability - Likert same/similar
    q19: "categorical-multi", // Pet attitude - single with multi-pref
    q20: "categorical-multi", // Relationship experience - single with multi-pref

    // Section 2: Personality
    q21: "love-languages", // SPECIAL CASE
    q22: "same-similar-different", // Social energy - can be different
    q23: "ordinal", // Battery recharge - ordinal with "same" preference (not "different")
    q24: "same-similar-different", // Party interest - Likert same/similar
    q25: "conflict-resolution", // SPECIAL CASE
    q26: "categorical-multi", // Texting frequency - special flexible handling
    q27: "same-similar-different", // Physical affection - Likert same/similar
    q28: "same-similar-different", // Planning - can be different
    q29: "sleep-schedule", // SPECIAL CASE
    q30: "same-similar-different", // Cleanliness - Likert same/similar
    q31: "same-similar-different", // Openness - Likert same/similar
    q32: "multi-select", // What counts as cheating - multi-select same/similar
    q33: "same-similar-different", // Group socializing - can be different
    q34: "same-similar-different", // Outdoor vs indoor - can be different
    q35: "same-similar-different", // Communication - can be different
    q36: "same-similar-different", // Emotional processing - Likert same/similar
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
    | "ordinal"
    | "categorical-same"
    | "categorical-multi"
    | "multi-select"
    | "age"
    | "same-similar-different"
    | "directional"
    | "binary"
    | "love-languages"
    | "conflict-resolution"
    | "sleep-schedule",
  config: typeof MATCHING_CONFIG = MATCHING_CONFIG,
): number {
  // Q1 and Q2 are HARD FILTERS - they should NOT be scored in Phase 2
  // They are validated in Phase 1 (hard filtering). If a pair passed Phase 1,
  // these questions should not appear in similarity scoring
  if (questionId === "q1" || questionId === "q2") {
    return 0.0;
  }

  let aResponse = userA.responses[questionId];
  let bResponse = userB.responses[questionId];

  // If either response is missing, return 0.5 (neutral)
  if (!aResponse || !bResponse) return 0.5;

  // Special handling for gender questions (q1, q2) - normalize values
  if (questionId === "q1" || questionId === "q2") {
    aResponse = normalizeGenderResponse(aResponse);
    bResponse = normalizeGenderResponse(bResponse);
  }

  switch (questionType) {
    case "numeric":
      return calculateTypeA_Numeric(aResponse, bResponse);
    case "ordinal":
      return calculateTypeF_Ordinal(questionId, aResponse, bResponse, config);
    case "categorical-same":
      return calculateTypeB_CategoricalSame(aResponse, bResponse);
    case "categorical-multi":
      return calculateTypeC_CategoricalMulti(aResponse, bResponse, questionId);
    case "multi-select":
      // Q6 special case: Religion with semantic similarity
      if (questionId === "q6") {
        return calculateQ6_ReligionWithSemantics(aResponse, bResponse);
      }
      return calculateTypeD_MultiSelect(aResponse, bResponse);
    case "age":
      return calculateTypeE_Age(aResponse, bResponse);
    case "same-similar-different":
      return calculateTypeF_SameSimilarDifferent(aResponse, bResponse);
    case "directional":
      return calculateTypeG_Directional(aResponse, bResponse);
    case "binary":
      return calculateTypeH_Binary(aResponse, bResponse);
    case "love-languages":
      return calculateLoveLanguages(aResponse, bResponse, config);
    case "conflict-resolution":
      return calculateConflictResolution(aResponse, bResponse, config);
    case "sleep-schedule":
      return calculateSleepSchedule(aResponse, bResponse, config);
    default:
      console.warn(`Unknown question type: ${questionType} for ${questionId}`);
      return 0.5;
  }
}

/**
 * Helper: Map ordinal string values to numeric for ordinal questions
 * Supports Q9b (drug frequency), Q12 (sexual activity expectations), and Q23 (battery recharge)
 */
function mapOrdinalToNumeric(questionId: string, value: string): number | null {
  if (questionId === "q9b") {
    // DRUG_FREQUENCY_OPTIONS in order: never < occasionally < regularly
    const ordinalMap: Record<string, number> = {
      never: 1,
      occasionally: 2,
      regularly: 3,
      prefer_not_to_answer: -1, // Handle separately
    };
    return ordinalMap[value] ?? null;
  }

  if (questionId === "q12") {
    // SEXUAL_ACTIVITY_EXPECTATIONS_OPTIONS in order
    const ordinalMap: Record<string, number> = {
      marriage: 1,
      serious_commitment: 2,
      connection: 3,
      early_on: 4,
      prefer_not_to_answer: -1, // Handle separately
    };
    return ordinalMap[value] ?? null;
  }

  if (questionId === "q23") {
    // RECHARGE_STYLE_OPTIONS in order: alone → balanced → people
    const ordinalMap: Record<string, number> = {
      lots_of_alone_time: 1,
      some_alone_time: 2,
      balanced: 3,
      energized_by_people: 4,
      always_want_company: 5,
    };
    return ordinalMap[value] ?? null;
  }

  return null;
}

/**
 * Type A: Numeric (Likert scale)
 * Similarity = 1 - (|A - B| / max_range)
 *
 * Example: 5-point scale (1-5), A=2, B=4
 * Similarity = 1 - (|2-4| / 4) = 1 - 0.5 = 0.5
 */
function calculateTypeA_Numeric(
  aResponse: ResponseValue,
  bResponse: ResponseValue,
): number {
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
  aResponse: ResponseValue,
  bResponse: ResponseValue,
): number {
  const aAnswer = aResponse.answer;
  const bAnswer = bResponse.answer;

  return aAnswer === bAnswer ? 1.0 : 0.0;
}

/**
 * Type C: Categorical (Single-select, multi preference)
 * User specifies list of acceptable answers OR preference string (same/similar)
 *
 * For array preferences:
 * - 1.0 if partner's answer is in user's preference list
 * - 0.0 otherwise
 *
 * For string preferences (like "similar"):
 * - Treated as ordinal comparison (answers with natural order)
 * - "similar": answers are same or adjacent → high score
 * - "same": answers must be identical → 1.0 or 0.0
 *
 * Returns average of (A satisfied by B, B satisfied by A)
 *
 * Special handling:
 * - Q26: "whatever_feels_natural" is compatible with all options
 * - Q26: Preference "similar" uses ordinal-like comparison (minimal < moderate < frequent < constant)
 */
function calculateTypeC_CategoricalMulti(
  aResponse: ResponseValue,
  bResponse: ResponseValue,
  questionId?: string,
): number {
  const aAnswer = aResponse.answer;
  const bAnswer = bResponse.answer;
  const aPreference = aResponse.preference;
  const bPreference = bResponse.preference;

  // Q26 special case: "whatever_feels_natural" is flexible but not perfect
  if (questionId === "q26") {
    if (
      aAnswer === "whatever_feels_natural" ||
      bAnswer === "whatever_feels_natural"
    ) {
      // Return 0.5: flexible but not a guaranteed match (random shot)
      return 0.5;
    }

    // Q26 has string preferences ("similar" or "same"), not array preferences
    // Define ordinal ordering for Q26 options
    const q26Order: Record<string, number> = {
      minimal: 1,
      moderate: 2,
      frequent: 3,
      constant: 4,
      whatever_feels_natural: 5, // Already handled above
    };

    const aNum = q26Order[aAnswer as string] ?? -1;
    const bNum = q26Order[bAnswer as string] ?? -1;

    // Check A's preference
    let aSatisfied = 1.0;
    if (aPreference === "same") {
      aSatisfied = aAnswer === bAnswer ? 1.0 : 0.0;
    } else if (aPreference === "similar") {
      // Similar: score decreases with distance
      if (aNum === -1 || bNum === -1) {
        aSatisfied = 0.5; // Invalid option
      } else {
        const distance = Math.abs(aNum - bNum);
        aSatisfied = Math.max(0, 1 - distance / 3); // Max distance is 3 (1 to 4)
      }
    } else if (aPreference === null || aPreference === undefined) {
      aSatisfied = 1.0; // No preference
    }

    // Check B's preference
    let bSatisfied = 1.0;
    if (bPreference === "same") {
      bSatisfied = aAnswer === bAnswer ? 1.0 : 0.0;
    } else if (bPreference === "similar") {
      // Similar: score decreases with distance
      if (aNum === -1 || bNum === -1) {
        bSatisfied = 0.5; // Invalid option
      } else {
        const distance = Math.abs(aNum - bNum);
        bSatisfied = Math.max(0, 1 - distance / 3);
      }
    } else if (bPreference === null || bPreference === undefined) {
      bSatisfied = 1.0; // No preference
    }

    return (aSatisfied + bSatisfied) / 2;
  }

  // Q11 special case: "exploring_unsure" is flexible (matches partially with everything)
  if (questionId === "q11") {
    // If either user selected "exploring_unsure", they're flexible
    if (aAnswer === "exploring_unsure" || bAnswer === "exploring_unsure") {
      return 0.5; // Flexible but not perfect match
    }

    // Both have specific relationship styles, check preferences
    // Q11 has string preferences ("same" or "similar"), not array preferences
    let aSatisfied = 1.0;
    if (aPreference === "same") {
      aSatisfied = aAnswer === bAnswer ? 1.0 : 0.0;
    } else if (aPreference === "similar") {
      // For "similar", exact match is 1.0, different is 0.0
      // (no ordinal relationship between relationship styles)
      aSatisfied = aAnswer === bAnswer ? 1.0 : 0.0;
    } else if (aPreference === null || aPreference === undefined) {
      aSatisfied = 1.0; // No preference
    }

    let bSatisfied = 1.0;
    if (bPreference === "same") {
      bSatisfied = aAnswer === bAnswer ? 1.0 : 0.0;
    } else if (bPreference === "similar") {
      bSatisfied = aAnswer === bAnswer ? 1.0 : 0.0;
    } else if (bPreference === null || bPreference === undefined) {
      bSatisfied = 1.0; // No preference
    }

    return (aSatisfied + bSatisfied) / 2;
  }

  // For non-Q26/Q11 questions: expect array preferences
  const aPreferenceArray = Array.isArray(aPreference) ? aPreference : [];
  const bPreferenceArray = Array.isArray(bPreference) ? bPreference : [];

  // If no preferences specified, assume flexible (1.0)
  const aSatisfied =
    aPreferenceArray.length === 0
      ? 1.0
      : aPreferenceArray.includes(bAnswer)
        ? 1.0
        : 0.0;
  const bSatisfied =
    bPreferenceArray.length === 0
      ? 1.0
      : bPreferenceArray.includes(aAnswer)
        ? 1.0
        : 0.0;

  // Average of mutual satisfaction
  return (aSatisfied + bSatisfied) / 2;
}

/**
 * Q6 Special Case: Religion with Semantic Similarity
 *
 * Beyond pure Jaccard similarity, considers semantic relationships:
 * - Secular Group: "atheist", "agnostic" (semantically similar)
 * - Flexible: "spiritual_not_religious" (compatible with anything)
 * - Specific Religions: all other religions
 *
 * Scoring rules:
 * For "same" preference:
 *   - Exact match → 1.0
 *   - Subset + both from Secular group → 0.9
 *   - Subset + different groups + overlap → 0.7
 *   - No overlap + both from Secular group → 0.3
 *   - "spiritual_not_religious" involved → 0.5
 *   - No overlap + different groups → 0.0
 *
 * For "similar" preference:
 *   - Subset + both from Secular group → 1.0
 *   - Subset + different groups + overlap → 0.8
 *   - No overlap + both from Secular group → 0.7
 *   - "spiritual_not_religious" involved → 0.8
 *   - No overlap + different groups → 0.0
 */
function calculateQ6_ReligionWithSemantics(
  aResponse: ResponseValue,
  bResponse: ResponseValue,
): number {
  const aAnswer = aResponse.answer || [];
  const bAnswer = bResponse.answer || [];
  const aPreference = aResponse.preference;
  const bPreference = bResponse.preference;

  if (!Array.isArray(aAnswer) || !Array.isArray(bAnswer)) return 0.5;
  if (aAnswer.length === 0 && bAnswer.length === 0) return 1.0;

  // Handle prefer_not_to_answer as missing data - use penalty similarity
  // If either user chose "prefer_not_to_answer", they're uncertain, so compatibility is reduced
  const aHasPrefersNotToAnswer = aAnswer.includes("prefer_not_to_answer");
  const bHasPrefersNotToAnswer = bAnswer.includes("prefer_not_to_answer");

  if (aHasPrefersNotToAnswer || bHasPrefersNotToAnswer) {
    // At least one user is uncertain about their religion preference
    // Return penalty value instead of optimistic semantic matching
    // This should be handled like missing preference (0.5) not a preference match
    return 0.5;
  }

  // Semantic groups for religion
  const secularGroup = new Set(["atheist", "agnostic"]);
  const flexibleAnswer = "spiritual_not_religious"; // Note: underscore, not "but_not"

  const aSet = new Set(aAnswer);
  const bSet = new Set(bAnswer);
  const intersection = new Set([...aSet].filter((x) => bSet.has(x)));

  // Check if answers involve "spiritual_not_religious"
  const aHasFlexible = aSet.has(flexibleAnswer);
  const bHasFlexible = bSet.has(flexibleAnswer);

  // Check if answers are from secular group
  const aIsSecular = [...aSet].every((x) => secularGroup.has(x));
  const bIsSecular = [...bSet].every((x) => secularGroup.has(x));

  // Check for subset relationship
  const aIsSubsetOfB = [...aSet].every((x) => bSet.has(x));
  const bIsSubsetOfA = [...bSet].every((x) => aSet.has(x));
  const isSubset = aIsSubsetOfB || bIsSubsetOfA;

  // Handle preference-based matching
  // Note: We need to check preferences even if one is null, to get asymmetric scoring
  let aSatisfied = 1.0; // Default: no preference = satisfied with anything
  let bSatisfied = 1.0; // Default: no preference = satisfied with anything

  // Check A's preference satisfaction
  if (aPreference === "same") {
    // Exact match check
    if (aSet.size === bSet.size && [...aSet].every((item) => bSet.has(item))) {
      aSatisfied = 1.0;
    } else if (isSubset) {
      // Subset scenario
      if (aHasFlexible || bHasFlexible) {
        aSatisfied = 0.5; // Flexible involved
      } else if (aIsSecular && bIsSecular) {
        aSatisfied = 0.9; // Both secular, subset match
      } else if (intersection.size > 0) {
        aSatisfied = 0.7; // Different groups but has overlap
      } else {
        aSatisfied = 0.0; // No overlap
      }
    } else if (intersection.size > 0) {
      // Has overlap but neither is subset
      if (aIsSecular && bIsSecular) {
        aSatisfied = 0.9;
      } else if (aHasFlexible || bHasFlexible) {
        aSatisfied = 0.5;
      } else {
        aSatisfied = 0.7;
      }
    } else {
      // No overlap at all
      if ((aIsSecular && bIsSecular) || aHasFlexible || bHasFlexible) {
        aSatisfied = aHasFlexible || bHasFlexible ? 0.5 : 0.3;
      } else {
        aSatisfied = 0.0;
      }
    }
  } else if (aPreference === "similar") {
    // Similar means: is there meaningful overlap or semantic similarity?
    // Check exact match first
    if (aSet.size === bSet.size && [...aSet].every((item) => bSet.has(item))) {
      aSatisfied = 1.0; // Exact match
    } else if (intersection.size > 0) {
      if (aIsSecular && bIsSecular) {
        aSatisfied = 1.0; // Both secular, has overlap
      } else if (isSubset) {
        aSatisfied = 0.8; // Subset with different groups
      } else {
        aSatisfied = 0.8; // Has overlap, different groups
      }
    } else {
      // No overlap
      if (aIsSecular && bIsSecular) {
        aSatisfied = 0.7; // Semantic similarity within secular
      } else if (aHasFlexible || bHasFlexible) {
        aSatisfied = 0.8; // Flexible is forgiving
      } else {
        aSatisfied = 0.0;
      }
    }
  }

  if (bPreference === "same") {
    // Exact match check
    if (aSet.size === bSet.size && [...aSet].every((item) => bSet.has(item))) {
      bSatisfied = 1.0;
    } else if (isSubset) {
      // Subset scenario
      if (aHasFlexible || bHasFlexible) {
        bSatisfied = 0.5; // Flexible involved
      } else if (aIsSecular && bIsSecular) {
        bSatisfied = 0.9; // Both secular, subset match
      } else if (intersection.size > 0) {
        bSatisfied = 0.7; // Different groups but has overlap
      } else {
        bSatisfied = 0.0; // No overlap
      }
    } else if (intersection.size > 0) {
      // Has overlap but neither is subset
      if (aIsSecular && bIsSecular) {
        bSatisfied = 0.9;
      } else if (aHasFlexible || bHasFlexible) {
        bSatisfied = 0.5;
      } else {
        bSatisfied = 0.7;
      }
    } else {
      // No overlap at all
      if ((aIsSecular && bIsSecular) || aHasFlexible || bHasFlexible) {
        bSatisfied = aHasFlexible || bHasFlexible ? 0.5 : 0.3;
      } else {
        bSatisfied = 0.0;
      }
    }
  } else if (bPreference === "similar") {
    // Similar means: is there meaningful overlap or semantic similarity?
    // Check exact match first
    if (aSet.size === bSet.size && [...aSet].every((item) => bSet.has(item))) {
      bSatisfied = 1.0; // Exact match
    } else if (intersection.size > 0) {
      if (aIsSecular && bIsSecular) {
        bSatisfied = 1.0; // Both secular, has overlap
      } else if (isSubset) {
        bSatisfied = 0.8; // Subset with different groups
      } else {
        bSatisfied = 0.8; // Has overlap, different groups
      }
    } else {
      // No overlap
      if (aIsSecular && bIsSecular) {
        bSatisfied = 0.7; // Semantic similarity within secular
      } else if (aHasFlexible || bHasFlexible) {
        bSatisfied = 0.8; // Flexible is forgiving
      } else {
        bSatisfied = 0.0;
      }
    }
  }

  return (aSatisfied + bSatisfied) / 2;
}

/**
 * Type D: Multi-select (Multiple options)
 * For questions with both answer AND preference arrays:
 * - Check if B's answer appears in A's preference list (and vice versa)
 * - Return average of mutual satisfaction
 *
 * For questions with only answer arrays (no preferences):
 * - Uses Jaccard similarity: |A ∩ B| / |A ∪ B|
 *
 * Example: A=[1,2,3], B=[2,3,4]
 * Intersection = [2,3] (size 2)
 * Union = [1,2,3,4] (size 4)
 * Similarity = 2/4 = 0.5
 */
function calculateTypeD_MultiSelect(
  aResponse: ResponseValue,
  bResponse: ResponseValue,
): number {
  const aAnswer = aResponse.answer || [];
  const bAnswer = bResponse.answer || [];
  const aPreference = aResponse.preference || [];
  const bPreference = bResponse.preference || [];

  if (!Array.isArray(aAnswer) || !Array.isArray(bAnswer)) return 0.5;
  if (aAnswer.length === 0 && bAnswer.length === 0) return 1.0;

  // Check if preferences exist in the response object (even if null)
  // If preference field exists but is null/empty, treat as "flexible" (neutral 0.5)
  const hasPreferenceField =
    aResponse.hasOwnProperty("preference") ||
    bResponse.hasOwnProperty("preference");

  // Check if BOTH preferences are null/empty AND the question type expects preferences
  // NULL preference means "no preference" = "happy with anything" = 1.0 satisfaction
  // [FIXED v2.3]: Changed from 0.5 to 1.0 to match null preference philosophy
  if (
    hasPreferenceField &&
    aPreference.length === 0 &&
    bPreference.length === 0
  ) {
    return 1.0;
  }

  // Check if this is a preference-based multi-select
  // Preferences can be: array of acceptable values, "same", or "similar"
  if (
    aPreference.length > 0 ||
    bPreference.length > 0 ||
    aResponse.preference === "same" ||
    aResponse.preference === "similar" ||
    bResponse.preference === "same" ||
    bResponse.preference === "similar"
  ) {
    const aSet = new Set(aAnswer);
    const bSet = new Set(bAnswer);
    const intersection = new Set([...aSet].filter((x) => bSet.has(x)));

    // Check if A's preference is satisfied
    let aSatisfied = 1.0; // Default for null/no preference
    if (aResponse.preference === "same") {
      // Exact match required
      aSatisfied =
        aSet.size === bSet.size && [...aSet].every((item) => bSet.has(item))
          ? 1.0
          : 0.0;
    } else if (aResponse.preference === "similar") {
      // "Similar" means: "Does their answer have ANY overlap with mine?"
      // Use intersection / smaller_set to be more generous
      // If B selected 2 items and both are in A's 5 items, A should be satisfied
      if (intersection.size === 0) {
        aSatisfied = 0.0; // No overlap at all
      } else {
        // Calculate proportional overlap: what % of B's answers overlap with A's?
        const overlapRatio = bSet.size > 0 ? intersection.size / bSet.size : 0;
        aSatisfied = overlapRatio;
      }
    } else if (aPreference.length > 0) {
      // Array of acceptable values - check if ANY of B's answers are in A's preference
      // For ethnicity/multi-select: if B selected 'east_asian' and A's preference includes 'east_asian', A is satisfied
      const aPrefSet = new Set(aPreference);
      const anyInPreference = bAnswer.some((item) => aPrefSet.has(item));
      aSatisfied = anyInPreference ? 1.0 : 0.0;
    }

    // Check if B's preference is satisfied
    let bSatisfied = 1.0; // Default for null/no preference
    if (bResponse.preference === "same") {
      // Exact match required
      bSatisfied =
        aSet.size === bSet.size && [...aSet].every((item) => bSet.has(item))
          ? 1.0
          : 0.0;
    } else if (bResponse.preference === "similar") {
      // "Similar" means: "Does their answer have ANY overlap with mine?"
      // Use intersection / smaller_set to be more generous
      if (intersection.size === 0) {
        bSatisfied = 0.0; // No overlap at all
      } else {
        // Calculate proportional overlap: what % of A's answers overlap with B's?
        const overlapRatio = aSet.size > 0 ? intersection.size / aSet.size : 0;
        bSatisfied = overlapRatio;
      }
    } else if (bPreference.length > 0) {
      // Array of acceptable values - check if ANY of A's answers are in B's preference
      // For ethnicity/multi-select: if A selected 'latin_american' and B's preference includes 'latin_american', B is satisfied
      const bPrefSet = new Set(bPreference);
      const anyInPreference = aAnswer.some((item) => bPrefSet.has(item));
      bSatisfied = anyInPreference ? 1.0 : 0.0;
    }

    return (aSatisfied + bSatisfied) / 2;
  }

  // Otherwise, use Jaccard similarity for answer similarity
  // (for questions that truly don't have preferences, like q32 cheating boundaries)
  const aSet = new Set(aAnswer);
  const bSet = new Set(bAnswer);
  const intersection = new Set([...aSet].filter((x) => bSet.has(x)));
  const union = new Set([...aSet, ...bSet]);

  if (union.size === 0) return 1.0;

  return intersection.size / union.size;
}

/**
 * Type E: Age (Special case)
 *
 * NOTE: Age is a HARD FILTER - incompatible pairs are filtered out in Phase 1.
 * This similarity function is only called for diagnostic purposes on pairs that already passed the filter.
 *
 * Structure can be in three formats:
 * 1. Separate object: answer: { age: number }, preference: { minAge: number, maxAge: number }
 * 2. Combined format: answer: { userAge: number, minAge: number, maxAge: number }
 * 3. Test format: answer: number, preference: { min: number, max: number }
 *
 * Since age is a hard filter, this always returns 0.0 for scoring purposes.
 */
/**
 * Type E: Age range comparison
 *
 * Multiple possible formats:
 * 1. Simple format: answer: number, preference: { min: number, max: number }
 * 2. Combined format: answer: { userAge: number, minAge: number, maxAge: number }
 * 3. Test format: answer: number, preference: { min: number, max: number }
 *
 * Since age is a hard filter, this always returns 0.0 for scoring purposes.
 */
function calculateTypeE_Age(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  aResponse: ResponseValue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bResponse: ResponseValue,
): number {
  // Age is a hard filter - pairs that don't satisfy age requirements are filtered out
  // This function is only for diagnostics, so we return 0.0 to indicate it's not scored
  return 0.0;
}

/**
 * Type F1: Ordinal with "Same/Similar" preference
 * For questions like Q12 (sexual activity expectations) with ordered categorical values
 *
 * Structure:
 * - answer: string (ordinal value)
 * - preference: "same" | "similar"
 *
 * Similarity calculation:
 * - Convert ordinal strings to numeric values
 * - "same": 1.0 if exact match, 0.0 otherwise
 * - "similar": Linear distance-based (like Type A numeric)
 */
function calculateTypeF_Ordinal(
  questionId: string,
  aResponse: ResponseValue,
  bResponse: ResponseValue,
  config: typeof MATCHING_CONFIG,
): number {
  const aAnswer = aResponse.answer;
  const bAnswer = bResponse.answer;
  const aPreference = aResponse.preference;
  const bPreference = bResponse.preference;

  // Map ordinal values to numeric
  const aNumeric =
    typeof aAnswer === "string"
      ? mapOrdinalToNumeric(questionId, aAnswer)
      : null;
  const bNumeric =
    typeof bAnswer === "string"
      ? mapOrdinalToNumeric(questionId, bAnswer)
      : null;

  // Handle prefer_not_to_answer or invalid values
  // Per V2.2 spec: Use configured similarity penalty for uncertainty
  if (
    aNumeric === null ||
    bNumeric === null ||
    aNumeric === -1 ||
    bNumeric === -1
  ) {
    return config.PREFER_NOT_ANSWER_SIMILARITY;
  }

  // Calculate raw numeric similarity with dynamic max range
  // Q9b: 1-3 (never, occasionally, regularly) → maxRange = 2
  // Q12: 1-4 (marriage, serious_commitment, connection, early_on) → maxRange = 3
  // Q23: 1-5 (lots_alone → balanced → always_company) → maxRange = 4

  // For ordinal scales, max range is (max_possible - min_possible)
  const maxRangeMap: Record<string, number> = {
    q9b: 2, // 3-1=2
    q12: 3, // 4-1=3
    q23: 4, // 5-1=4
  };
  const maxRange = maxRangeMap[questionId] ?? 3;
  const distance = Math.abs(aNumeric - bNumeric);
  const rawSimilarity = 1 - distance / maxRange;

  // Check preferences
  // If preference is null/undefined, user has "no preference" = happy with anything (1.0)
  let aSatisfied = 1.0; // Default to 1.0 for null preference
  if (aPreference === "same") {
    aSatisfied = aAnswer === bAnswer ? 1.0 : 0.0;
  } else if (aPreference === "similar") {
    aSatisfied = Math.max(0, rawSimilarity);
  }

  let bSatisfied = 1.0; // Default to 1.0 for null preference
  if (bPreference === "same") {
    bSatisfied = aAnswer === bAnswer ? 1.0 : 0.0;
  } else if (bPreference === "similar") {
    bSatisfied = Math.max(0, rawSimilarity);
  }

  return (aSatisfied + bSatisfied) / 2;
}

/**
 * Type F2: Same/Similar/Different preference
 * 3-tier preference system
 *
 * Structure:
 * - preference: "same" | "similar" | "different" | null
 *
 * Similarity calculation:
 * 1. Calculate raw answer similarity using Type A (numeric distance)
 * 2. Map to preference:
 *    - "same": High similarity (0.8-1.0) = satisfied
 *    - "similar": Medium similarity (0.4-0.8) = satisfied
 *    - "different": Low similarity (0.0-0.4) = satisfied
 *    - null/undefined: Return neutral 0.5 (missing preference data)
 * 3. Return average of (A satisfied, B satisfied)
 */
function calculateTypeF_SameSimilarDifferent(
  aResponse: ResponseValue,
  bResponse: ResponseValue,
): number {
  // First, calculate raw numeric similarity
  const rawSimilarity = calculateTypeA_Numeric(aResponse, bResponse);

  const aPreference = aResponse.preference;
  const bPreference = bResponse.preference;

  // Check if A's preference is satisfied
  // If preference is null/undefined, user has "no preference" = happy with anything (1.0)
  let aSatisfied = 1.0; // Default to 1.0 for null preference
  if (aPreference === "same") {
    // "same": User wants exact match (high similarity needed)
    // Only fully satisfied if very similar (0.8+), otherwise scales linearly
    aSatisfied = rawSimilarity >= 0.8 ? 1.0 : rawSimilarity / 0.8;
  } else if (aPreference === "similar") {
    // "similar": User wants similarity to decrease gradually with distance
    // Use raw similarity directly - no thresholding
    aSatisfied = Math.max(0, rawSimilarity);
  } else if (aPreference === "different") {
    // "different": User wants dissimilarity (low similarity is good)
    aSatisfied = rawSimilarity <= 0.4 ? 1.0 : (1 - rawSimilarity) / 0.6;
  }

  // Check if B's preference is satisfied
  // If preference is null/undefined, user has "no preference" = happy with anything (1.0)
  let bSatisfied = 1.0; // Default to 1.0 for null preference
  if (bPreference === "same") {
    // "same": User wants exact match (high similarity needed)
    bSatisfied = rawSimilarity >= 0.8 ? 1.0 : rawSimilarity / 0.8;
  } else if (bPreference === "similar") {
    // "similar": User wants similarity to decrease gradually with distance
    // Use raw similarity directly - no thresholding
    bSatisfied = Math.max(0, rawSimilarity);
  } else if (bPreference === "different") {
    // "different": User wants dissimilarity
    bSatisfied = rawSimilarity <= 0.4 ? 1.0 : (1 - rawSimilarity) / 0.6;
  }

  return (aSatisfied + bSatisfied) / 2;
}

/**
 * Type G: Directional preference (more/less/similar/same)
 * Handles directional preferences with null preference support
 *
 * Structure:
 * - answer: number (Likert scale)
 * - preference: "more" | "less" | "similar" | "same" | null
 *
 * Null preference means "no preference" = user is satisfied with anything (1.0)
 * When both have preferences, calculate satisfaction based on directional logic
 */
function calculateTypeG_Directional(
  aResponse: ResponseValue,
  bResponse: ResponseValue,
): number {
  const aAnswer = aResponse.answer;
  const bAnswer = bResponse.answer;
  const aPreference = aResponse.preference;
  const bPreference = bResponse.preference;

  // Validate numeric answers
  if (typeof aAnswer !== "number" || typeof bAnswer !== "number") return 0.5;

  // Calculate raw numeric similarity for when needed
  const rawSimilarity = calculateTypeA_Numeric(aResponse, bResponse);
  const diff = bAnswer - aAnswer; // Positive means B is higher than A

  // Check A's satisfaction
  let aSatisfied = 1.0; // Default: null preference = satisfied
  if (aPreference === "more") {
    aSatisfied = diff > 0 ? 1.0 : 0.0; // B must be higher than A
  } else if (aPreference === "less") {
    aSatisfied = diff < 0 ? 1.0 : 0.0; // B must be lower than A
  } else if (aPreference === "same") {
    aSatisfied = diff === 0 ? 1.0 : 0.0; // B must equal A
  } else if (aPreference === "similar") {
    aSatisfied = Math.abs(diff) <= 1 ? 1.0 : rawSimilarity; // Within 1 point or gradual
  }
  // else: null/undefined preference → aSatisfied = 1.0 (already set)

  // Check B's satisfaction
  let bSatisfied = 1.0; // Default: null preference = satisfied
  const diffB = aAnswer - bAnswer; // For B's perspective: A relative to B
  if (bPreference === "more") {
    bSatisfied = diffB > 0 ? 1.0 : 0.0; // A must be higher than B
  } else if (bPreference === "less") {
    bSatisfied = diffB < 0 ? 1.0 : 0.0; // A must be lower than B
  } else if (bPreference === "same") {
    bSatisfied = diffB === 0 ? 1.0 : 0.0; // A must equal B
  } else if (bPreference === "similar") {
    bSatisfied = Math.abs(diffB) <= 1 ? 1.0 : rawSimilarity; // Within 1 point or gradual
  }
  // else: null/undefined preference → bSatisfied = 1.0 (already set)

  return (aSatisfied + bSatisfied) / 2;
}

/**
 * Type H: Binary (yes/no)
 * Simple exact match
 *
 * Similarity = 1.0 if answers match, 0.0 otherwise
 */
function calculateTypeH_Binary(
  aResponse: ResponseValue,
  bResponse: ResponseValue,
): number {
  const aAnswer = aResponse.answer;
  const bAnswer = bResponse.answer;

  return aAnswer === bAnswer ? 1.0 : 0.0;
}

/**
 * Special Case: Love Languages (Q21)
 * Wrapper for the special case function
 */
function calculateLoveLanguages(
  aResponse: ResponseValue,
  bResponse: ResponseValue,
  config: typeof MATCHING_CONFIG,
): number {
  // Defensive check for missing answer data
  if (!aResponse?.answer || !bResponse?.answer) {
    return config.PREFER_NOT_ANSWER_SIMILARITY;
  }

  // Transform from questionnaire format to love language format
  // answer = how user shows love, preference = how user wants to receive love
  const aLoveLanguage = {
    show: Array.isArray(aResponse.answer)
      ? aResponse.answer
      : [aResponse.answer],
    receive: Array.isArray(aResponse.preference)
      ? aResponse.preference
      : aResponse.preference
        ? [aResponse.preference]
        : aResponse.answer,
  };

  const bLoveLanguage = {
    show: Array.isArray(bResponse.answer)
      ? bResponse.answer
      : [bResponse.answer],
    receive: Array.isArray(bResponse.preference)
      ? bResponse.preference
      : bResponse.preference
        ? [bResponse.preference]
        : bResponse.answer,
  };

  const result = calculateLoveLanguageCompatibility(
    aLoveLanguage,
    bLoveLanguage,
    config,
  );
  return result.weightedScore;
}

/**
 * Special Case: Conflict Resolution (Q25)
 * Wrapper for the special case function
 */
function calculateConflictResolution(
  aResponse: ResponseValue,
  bResponse: ResponseValue,
  config: typeof MATCHING_CONFIG,
): number {
  // Defensive check for missing data
  if (!aResponse || !bResponse) {
    return config.PREFER_NOT_ANSWER_SIMILARITY;
  }

  // Ensure responses have the required structure
  const aConflictResponse = {
    answer: aResponse.answer || [],
    preference: aResponse.preference || "compatible",
  };
  const bConflictResponse = {
    answer: bResponse.answer || [],
    preference: bResponse.preference || "compatible",
  };

  const result = calculateConflictResolutionCompatibility(
    aConflictResponse,
    bConflictResponse,
    config,
  );
  return result.finalScore;
}

/**
 * Special Case: Sleep Schedule (Q29)
 * Wrapper for the special case function
 */
function calculateSleepSchedule(
  aResponse: ResponseValue,
  bResponse: ResponseValue,
  config: typeof MATCHING_CONFIG,
): number {
  // Defensive check for missing answer data
  if (!aResponse?.answer || !bResponse?.answer) {
    return config.PREFER_NOT_ANSWER_SIMILARITY;
  }

  const result = calculateSleepScheduleCompatibility(
    aResponse, // Full response with answer
    bResponse, // Full response with answer
    config,
  );
  return result.finalScore;
}
