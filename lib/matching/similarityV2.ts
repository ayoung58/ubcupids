/**
 * Similarity Functions for Questionnaire V2 Matching Algorithm
 *
 * This module implements 9 different question type similarity calculators (Types A-I)
 * for the bidirectional matching algorithm.
 *
 * Each function returns a similarity score between 0.0 and 1.0:
 * - 1.0 = Perfect match
 * - 0.0 = Complete mismatch
 *
 * All functions are bidirectional: similarity(A→B) considers both:
 * 1. Does A's preference match B's answer?
 * 2. Does B's preference match A's answer?
 */

import { ResponseValue, QuestionResponse } from "@/src/lib/questionnaire-types";

/**
 * Helper: Check if a response has "doesn't matter" preference
 */
function doesntMatter(response: QuestionResponse | undefined): boolean {
  return response?.preference?.doesntMatter === true;
}

/**
 * Helper: Get preference type
 */
function getPreferenceType(response: QuestionResponse | undefined): string {
  return response?.preference?.type || "similar";
}

/**
 * Helper: Get preference value
 */
function getPreferenceValue(
  response: QuestionResponse | undefined
): ResponseValue | undefined {
  return response?.preference?.value;
}

// ============================================
// TYPE A: Categorical Exact Match
// ============================================
// Used for: Gender identity (Q1), Sexual orientation (Q3), Cultural background (Q5),
//           Religion (Q6), Pets (Q16), Children (Q19)
//
// Logic:
// - If preference is "same": Match if ownAnswers are identical
// - If preference is "different": Match if ownAnswers differ
// - If preference specifies value(s): Match if other's ownAnswer is in specified set
// - "Doesn't matter" always returns 1.0

export function categoricalExactMatch(
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined
): number {
  if (!personA?.ownAnswer || !personB?.ownAnswer) return 0;

  // Check doesn't matter
  const aDoesntMatter = doesntMatter(personA);
  const bDoesntMatter = doesntMatter(personB);

  if (aDoesntMatter && bDoesntMatter) return 1.0;

  const aPrefType = getPreferenceType(personA);
  const bPrefType = getPreferenceType(personB);
  const aPrefValue = getPreferenceValue(personA);
  const bPrefValue = getPreferenceValue(personB);

  const aAnswer = personA.ownAnswer;
  const bAnswer = personB.ownAnswer;

  // Calculate A→B direction
  let aToB = 0;
  if (aDoesntMatter) {
    aToB = 1.0;
  } else if (aPrefType === "same") {
    aToB = aAnswer === bAnswer ? 1.0 : 0.0;
  } else if (aPrefType === "different") {
    aToB = aAnswer !== bAnswer ? 1.0 : 0.0;
  } else if (aPrefType === "specific" && aPrefValue) {
    // Multi-select preference: check if B's answer is in A's preference set
    const prefSet = Array.isArray(aPrefValue) ? aPrefValue : [aPrefValue];
    aToB = prefSet.includes(bAnswer as string) ? 1.0 : 0.0;
  }

  // Calculate B→A direction
  let bToA = 0;
  if (bDoesntMatter) {
    bToA = 1.0;
  } else if (bPrefType === "same") {
    bToA = aAnswer === bAnswer ? 1.0 : 0.0;
  } else if (bPrefType === "different") {
    bToA = aAnswer !== bAnswer ? 1.0 : 0.0;
  } else if (bPrefType === "specific" && bPrefValue) {
    const prefSet = Array.isArray(bPrefValue) ? bPrefValue : [bPrefValue];
    bToA = prefSet.includes(aAnswer as string) ? 1.0 : 0.0;
  }

  // Return minimum (both must be satisfied)
  return Math.min(aToB, bToA);
}

// ============================================
// TYPE B: Single-Select with "Same" Preference
// ============================================
// Used for: Political views (Q7), Communication frequency (Q13), Cleanliness (Q14)
//
// Logic:
// - "Same": 1.0 if answers match, 0.0 otherwise
// - "Similar": Uses ordinal proximity (defined by option order)
// - "Specific": Match if other's answer is in preference set
// - "Doesn't matter": 1.0

