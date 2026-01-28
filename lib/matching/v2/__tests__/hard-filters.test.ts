/**
 * Unit Tests - Phase 1: Hard Filters & Dealbreakers
 *
 * Tests gender compatibility and generic dealbreaker logic per V2.2
 */

import { describe, test, expect } from "vitest";
import { checkHardFilters } from "../hard-filters";
import { MatchingUser } from "../types";

/**
 * Helper to create a mock user for testing
 */
function createMockUser(
  id: string,
  gender: string,
  interestedInGenders: string[],
  responses: Record<string, any>,
): MatchingUser {
  return {
    id,
    email: `${id}@test.com`,
    name: id,
    gender,
    interestedInGenders,
    campus: "Vancouver",
    okMatchingDifferentCampus: true,
    responses,
    responseRecord: {} as any,
  };
}

describe("Phase 1: Hard Filters", () => {
  describe("Gender Compatibility", () => {
    test("should pass when both users are mutually interested", () => {
      const userA = createMockUser("a", "man", ["woman"], {});
      const userB = createMockUser("b", "woman", ["man"], {});

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });

    test("should fail when userA not interested in userB's gender", () => {
      const userA = createMockUser("a", "man", ["man"], {}); // Only interested in men
      const userB = createMockUser("b", "woman", ["man"], {});

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.reason).toBe("Gender incompatibility");
    });

    test("should fail when userB not interested in userA's gender", () => {
      const userA = createMockUser("a", "man", ["woman"], {});
      const userB = createMockUser("b", "woman", ["woman"], {}); // Only interested in women

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.reason).toBe("Gender incompatibility");
    });

    test("should pass with multiple interested genders", () => {
      const userA = createMockUser(
        "a",
        "non-binary",
        ["man", "woman", "non-binary"],
        {},
      );
      const userB = createMockUser("b", "woman", ["non-binary"], {});

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });
  });

  describe("Campus Compatibility", () => {
    test("should pass when both users are ok with different campus", () => {
      const userA: MatchingUser = {
        ...createMockUser("a", "man", ["woman"], {}),
        campus: "Vancouver",
        okMatchingDifferentCampus: true,
      };
      const userB: MatchingUser = {
        ...createMockUser("b", "woman", ["man"], {}),
        campus: "Okanagan",
        okMatchingDifferentCampus: true,
      };

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });

    test("should pass when both users are from same campus", () => {
      const userA: MatchingUser = {
        ...createMockUser("a", "man", ["woman"], {}),
        campus: "Vancouver",
        okMatchingDifferentCampus: false,
      };
      const userB: MatchingUser = {
        ...createMockUser("b", "woman", ["man"], {}),
        campus: "Vancouver",
        okMatchingDifferentCampus: false,
      };

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });

    test("should fail when userA not ok with different campus and campuses differ", () => {
      const userA: MatchingUser = {
        ...createMockUser("a", "man", ["woman"], {}),
        campus: "Vancouver",
        okMatchingDifferentCampus: false,
      };
      const userB: MatchingUser = {
        ...createMockUser("b", "woman", ["man"], {}),
        campus: "Okanagan",
        okMatchingDifferentCampus: true,
      };

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.reason).toBe("Campus incompatibility");
    });

    test("should fail when userB not ok with different campus and campuses differ", () => {
      const userA: MatchingUser = {
        ...createMockUser("a", "man", ["woman"], {}),
        campus: "Vancouver",
        okMatchingDifferentCampus: true,
      };
      const userB: MatchingUser = {
        ...createMockUser("b", "woman", ["man"], {}),
        campus: "Okanagan",
        okMatchingDifferentCampus: false,
      };

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.reason).toBe("Campus incompatibility");
    });

    test("should pass when one user ok with different campus and campuses differ", () => {
      const userA: MatchingUser = {
        ...createMockUser("a", "man", ["woman"], {}),
        campus: "Vancouver",
        okMatchingDifferentCampus: true,
      };
      const userB: MatchingUser = {
        ...createMockUser("b", "woman", ["man"], {}),
        campus: "Okanagan",
        okMatchingDifferentCampus: true,
      };

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });
  });

  describe("Age Compatibility", () => {
    test("should pass when both ages are within each other's ranges", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q4: { answer: 23, preference: { min: 20, max: 25 } },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q4: { answer: 22, preference: { min: 21, max: 26 } },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });

    test("should fail when userB age is outside userA's range", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q4: { answer: { userAge: 23, minAge: 23, maxAge: 27 } },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q4: { answer: { userAge: 20, minAge: 19, maxAge: 22 } },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.reason).toBe("Age incompatibility");
      expect(result.failedQuestions).toContain("q4");
    });

    test("should fail when userA age is outside userB's range", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q4: { answer: 30, preference: { min: 25, max: 35 } },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q4: { answer: 22, preference: { min: 18, max: 24 } },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.reason).toBe("Age incompatibility");
    });

    test("should handle combined format (userAge, minAge, maxAge)", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q4: { answer: { userAge: 21, minAge: 20, maxAge: 25 } },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q4: { answer: { userAge: 20, minAge: 19, maxAge: 21 } },
      });

      const result = checkHardFilters(userA, userB);
      // A (21) is in B's range (19-21) ✓
      // B (20) is in A's range (20-25) ✓
      expect(result.passed).toBe(true);
    });

    test("should pass when no age preferences specified", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q4: { answer: 23 }, // No preference
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q4: { answer: 40 },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });
  });

  describe("Q3 Sexual Orientation Dealbreaker", () => {
    test("should pass when both have same orientation with dealbreaker", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q3: {
          answer: "sexual_romantic",
          preference: "same",
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q3: { answer: "sexual_romantic", preference: "same" },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });

    test("should fail when userA has dealbreaker and orientations differ", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q3: {
          answer: "sexual_romantic",
          preference: "same",
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q3: { answer: "pansexual" },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.failedQuestions).toContain("q3");
    });

    test("should pass when orientations differ but no dealbreaker", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q3: { answer: "sexual_romantic", preference: "same", importance: 3 },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q3: { answer: "pansexual" },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });
  });

  describe("Q7 Political Leaning Dealbreaker", () => {
    test("should pass when both have similar political views", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q7: { answer: 2, preference: "similar", isDealbreaker: true },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q7: { answer: 2 },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });

    test("should fail when userA has dealbreaker for 'similar' and views are far apart", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q7: { answer: 1, preference: "similar", isDealbreaker: true },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q7: { answer: 5 },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.failedQuestions).toContain("q7");
    });

    test("should pass when close enough for 'similar' preference", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q7: { answer: 2, preference: "similar", isDealbreaker: true },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q7: { answer: 3 },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });
  });

  describe("Q8 Alcohol Consumption Dealbreaker", () => {
    test("should pass when match's drinking is in acceptable set", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q8: {
          answer: "socially",
          preference: ["never", "rarely", "socially"],
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q8: { answer: "rarely" },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });

    test("should fail when match's drinking is not in acceptable set", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q8: {
          answer: "never",
          preference: ["never", "rarely"],
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q8: { answer: "frequently" },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.failedQuestions).toContain("q8");
    });

    test("should pass when both abstain", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q8: { answer: "never", preference: ["never"], isDealbreaker: true },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q8: { answer: "never" },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });
  });

  describe("Generic Dealbreaker on Any Question", () => {
    test("should handle dealbreaker on relationship style (Q12)", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q12: {
          answer: "monogamous",
          preference: "same",
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q12: { answer: "open" },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.failedQuestions).toContain("q12");
    });

    test("should handle dealbreaker on field of study (Q15)", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q15: {
          answer: "science",
          preference: ["science", "engineering"],
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q15: { answer: "arts" },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.failedQuestions).toContain("q15");
    });

    test("should handle dealbreaker on ambition level (Q17)", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q17: {
          answer: 5,
          preference: "similar",
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q17: { answer: 1 }, // Very different ambition
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.failedQuestions).toContain("q17");
    });

    test("should pass when match satisfies dealbreaker preference", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q17: {
          answer: 4,
          preference: "similar",
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q17: { answer: 5 }, // Within 1 point = similar
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });
  });

  describe("Q9/Q10 Drug Use Dealbreaker (Compound Question)", () => {
    test("should handle drug use preferences with dealbreaker", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q9: {
          answer: ["none"],
          preference: ["none"],
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q9: { answer: ["cannabis"] },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.failedQuestions).toContain("q9");
    });

    test("should pass when drug use preferences align", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q9: {
          answer: ["cannabis"],
          preference: ["cannabis", "none"],
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q9: { answer: ["cannabis"] },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(true);
    });
  });

  describe("Multiple Dealbreakers", () => {
    test("should report all failed dealbreakers", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q3: {
          answer: "sexual_romantic",
          preference: "same",
          isDealbreaker: true,
        },
        q12: {
          answer: "monogamous",
          preference: "same",
          isDealbreaker: true,
        },
        q8: {
          answer: "never",
          preference: ["never"],
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q3: { answer: "pansexual" },
        q12: { answer: "open" },
        q8: { answer: "frequently" },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.failedQuestions).toHaveLength(3);
      expect(result.failedQuestions).toContain("q3");
      expect(result.failedQuestions).toContain("q12");
      expect(result.failedQuestions).toContain("q8");
    });
  });

  describe("Prefer Not to Answer Handling", () => {
    test("should fail when user has dealbreaker and match selected 'prefer not to answer'", () => {
      const userA = createMockUser("a", "man", ["woman"], {
        q3: {
          answer: "sexual_romantic",
          preference: "same",
          isDealbreaker: true,
        },
      });
      const userB = createMockUser("b", "woman", ["man"], {
        q3: { answer: "prefer-not-to-answer" },
      });

      const result = checkHardFilters(userA, userB);
      expect(result.passed).toBe(false);
      expect(result.failedQuestions).toContain("q3");
    });
  });
});
