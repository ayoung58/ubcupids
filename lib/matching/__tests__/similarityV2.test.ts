/**
 * Unit Tests for Similarity Functions V2
 *
 * Tests all 9 similarity function types (A-I) with edge cases:
 * - Normal matching scenarios
 * - "Doesn't matter" preferences
 * - Dealbreakers (tested in algorithm, not here)
 * - Special cases: Q21 love languages, Q25 conflict matrix, Q29 wildcards
 * - Bidirectional scoring
 */

import {
  categoricalExactMatch,
  singleSelectSame,
  multiSelectJaccard,
  singleVsMultiSelect,
  compoundDrugUse,
  ordinalLikert,
  directionalLikert,
  differentPreference,
  loveLangauges,
  conflictResolution,
  sleepSchedule,
  calculateSimilarity,
} from "../similarityV2";
import { QuestionResponse } from "@/src/lib/questionnaire-types";

// ============================================
// TYPE A: Categorical Exact Match
// ============================================

describe("categoricalExactMatch", () => {
  test("same preference - matching answers", () => {
    const personA: QuestionResponse = {
      ownAnswer: "man",
      preference: { type: "same", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "man",
      preference: { type: "same", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    expect(categoricalExactMatch(personA, personB)).toBe(1.0);
  });

  test("same preference - different answers", () => {
    const personA: QuestionResponse = {
      ownAnswer: "man",
      preference: { type: "same", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "woman",
      preference: { type: "same", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    expect(categoricalExactMatch(personA, personB)).toBe(0.0);
  });

  test("different preference - different answers", () => {
    const personA: QuestionResponse = {
      ownAnswer: "man",
      preference: { type: "different", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "woman",
      preference: { type: "different", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    expect(categoricalExactMatch(personA, personB)).toBe(1.0);
  });

  test("specific preference - match in set", () => {
    const personA: QuestionResponse = {
      ownAnswer: "atheist",
      preference: {
        type: "specific_values",
        value: ["atheist", "agnostic"],
        doesntMatter: false,
      },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "agnostic",
      preference: { type: "same", doesntMatter: true },
      importance: 1,
      dealbreaker: false,
    };
    expect(categoricalExactMatch(personA, personB)).toBe(1.0);
  });

  test("specific preference - not in set", () => {
    const personA: QuestionResponse = {
      ownAnswer: "atheist",
      preference: {
        type: "specific_values",
        value: ["atheist", "agnostic"],
        doesntMatter: false,
      },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "christian",
      preference: { type: "same", doesntMatter: true },
      importance: 1,
      dealbreaker: false,
    };
    expect(categoricalExactMatch(personA, personB)).toBe(0.0);
  });

  test("both doesn't matter", () => {
    const personA: QuestionResponse = {
      ownAnswer: "man",
      preference: { type: "same", doesntMatter: true },
      importance: 1,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "woman",
      preference: { type: "same", doesntMatter: true },
      importance: 1,
      dealbreaker: false,
    };
    expect(categoricalExactMatch(personA, personB)).toBe(1.0);
  });

  test("one doesn't matter - asymmetric", () => {
    const personA: QuestionResponse = {
      ownAnswer: "man",
      preference: { type: "same", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "woman",
      preference: { type: "same", doesntMatter: true },
      importance: 1,
      dealbreaker: false,
    };
    // A wants same (fails), B doesn't matter (passes) → min = 0
    expect(categoricalExactMatch(personA, personB)).toBe(0.0);
  });
});

// ============================================
// TYPE B: Single-Select Similarity
// ============================================

describe("singleSelectSame", () => {
  test("similar preference - exact match", () => {
    const personA: QuestionResponse = {
      ownAnswer: "very_important",
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "very_important",
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    expect(singleSelectSame(personA, personB)).toBe(1.0);
  });

  test("similar preference - adjacent options", () => {
    const personA: QuestionResponse = {
      ownAnswer: "very_important",
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "somewhat_important",
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // Adjacent = 0.67 score
    expect(singleSelectSame(personA, personB)).toBeCloseTo(0.67, 2);
  });

  test("similar preference - distant options", () => {
    const personA: QuestionResponse = {
      ownAnswer: "very_important",
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "not_important",
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // 2 steps away = 0.33
    expect(singleSelectSame(personA, personB)).toBeCloseTo(0.33, 2);
  });

  test("compatible preference - overlapping sets", () => {
    const personA: QuestionResponse = {
      ownAnswer: "very_important",
      preference: {
        type: "compatible",
        value: ["very_important", "somewhat_important"],
        doesntMatter: false,
      },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "somewhat_important",
      preference: {
        type: "compatible",
        value: ["somewhat_important", "neutral"],
        doesntMatter: false,
      },
      importance: 2,
      dealbreaker: false,
    };
    // Both accept "somewhat_important"
    expect(singleSelectSame(personA, personB)).toBe(1.0);
  });

  test("compatible preference - no overlap", () => {
    const personA: QuestionResponse = {
      ownAnswer: "very_important",
      preference: {
        type: "compatible",
        value: ["very_important"],
        doesntMatter: false,
      },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "not_important",
      preference: {
        type: "compatible",
        value: ["not_important"],
        doesntMatter: false,
      },
      importance: 2,
      dealbreaker: false,
    };
    expect(singleSelectSame(personA, personB)).toBe(0.0);
  });
});

// ============================================
// TYPE C: Multi-Select Jaccard Similarity
// ============================================

describe("multiSelectJaccard", () => {
  test("similar preference - identical sets", () => {
    const personA: QuestionResponse = {
      ownAnswer: ["reading", "hiking", "gaming"],
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["reading", "hiking", "gaming"],
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    expect(multiSelectJaccard(personA, personB)).toBe(1.0);
  });

  test("similar preference - partial overlap", () => {
    const personA: QuestionResponse = {
      ownAnswer: ["reading", "hiking"],
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["hiking", "gaming"],
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    // Jaccard: 1 common / 3 total = 0.33
    expect(multiSelectJaccard(personA, personB)).toBeCloseTo(0.33, 2);
  });

  test("similar preference - no overlap", () => {
    const personA: QuestionResponse = {
      ownAnswer: ["reading"],
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["gaming"],
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    expect(multiSelectJaccard(personA, personB)).toBe(0.0);
  });

  test("specific_values preference - must have certain hobbies", () => {
    const personA: QuestionResponse = {
      ownAnswer: ["reading", "hiking", "cooking"],
      preference: {
        type: "specific_values",
        value: ["hiking"],
        doesntMatter: false,
      },
      importance: 4,
      dealbreaker: true,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["hiking", "gaming"],
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // A requires B to have "hiking" → yes (1.0), B wants similar → Jaccard 1/4 = 0.25 → min = 0.25
    expect(multiSelectJaccard(personA, personB)).toBeCloseTo(0.25, 2);
  });

  test("specific_values preference - missing required hobby", () => {
    const personA: QuestionResponse = {
      ownAnswer: ["reading", "hiking"],
      preference: {
        type: "specific_values",
        value: ["gaming"],
        doesntMatter: false,
      },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["cooking"],
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // A requires B to have "gaming" → no (0.0)
    expect(multiSelectJaccard(personA, personB)).toBe(0.0);
  });
});

// ============================================
// TYPE D: Single vs Multi-Select Similarity
// ============================================

describe("singleVsMultiSelect", () => {
  test("similar preference - contained in set", () => {
    const personA: QuestionResponse = {
      ownAnswer: "english",
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["english", "spanish"],
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    expect(singleVsMultiSelect(personA, personB)).toBe(1.0);
  });

  test("similar preference - not in set", () => {
    const personA: QuestionResponse = {
      ownAnswer: "french",
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["english", "spanish"],
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    expect(singleVsMultiSelect(personA, personB)).toBe(0.0);
  });

  test("specific_values - must contain language", () => {
    const personA: QuestionResponse = {
      ownAnswer: "english",
      preference: {
        type: "specific_values",
        value: ["english"],
        doesntMatter: false,
      },
      importance: 4,
      dealbreaker: true,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["english", "spanish", "mandarin"],
      preference: { type: "similar", doesntMatter: false },
      importance: 1,
      dealbreaker: false,
    };
    // A requires B to have "english" → yes
    expect(singleVsMultiSelect(personA, personB)).toBe(1.0);
  });
});

// ============================================
// TYPE E: Compound Drug Use Similarity
// ============================================

describe("compoundDrugUse", () => {
  test("matching substance and frequency", () => {
    const personA: QuestionResponse = {
      ownAnswer: { substance: "never", frequency: null },
      preference: { type: "similar", doesntMatter: false },
      importance: 4,
      dealbreaker: true,
    };
    const personB: QuestionResponse = {
      ownAnswer: { substance: "never", frequency: null },
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    expect(compoundDrugUse(personA, personB)).toBe(1.0);
  });

  test("same substance, different frequency - partial match", () => {
    const personA: QuestionResponse = {
      ownAnswer: { substance: "alcohol", frequency: "socially" },
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: { substance: "alcohol", frequency: "regularly" },
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // Substance match (0.7) + frequency mismatch (0) = 0.35 avg
    expect(compoundDrugUse(personA, personB)).toBeCloseTo(0.35, 2);
  });

  test("different substances - zero match", () => {
    const personA: QuestionResponse = {
      ownAnswer: { substance: "never", frequency: null },
      preference: { type: "similar", doesntMatter: false },
      importance: 4,
      dealbreaker: true,
    };
    const personB: QuestionResponse = {
      ownAnswer: { substance: "alcohol", frequency: "regularly" },
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    expect(compoundDrugUse(personA, personB)).toBe(0.0);
  });

  test("less preference - accepting lower frequency", () => {
    const personA: QuestionResponse = {
      ownAnswer: { substance: "alcohol", frequency: "regularly" },
      preference: { type: "less", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: { substance: "alcohol", frequency: "socially" },
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // A wants less/equal (B is less) → 1.0
    expect(compoundDrugUse(personA, personB)).toBe(1.0);
  });

  test("more preference - wanting higher frequency", () => {
    const personA: QuestionResponse = {
      ownAnswer: { substance: "alcohol", frequency: "socially" },
      preference: { type: "more", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: { substance: "alcohol", frequency: "regularly" },
      preference: { type: "similar", doesntMatter: false },
      importance: 1,
      dealbreaker: false,
    };
    // A wants more/equal (B is more) → 1.0
    expect(compoundDrugUse(personA, personB)).toBe(1.0);
  });
});

// ============================================
// TYPE F: Ordinal/Likert Similarity
// ============================================

describe("ordinalLikert", () => {
  test("similar preference - exact match", () => {
    const personA: QuestionResponse = {
      ownAnswer: 4,
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: 4,
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    expect(ordinalLikert(personA, personB, ["1", "2", "3", "4", "5"])).toBe(
      1.0
    );
  });

  test("similar preference - adjacent values", () => {
    const personA: QuestionResponse = {
      ownAnswer: 4,
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: 3,
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // Distance 1 on scale of 5 → 1 - 1/4 = 0.75
    expect(ordinalLikert(personA, personB, ["1", "2", "3", "4", "5"])).toBe(
      0.75
    );
  });

  test("similar preference - opposite ends", () => {
    const personA: QuestionResponse = {
      ownAnswer: 1,
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: 5,
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    // Distance 4 on scale of 5 → 1 - 4/4 = 0
    expect(ordinalLikert(personA, personB, ["1", "2", "3", "4", "5"])).toBe(
      0.0
    );
  });

  test("more preference - higher values accepted", () => {
    const personA: QuestionResponse = {
      ownAnswer: 3,
      preference: { type: "more", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: 4,
      preference: { type: "similar", doesntMatter: false },
      importance: 1,
      dealbreaker: false,
    };
    // A wants B ≥ 3 → yes (1.0), B wants similar → distance score
    expect(
      ordinalLikert(personA, personB, ["1", "2", "3", "4", "5"])
    ).toBeGreaterThan(0.7);
  });

  test("less preference - lower values accepted", () => {
    const personA: QuestionResponse = {
      ownAnswer: 4,
      preference: { type: "less", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: 2,
      preference: { type: "similar", doesntMatter: false },
      importance: 1,
      dealbreaker: false,
    };
    // A wants B ≤ 4 → yes (1.0)
    expect(
      ordinalLikert(personA, personB, ["1", "2", "3", "4", "5"])
    ).toBeGreaterThan(0.5);
  });
});

// ============================================
// TYPE G: Directional Likert Similarity
// ============================================

describe("directionalLikert", () => {
  test("similar preference - close values", () => {
    const personA: QuestionResponse = {
      ownAnswer: 60,
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: 65,
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // Distance 5 on scale of 100 → high similarity
    expect(
      directionalLikert(personA, personB, [
        "0",
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90",
        "100",
      ])
    ).toBeGreaterThan(0.9);
  });

  test("more preference - accepting higher values", () => {
    const personA: QuestionResponse = {
      ownAnswer: 40,
      preference: { type: "more", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: 80,
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // A wants B ≥ 40 → yes
    expect(
      directionalLikert(personA, personB, [
        "0",
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90",
        "100",
      ])
    ).toBeGreaterThan(0.5);
  });

  test("less preference - accepting lower values", () => {
    const personA: QuestionResponse = {
      ownAnswer: 80,
      preference: { type: "less", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: 30,
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // A wants B ≤ 80 → yes
    expect(
      directionalLikert(personA, personB, [
        "0",
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90",
        "100",
      ])
    ).toBeGreaterThan(0.3);
  });

  test("specific_values preference - age range match", () => {
    const personA: QuestionResponse = {
      ownAnswer: 25,
      preference: {
        type: "specific_values",
        value: { min: 23, max: 28 },
        doesntMatter: false,
      },
      importance: 4,
      dealbreaker: true,
    };
    const personB: QuestionResponse = {
      ownAnswer: 26,
      preference: {
        type: "specific_values",
        value: { min: 24, max: 30 },
        doesntMatter: false,
      },
      importance: 3,
      dealbreaker: false,
    };
    // A wants B in [23-28], B is 26 → yes; B wants A in [24-30], A is 25 → yes
    expect(
      directionalLikert(personA, personB, [
        "0",
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90",
        "100",
      ])
    ).toBe(1.0);
  });

  test("specific_values preference - age outside range", () => {
    const personA: QuestionResponse = {
      ownAnswer: 22,
      preference: {
        type: "specific_values",
        value: { min: 25, max: 30 },
        doesntMatter: false,
      },
      importance: 4,
      dealbreaker: true,
    };
    const personB: QuestionResponse = {
      ownAnswer: 32,
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // A wants B in [25-30], B is 32 → no
    expect(
      directionalLikert(personA, personB, [
        "0",
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90",
        "100",
      ])
    ).toBe(0.0);
  });
});

// ============================================
// TYPE H: Different Preference Similarity
// ============================================

describe("differentPreference", () => {
  test("different preference - dissimilar answers", () => {
    const personA: QuestionResponse = {
      ownAnswer: ["morning"],
      preference: { type: "different", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["night"],
      preference: { type: "different", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // Jaccard distance = 1 - 0 = 1.0 (completely different)
    expect(differentPreference(personA, personB)).toBe(1.0);
  });

  test("different preference - partial overlap", () => {
    const personA: QuestionResponse = {
      ownAnswer: ["morning", "afternoon"],
      preference: { type: "different", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["afternoon", "night"],
      preference: { type: "different", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // Jaccard = 1/3, distance = 0.67
    expect(differentPreference(personA, personB)).toBeCloseTo(0.67, 2);
  });

  test("different preference - identical answers (worst case)", () => {
    const personA: QuestionResponse = {
      ownAnswer: ["morning"],
      preference: { type: "different", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["morning"],
      preference: { type: "different", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // Jaccard = 1.0, distance = 0.0 (both want different but are same)
    expect(differentPreference(personA, personB)).toBe(0.0);
  });
});

// ============================================
// TYPE I: Special Case Similarity
// ============================================

describe("loveLangauges - Q21 Love Languages", () => {
  test("bidirectional match - receive matches show", () => {
    const personA: QuestionResponse = {
      ownAnswer: {
        show: ["words_of_affirmation"],
        receive: ["physical_touch"],
      },
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: {
        show: ["physical_touch"],
        receive: ["words_of_affirmation"],
      },
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    // A shows words → B receives words (1.0), B shows touch → A receives touch (1.0)
    expect(loveLangauges(personA, personB)).toBe(1.0);
  });

  test("partial match - one direction satisfied", () => {
    const personA: QuestionResponse = {
      ownAnswer: {
        show: ["words_of_affirmation"],
        receive: ["physical_touch"],
      },
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: { show: ["quality_time"], receive: ["words_of_affirmation"] },
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // A shows words → B receives words (1.0), B shows quality → A receives touch (0.0) → avg 0.5
    expect(loveLangauges(personA, personB)).toBeCloseTo(0.5, 2);
  });

  test("no match - incompatible languages", () => {
    const personA: QuestionResponse = {
      ownAnswer: {
        show: ["words_of_affirmation"],
        receive: ["physical_touch"],
      },
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: { show: ["quality_time"], receive: ["acts_of_service"] },
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    expect(loveLangauges(personA, personB)).toBe(0.0);
  });
});

describe("conflictResolution - Q25 Conflict Resolution", () => {
  test("compatible matrix - good pairing", () => {
    const personA: QuestionResponse = {
      ownAnswer: "direct_communication",
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "direct_communication",
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    // Direct + Direct = 1.0 (perfect compatibility)
    expect(conflictResolution(personA, personB)).toBe(1.0);
  });

  test("incompatible matrix - poor pairing", () => {
    const personA: QuestionResponse = {
      ownAnswer: "avoid_confrontation",
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "direct_communication",
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // Avoid + Direct = 0.3 (low compatibility)
    expect(conflictResolution(personA, personB)).toBeLessThan(0.5);
  });
});

describe("sleepSchedule - Q29 Political Views (Wildcard)", () => {
  test("wildcard flexible - accepts all", () => {
    const personA: QuestionResponse = {
      ownAnswer: "flexible",
      preference: { type: "similar", doesntMatter: false },
      importance: 1,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "conservative",
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    // "flexible" matches anything
    expect(
      sleepSchedule(personA, personB, ["early", "flexible", "night"])
    ).toBe(1.0);
  });

  test("specific views - exact match", () => {
    const personA: QuestionResponse = {
      ownAnswer: "liberal",
      preference: { type: "same", doesntMatter: false },
      importance: 4,
      dealbreaker: true,
    };
    const personB: QuestionResponse = {
      ownAnswer: "liberal",
      preference: { type: "same", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    expect(
      sleepSchedule(personA, personB, ["early", "flexible", "night"])
    ).toBe(1.0);
  });

  test("specific views - mismatch", () => {
    const personA: QuestionResponse = {
      ownAnswer: "liberal",
      preference: { type: "same", doesntMatter: false },
      importance: 4,
      dealbreaker: true,
    };
    const personB: QuestionResponse = {
      ownAnswer: "conservative",
      preference: { type: "same", doesntMatter: false },
      importance: 4,
      dealbreaker: true,
    };
    expect(
      sleepSchedule(personA, personB, ["early", "flexible", "night"])
    ).toBe(0.0);
  });
});

// ============================================
// Edge Cases
// ============================================

describe("Edge Cases", () => {
  test("undefined responses", () => {
    expect(categoricalExactMatch(undefined, undefined)).toBe(0);
  });

  test("missing ownAnswer", () => {
    const personA: QuestionResponse = {
      ownAnswer: undefined,
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: "man",
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false,
    };
    expect(categoricalExactMatch(personA, personB)).toBe(0);
  });

  test("empty arrays in multi-select", () => {
    const personA: QuestionResponse = {
      ownAnswer: [],
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    const personB: QuestionResponse = {
      ownAnswer: ["reading"],
      preference: { type: "similar", doesntMatter: false },
      importance: 2,
      dealbreaker: false,
    };
    expect(multiSelectJaccard(personA, personB)).toBe(0);
  });
});