export function singleSelectSame(
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined,
  orderedOptions?: string[] // Optional: for "similar" proximity calculation
): number {
  if (!personA?.ownAnswer || !personB?.ownAnswer) return 0;

  const aDoesntMatter = doesntMatter(personA);
  const bDoesntMatter = doesntMatter(personB);

  if (aDoesntMatter && bDoesntMatter) return 1.0;

  const aPrefType = getPreferenceType(personA);
  const bPrefType = getPreferenceType(personB);
  const aPrefValue = getPreferenceValue(personA);
  const bPrefValue = getPreferenceValue(personB);

  const aAnswer = personA.ownAnswer as string;
  const bAnswer = personB.ownAnswer as string;

  // Helper for "similar" calculation
  const calculateSimilarity = (answer1: string, answer2: string): number => {
    if (answer1 === answer2) return 1.0;
    if (!orderedOptions) return 0.5; // Default: moderate similarity

    const idx1 = orderedOptions.indexOf(answer1);
    const idx2 = orderedOptions.indexOf(answer2);

    if (idx1 === -1 || idx2 === -1) return 0.5;

    const distance = Math.abs(idx1 - idx2);
    const maxDistance = orderedOptions.length - 1;

    return 1.0 - distance / maxDistance;
  };

  // Calculate A→B
  let aToB = 0;
  if (aDoesntMatter) {
    aToB = 1.0;
  } else if (aPrefType === "same") {
    aToB = aAnswer === bAnswer ? 1.0 : 0.0;
  } else if (aPrefType === "similar") {
    aToB = calculateSimilarity(aAnswer, bAnswer);
  } else if (aPrefType === "specific" && aPrefValue) {
    const prefSet = Array.isArray(aPrefValue) ? aPrefValue : [aPrefValue];
    aToB = prefSet.includes(bAnswer) ? 1.0 : 0.0;
  }

  // Calculate B→A
  let bToA = 0;
  if (bDoesntMatter) {
    bToA = 1.0;
  } else if (bPrefType === "same") {
    bToA = aAnswer === bAnswer ? 1.0 : 0.0;
  } else if (bPrefType === "similar") {
    bToA = calculateSimilarity(aAnswer, bAnswer);
  } else if (bPrefType === "specific" && bPrefValue) {
    const prefSet = Array.isArray(bPrefValue) ? bPrefValue : [bPrefValue];
    bToA = prefSet.includes(aAnswer) ? 1.0 : 0.0;
  }

  return Math.min(aToB, bToA);
}

// ============================================
// TYPE C: Multi-Select Jaccard Similarity
// ============================================
// Used for: Hobbies (Q11), Social activities (Q12), Values (Q23)
//
// Logic:
// - "Same": Jaccard similarity of ownAnswer sets
// - "Similar": Weighted Jaccard (partial overlap counts more)
// - "Specific": Check if other's answers intersect with preference set
// - "Doesn't matter": 1.0

export function multiSelectJaccard(
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined
): number {
  if (!personA?.ownAnswer || !personB?.ownAnswer) return 0;

  const aDoesntMatter = doesntMatter(personA);
  const bDoesntMatter = doesntMatter(personB);

  if (aDoesntMatter && bDoesntMatter) return 1.0;

  const aAnswer = personA.ownAnswer as string[];
  const bAnswer = personB.ownAnswer as string[];

  if (!Array.isArray(aAnswer) || !Array.isArray(bAnswer)) return 0;

  const aPrefType = getPreferenceType(personA);
  const bPrefType = getPreferenceType(personB);
  const aPrefValue = getPreferenceValue(personA);
  const bPrefValue = getPreferenceValue(personB);

  // Jaccard similarity: |A ∩ B| / |A ∪ B|
  const jaccard = (set1: string[], set2: string[]): number => {
    if (set1.length === 0 && set2.length === 0) return 1.0;
    const intersection = set1.filter((x) => set2.includes(x)).length;
    const union = new Set([...set1, ...set2]).size;
    return union === 0 ? 0 : intersection / union;
  };

  // Weighted Jaccard for "similar" (partial overlap is better than none)
  const weightedJaccard = (set1: string[], set2: string[]): number => {
    const base = jaccard(set1, set2);
    // Boost score if there's any overlap
    const hasOverlap = set1.some((x) => set2.includes(x));
    return hasOverlap ? Math.max(base, 0.5) : base;
  };

  // Calculate A→B
  let aToB = 0;
  if (aDoesntMatter) {
    aToB = 1.0;
  } else if (aPrefType === "same") {
    aToB = jaccard(aAnswer, bAnswer);
  } else if (aPrefType === "similar") {
    aToB = weightedJaccard(aAnswer, bAnswer);
  } else if (aPrefType === "specific" && aPrefValue) {
    const prefSet = Array.isArray(aPrefValue) ? aPrefValue : [aPrefValue];
    const overlap = bAnswer.filter((x) => prefSet.includes(x)).length;
    aToB = overlap > 0 ? 1.0 : 0.0;
  }

  // Calculate B→A
  let bToA = 0;
  if (bDoesntMatter) {
    bToA = 1.0;
  } else if (bPrefType === "same") {
    bToA = jaccard(aAnswer, bAnswer);
  } else if (bPrefType === "similar") {
    bToA = weightedJaccard(aAnswer, bAnswer);
  } else if (bPrefType === "specific" && bPrefValue) {
    const prefSet = Array.isArray(bPrefValue) ? bPrefValue : [bPrefValue];
    const overlap = aAnswer.filter((x) => prefSet.includes(x)).length;
    bToA = overlap > 0 ? 1.0 : 0.0;
  }

  return Math.min(aToB, bToA);
}

// ============================================
// TYPE D: Single vs Multi-Select Match
// ============================================
// Used for: Relationship style (Q8) - person wants one style, prefers partner has compatible style(s)
//
// Logic:
// - ownAnswer is single string
// - preference.value can be string[] (multi-select)
// - Check if other's ownAnswer is in this person's preference set

export function singleVsMultiSelect(
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined
): number {
  if (!personA?.ownAnswer || !personB?.ownAnswer) return 0;

  const aDoesntMatter = doesntMatter(personA);
  const bDoesntMatter = doesntMatter(personB);

  if (aDoesntMatter && bDoesntMatter) return 1.0;

  const aAnswer = personA.ownAnswer as string;
  const bAnswer = personB.ownAnswer as string;
  const aPrefValue = getPreferenceValue(personA);
  const bPrefValue = getPreferenceValue(personB);

  // Calculate A→B
  let aToB = 0;
  if (aDoesntMatter) {
    aToB = 1.0;
  } else if (aPrefValue) {
    const prefSet = Array.isArray(aPrefValue) ? aPrefValue : [aPrefValue];
    aToB = prefSet.includes(bAnswer) ? 1.0 : 0.0;
  }

  // Calculate B→A
  let bToA = 0;
  if (bDoesntMatter) {
    bToA = 1.0;
  } else if (bPrefValue) {
    const prefSet = Array.isArray(bPrefValue) ? bPrefValue : [bPrefValue];
    bToA = prefSet.includes(aAnswer) ? 1.0 : 0.0;
  }

  return Math.min(aToB, bToA);
}

// ============================================
// TYPE E: Compound Drug Use Match
// ============================================
// Used for: Q9 (Drugs/Alcohol)
//
// Logic:
// - ownAnswer: { substances: string[], frequency: string }
// - Two-step matching:
//   1. Substance compatibility (if person says "never", partner must also say "never" for that substance)
//   2. Frequency similarity (for substances both use)

export function compoundDrugUse(
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined
): number {
  if (!personA?.ownAnswer || !personB?.ownAnswer) return 0;

  const aDoesntMatter = doesntMatter(personA);
  const bDoesntMatter = doesntMatter(personB);

  if (aDoesntMatter && bDoesntMatter) return 1.0;

  const aAnswer = personA.ownAnswer as unknown as {
    substances: string[];
    frequency: string;
  };
  const bAnswer = personB.ownAnswer as unknown as {
    substances: string[];
    frequency: string;
  };

  if (!aAnswer.substances || !bAnswer.substances) return 0;

  // If either says "none", they should match only if both say "none"
  const aUsesNone = aAnswer.substances.includes("none");
  const bUsesNone = bAnswer.substances.includes("none");

  if (aUsesNone && bUsesNone) return 1.0;
  if (aUsesNone || bUsesNone) return 0.0;

  // Check substance compatibility
  const aSubstances = new Set(aAnswer.substances);
  const bSubstances = new Set(bAnswer.substances);
  const commonSubstances = [...aSubstances].filter((x) => bSubstances.has(x));

  // If no overlap in substances, check preferences
  if (commonSubstances.length === 0) {
    // If one has strict preference about substances, apply it
    if (!aDoesntMatter || !bDoesntMatter) {
      return 0.3; // Low compatibility but not dealbreaker
    }
    return 0.5; // Neutral if both don't care
  }

  // Frequency compatibility for common substances
  const frequencyOrder = ["rarely", "occasionally", "regularly", "frequently"];
  const aFreqIdx = frequencyOrder.indexOf(aAnswer.frequency || "occasionally");
  const bFreqIdx = frequencyOrder.indexOf(bAnswer.frequency || "occasionally");

  const freqDistance = Math.abs(aFreqIdx - bFreqIdx);
  const freqSimilarity = 1.0 - freqDistance / (frequencyOrder.length - 1);

  // Combine substance overlap and frequency similarity
  const overlapRatio =
    commonSubstances.length / Math.max(aSubstances.size, bSubstances.size);

  return (overlapRatio + freqSimilarity) / 2;
}

// ============================================
// TYPE F: Ordinal/Likert Same/Similar
// ============================================
// Used for: Time together (Q10), Gym frequency (Q17), Sleep schedule (Q20)
//
// Logic:
// - Likert scale or ordered options
// - "Same": Exact match = 1.0, otherwise 0.0
// - "Similar": Linear proximity based on scale position
// - "Specific": Match if other's answer is in preference set

export function ordinalLikert(
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined,
  orderedOptions: string[]
): number {
  if (!personA?.ownAnswer || !personB?.ownAnswer) return 0;

  const aDoesntMatter = doesntMatter(personA);
  const bDoesntMatter = doesntMatter(personB);

  if (aDoesntMatter && bDoesntMatter) return 1.0;

  const aAnswer = personA.ownAnswer as string;
  const bAnswer = personB.ownAnswer as string;
  const aPrefType = getPreferenceType(personA);
  const bPrefType = getPreferenceType(personB);
  const aPrefValue = getPreferenceValue(personA);
  const bPrefValue = getPreferenceValue(personB);

  const aIdx = orderedOptions.indexOf(aAnswer);
  const bIdx = orderedOptions.indexOf(bAnswer);

  if (aIdx === -1 || bIdx === -1) return 0;

  const maxDistance = orderedOptions.length - 1;

  // Helper for similarity
  const calculateSimilarity = (idx1: number, idx2: number): number => {
    if (idx1 === idx2) return 1.0;
    const distance = Math.abs(idx1 - idx2);
    return 1.0 - distance / maxDistance;
  };

  // Calculate A→B
  let aToB = 0;
  if (aDoesntMatter) {
    aToB = 1.0;
  } else if (aPrefType === "same") {
    aToB = aAnswer === bAnswer ? 1.0 : 0.0;
  } else if (aPrefType === "similar") {
    aToB = calculateSimilarity(aIdx, bIdx);
  } else if (aPrefType === "specific" && aPrefValue) {
    const prefSet = Array.isArray(aPrefValue) ? aPrefValue : [aPrefValue];
    aToB = prefSet.includes(bAnswer) ? 1.0 : 0.0;
  }

  // Calculate B→A
  let bToA = 0;
  if (bDoesntMatter) {
    bToA = 1.0;
  } else if (bPrefType === "same") {
    bToA = aAnswer === bAnswer ? 1.0 : 0.0;
  } else if (bPrefType === "similar") {
    bToA = calculateSimilarity(aIdx, bIdx);
  } else if (bPrefType === "specific" && bPrefValue) {
    const prefSet = Array.isArray(bPrefValue) ? bPrefValue : [bPrefValue];
    bToA = prefSet.includes(aAnswer) ? 1.0 : 0.0;
  }

  return Math.min(aToB, bToA);
}

// ============================================
// TYPE G: Directional Likert Scale
// ============================================
// Used for: Planning style (Q22), Emotional expression (Q24), Ambition (Q27), Social battery (Q28)
//
// Logic:
// - Scale has directional meaning (e.g., spontaneous ← → planner)
// - Preference can be "same", "similar", "more_X", "less_X"
// - "more_X" means preference for partner to be more toward X end of scale

export function directionalLikert(
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined,
  orderedOptions: string[], // e.g., ["very-spontaneous", "spontaneous", "balanced", "planner", "very-planner"]
  positiveDirection: "higher" | "lower" = "higher" // Which end of array is "more"
): number {
  if (!personA?.ownAnswer || !personB?.ownAnswer) return 0;

  const aDoesntMatter = doesntMatter(personA);
  const bDoesntMatter = doesntMatter(personB);

  if (aDoesntMatter && bDoesntMatter) return 1.0;

  const aAnswer = personA.ownAnswer as string;
  const bAnswer = personB.ownAnswer as string;
  const aPrefType = getPreferenceType(personA);
  const bPrefType = getPreferenceType(personB);

  const aIdx = orderedOptions.indexOf(aAnswer);
  const bIdx = orderedOptions.indexOf(bAnswer);

  if (aIdx === -1 || bIdx === -1) return 0;

  const maxDistance = orderedOptions.length - 1;

  const calculateScore = (
    myIdx: number,
    theirIdx: number,
    prefType: string
  ): number => {
    if (prefType === "same") {
      return myIdx === theirIdx ? 1.0 : 0.0;
    } else if (prefType === "similar") {
      const distance = Math.abs(myIdx - theirIdx);
      return 1.0 - distance / maxDistance;
    } else if (prefType === "more") {
      // Want partner to be MORE toward positive direction
      if (positiveDirection === "higher") {
        return theirIdx >= myIdx ? 1.0 : 0.5;
      } else {
        return theirIdx <= myIdx ? 1.0 : 0.5;
      }
    } else if (prefType === "less") {
      // Want partner to be LESS toward positive direction
      if (positiveDirection === "higher") {
        return theirIdx <= myIdx ? 1.0 : 0.5;
      } else {
        return theirIdx >= myIdx ? 1.0 : 0.5;
      }
    } else if (prefType === "complement") {
      // Want partner to complement (opposite end)
      const distance = Math.abs(myIdx - theirIdx);
      return distance / maxDistance; // Higher score for more distance
    }
    return 0.5; // Default
  };

  // Calculate A→B
  const aToB = aDoesntMatter ? 1.0 : calculateScore(aIdx, bIdx, aPrefType);

  // Calculate B→A
  const bToA = bDoesntMatter ? 1.0 : calculateScore(bIdx, aIdx, bPrefType);

  return Math.min(aToB, bToA);
}

// ============================================
// TYPE H: "Different" Preference Match
// ============================================
// Used for: Life goals (Q26), Future plans (Q33)
//
// Logic:
// - User wants partner with DIFFERENT or COMPLEMENTARY answer
// - "Same": Exact match
// - "Different": Mismatch is better
// - "Complementary": Specific compatible pairs

export function differentPreference(
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined,
  complementaryPairs?: Record<string, string[]> // Optional: define which answers complement each other
): number {
  if (!personA?.ownAnswer || !personB?.ownAnswer) return 0;

  const aDoesntMatter = doesntMatter(personA);
  const bDoesntMatter = doesntMatter(personB);

  if (aDoesntMatter && bDoesntMatter) return 1.0;

  const aAnswer = personA.ownAnswer as string;
  const bAnswer = personB.ownAnswer as string;
  const aPrefType = getPreferenceType(personA);
  const bPrefType = getPreferenceType(personB);

  const calculateScore = (
    myAnswer: string,
    theirAnswer: string,
    prefType: string
  ): number => {
    if (prefType === "same") {
      return myAnswer === theirAnswer ? 1.0 : 0.0;
    } else if (prefType === "different") {
      return myAnswer !== theirAnswer ? 1.0 : 0.0;
    } else if (prefType === "complement" && complementaryPairs) {
      const validPairs = complementaryPairs[myAnswer] || [];
      return validPairs.includes(theirAnswer) ? 1.0 : 0.0;
    }
    return 0.5;
  };

  const aToB = aDoesntMatter
    ? 1.0
    : calculateScore(aAnswer, bAnswer, aPrefType);
  const bToA = bDoesntMatter
    ? 1.0
    : calculateScore(bAnswer, aAnswer, bPrefType);

  return Math.min(aToB, bToA);
}

// ============================================
// TYPE I: Special Cases
// ============================================
// Q21: Love Languages (bidirectional: show ↔ receive)
// Q25: Conflict Resolution (compatibility matrix)
// Q29: Sleep Schedule (with "Flexible" wildcard)

/**
 * Q21: Love Languages
 * ownAnswer: { show: string[], receive: string[] }
 * preference.value: string[] (love languages they want partner to SHOW)
 *
 * Matching logic:
 * - A's "show" should overlap with B's "receive"
 * - B's "show" should overlap with A's "receive"
 */
export function loveLangauges(
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined
): number {
  if (!personA?.ownAnswer || !personB?.ownAnswer) return 0;

  const aDoesntMatter = doesntMatter(personA);
  const bDoesntMatter = doesntMatter(personB);

  if (aDoesntMatter && bDoesntMatter) return 1.0;

  const aAnswer = personA.ownAnswer as unknown as {
    show: string[];
    receive: string[];
  };
  const bAnswer = personB.ownAnswer as unknown as {
    show: string[];
    receive: string[];
  };

  // Note: preference.value stores what they want partner to SHOW (same as their "receive")
  const aPrefValue =
    (getPreferenceValue(personA) as string[]) || aAnswer.receive;
  const bPrefValue =
    (getPreferenceValue(personB) as string[]) || bAnswer.receive;

  // A→B: Does B show what A wants to receive?
  const aReceives = new Set(aPrefValue);
  const bShows = new Set(aAnswer.show);
  const aToB_overlap = [...aReceives].filter((x) => bShows.has(x)).length;
  const aToB = aDoesntMatter ? 1.0 : aToB_overlap / aReceives.size;

  // B→A: Does A show what B wants to receive?
  const bReceives = new Set(bPrefValue);
  const aShows = new Set(bAnswer.show);
  const bToA_overlap = [...bReceives].filter((x) => aShows.has(x)).length;
  const bToA = bDoesntMatter ? 1.0 : bToA_overlap / bReceives.size;

  return Math.min(aToB, bToA);
}

/**
 * Q25: Conflict Resolution Style
 * Uses compatibility matrix to determine which styles work well together
 */
export function conflictResolution(
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined
): number {
  if (!personA?.ownAnswer || !personB?.ownAnswer) return 0;

  const aDoesntMatter = doesntMatter(personA);
  const bDoesntMatter = doesntMatter(personB);

  if (aDoesntMatter && bDoesntMatter) return 1.0;

  const aAnswer = personA.ownAnswer as string;
  const bAnswer = personB.ownAnswer as string;

  // Compatibility matrix (1.0 = highly compatible, 0.0 = incompatible)
  const compatibilityMatrix: Record<string, Record<string, number>> = {
    "direct-immediate": {
      "direct-immediate": 1.0,
      "calm-discuss": 0.8,
      "space-first": 0.4,
      "avoid-conflict": 0.2,
    },
    "calm-discuss": {
      "direct-immediate": 0.8,
      "calm-discuss": 1.0,
      "space-first": 0.7,
      "avoid-conflict": 0.5,
    },
    "space-first": {
      "direct-immediate": 0.4,
      "calm-discuss": 0.7,
      "space-first": 1.0,
      "avoid-conflict": 0.6,
    },
    "avoid-conflict": {
      "direct-immediate": 0.2,
      "calm-discuss": 0.5,
      "space-first": 0.6,
      "avoid-conflict": 0.8,
    },
  };

  const baseScore = compatibilityMatrix[aAnswer]?.[bAnswer] || 0.5;

  // If either doesn't matter, give them the base compatibility score
  if (aDoesntMatter || bDoesntMatter) {
    return baseScore;
  }

  return baseScore;
}

/**
 * Q29: Sleep Schedule
 * Special case: "flexible" is a wildcard that matches with anything
 */
export function sleepSchedule(
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined,
  orderedOptions: string[]
): number {
  if (!personA?.ownAnswer || !personB?.ownAnswer) return 0;

  const aDoesntMatter = doesntMatter(personA);
  const bDoesntMatter = doesntMatter(personB);

  if (aDoesntMatter && bDoesntMatter) return 1.0;

  const aAnswer = personA.ownAnswer as string;
  const bAnswer = personB.ownAnswer as string;

  // "flexible" is wildcard - always compatible
  if (aAnswer === "flexible" || bAnswer === "flexible") {
    return 1.0;
  }

  // Otherwise, use ordinal likert matching
  return ordinalLikert(personA, personB, orderedOptions);
}

/**
 * Master similarity function dispatcher
 * Routes to appropriate similarity function based on question ID
 */
export function calculateSimilarity(
  questionId: string,
  personA: QuestionResponse | undefined,
  personB: QuestionResponse | undefined
): number {
  // Type A: Categorical exact match
  if (["q1", "q3", "q5", "q6", "q16", "q19"].includes(questionId)) {
    return categoricalExactMatch(personA, personB);
  }

  // Type B: Single-select with same
  if (["q7", "q13", "q14"].includes(questionId)) {
    const orderedOptions: Record<string, string[]> = {
      q7: [
        "very-liberal",
        "liberal",
        "moderate",
        "conservative",
        "very-conservative",
      ],
      q13: ["constant", "daily", "few-times-week", "once-week", "sporadic"],
      q14: ["very-neat", "neat", "average", "messy", "very-messy"],
    };
    return singleSelectSame(personA, personB, orderedOptions[questionId]);
  }

  // Type C: Multi-select Jaccard
  if (["q11", "q12", "q23"].includes(questionId)) {
    return multiSelectJaccard(personA, personB);
  }

  // Type D: Single vs multi-select
  if (questionId === "q8") {
    return singleVsMultiSelect(personA, personB);
  }

  // Type E: Compound drug use
  if (questionId === "q9") {
    return compoundDrugUse(personA, personB);
  }

  // Type F: Ordinal/Likert
  if (["q10", "q17", "q20"].includes(questionId)) {
    const orderedOptions: Record<string, string[]> = {
      q10: ["minimal", "some", "moderate", "frequent", "constant"],
      q17: ["never", "rarely", "sometimes", "regularly", "daily"],
      q20: ["very-early", "early", "average", "late", "very-late"],
    };
    return ordinalLikert(personA, personB, orderedOptions[questionId]);
  }

  // Type G: Directional Likert
  if (["q22", "q24", "q27", "q28"].includes(questionId)) {
    const config: Record<
      string,
      { options: string[]; direction: "higher" | "lower" }
    > = {
      q22: {
        options: [
          "very-spontaneous",
          "spontaneous",
          "balanced",
          "planner",
          "very-planner",
        ],
        direction: "higher",
      },
      q24: {
        options: [
          "very-reserved",
          "reserved",
          "moderate",
          "expressive",
          "very-expressive",
        ],
        direction: "higher",
      },
      q27: {
        options: [
          "relaxed",
          "moderate",
          "driven",
          "very-driven",
          "extremely-driven",
        ],
        direction: "higher",
      },
      q28: {
        options: [
          "very-introverted",
          "introverted",
          "ambivert",
          "extroverted",
          "very-extroverted",
        ],
        direction: "higher",
      },
    };
    const { options, direction } = config[questionId];
    return directionalLikert(personA, personB, options, direction);
  }

  // Type H: Different preference
  if (["q26", "q33"].includes(questionId)) {
    return differentPreference(personA, personB);
  }

  // Type I: Special cases
  if (questionId === "q21") {
    return loveLangauges(personA, personB);
  }

  if (questionId === "q25") {
    return conflictResolution(personA, personB);
  }

  if (questionId === "q29") {
    const options = [
      "early-bird",
      "morning-person",
      "flexible",
      "night-owl",
      "extreme-night-owl",
    ];
    return sleepSchedule(personA, personB, options);
  }

  // Default: return neutral score
  console.warn(`No similarity function defined for question ${questionId}`);
  return 0.5;
}
