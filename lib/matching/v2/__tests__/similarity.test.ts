/**
 * Unit Tests - Phase 2: Similarity Calculation (Types A-H)
 *
 * Tests all 8 similarity calculation types
 */

import { describe, test, expect } from "vitest";
import { calculateQuestionSimilarity } from "../similarity";
import { MatchingUser } from "../types";

/**
 * Helper to create a mock user with specific response
 */
function createUser(id: string, responses: Record<string, any>): MatchingUser {
  return {
    id,
    email: `${id}@test.com`,
    name: id,
    gender: "man",
    interestedInGenders: ["woman"],
    responses,
    responseRecord: {} as any,
  };
}

describe("Phase 2: Similarity Calculation", () => {
  describe("Type A: Numeric (Likert)", () => {
    test("should return 1.0 for identical answers", () => {
      const userA = createUser("a", { q1: { answer: 3 } });
      const userB = createUser("b", { q1: { answer: 3 } });

      const similarity = calculateQuestionSimilarity(
        "q1",
        userA,
        userB,
        "numeric"
      );
      expect(similarity).toBe(1.0);
    });

    test("should return 0.5 for 2-point difference on 5-point scale", () => {
      const userA = createUser("a", { q1: { answer: 2 } });
      const userB = createUser("b", { q1: { answer: 4 } });

      const similarity = calculateQuestionSimilarity(
        "q1",
        userA,
        userB,
        "numeric"
      );
      expect(similarity).toBe(0.5);
    });

    test("should return 0.0 for maximum difference", () => {
      const userA = createUser("a", { q1: { answer: 1 } });
      const userB = createUser("b", { q1: { answer: 5 } });

      const similarity = calculateQuestionSimilarity(
        "q1",
        userA,
        userB,
        "numeric"
      );
      expect(similarity).toBe(0.0);
    });

    test("should return 0.75 for 1-point difference", () => {
      const userA = createUser("a", { q1: { answer: 3 } });
      const userB = createUser("b", { q1: { answer: 4 } });

      const similarity = calculateQuestionSimilarity(
        "q1",
        userA,
        userB,
        "numeric"
      );
      expect(similarity).toBe(0.75);
    });
  });

  describe("Type B: Categorical Same", () => {
    test("should return 1.0 when answers match", () => {
      const userA = createUser("a", { q11: { answer: "monogamous" } });
      const userB = createUser("b", { q11: { answer: "monogamous" } });

      const similarity = calculateQuestionSimilarity(
        "q11",
        userA,
        userB,
        "categorical-same"
      );
      expect(similarity).toBe(1.0);
    });

    test("should return 0.0 when answers differ", () => {
      const userA = createUser("a", { q11: { answer: "monogamous" } });
      const userB = createUser("b", { q11: { answer: "open" } });

      const similarity = calculateQuestionSimilarity(
        "q11",
        userA,
        userB,
        "categorical-same"
      );
      expect(similarity).toBe(0.0);
    });
  });

  describe("Type C: Categorical Multi", () => {
    test("should return 1.0 when both preferences are satisfied", () => {
      const userA = createUser("a", {
        q12: { answer: "introverted", preference: ["introverted", "balanced"] },
      });
      const userB = createUser("b", {
        q12: { answer: "balanced", preference: ["introverted"] },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "categorical-multi"
      );
      expect(similarity).toBe(1.0);
    });

    test("should return 1.0 when both preferences are satisfied", () => {
      const userA = createUser("a", {
        q12: { answer: "introverted", preference: ["extroverted"] },
      });
      const userB = createUser("b", {
        q12: { answer: "extroverted", preference: ["introverted"] },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "categorical-multi"
      );
      expect(similarity).toBe(1.0);
    });

    test("should return 0.5 when only one preference is satisfied", () => {
      const userA = createUser("a", {
        q12: { answer: "introverted", preference: ["extroverted"] },
      });
      const userB = createUser("b", {
        q12: { answer: "extroverted", preference: ["extroverted"] },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "categorical-multi"
      );
      expect(similarity).toBe(0.5);
    });

    test("should return 1.0 when no preferences specified", () => {
      const userA = createUser("a", {
        q12: { answer: "introverted", preference: [] },
      });
      const userB = createUser("b", {
        q12: { answer: "extroverted", preference: [] },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "categorical-multi"
      );
      expect(similarity).toBe(1.0);
    });
  });

  describe("Type D: Multi-select (Jaccard)", () => {
    test("should return 1.0 for identical selections", () => {
      const userA = createUser("a", { q20: { answer: ["a", "b", "c"] } });
      const userB = createUser("b", { q20: { answer: ["a", "b", "c"] } });

      const similarity = calculateQuestionSimilarity(
        "q20",
        userA,
        userB,
        "multi-select"
      );
      expect(similarity).toBe(1.0);
    });

    test("should return 0.5 for 50% overlap", () => {
      const userA = createUser("a", { q20: { answer: ["a", "b", "c"] } });
      const userB = createUser("b", { q20: { answer: ["b", "c", "d"] } });

      const similarity = calculateQuestionSimilarity(
        "q20",
        userA,
        userB,
        "multi-select"
      );
      // Intersection: [b, c] = 2
      // Union: [a, b, c, d] = 4
      // Jaccard: 2/4 = 0.5
      expect(similarity).toBe(0.5);
    });

    test("should return 0.0 for no overlap", () => {
      const userA = createUser("a", { q20: { answer: ["a", "b"] } });
      const userB = createUser("b", { q20: { answer: ["c", "d"] } });

      const similarity = calculateQuestionSimilarity(
        "q20",
        userA,
        userB,
        "multi-select"
      );
      expect(similarity).toBe(0.0);
    });

    test("should return 1.0 when both are empty", () => {
      const userA = createUser("a", { q20: { answer: [] } });
      const userB = createUser("b", { q20: { answer: [] } });

      const similarity = calculateQuestionSimilarity(
        "q20",
        userA,
        userB,
        "multi-select"
      );
      expect(similarity).toBe(1.0);
    });
  });

  describe("Type E: Age", () => {
    test("should return 1.0 when both ages are within each other's ranges", () => {
      const userA = createUser("a", {
        q4: {
          answer: { age: 25 },
          preference: { minAge: 22, maxAge: 28 },
        },
      });
      const userB = createUser("b", {
        q4: {
          answer: { age: 26 },
          preference: { minAge: 24, maxAge: 30 },
        },
      });

      const similarity = calculateQuestionSimilarity("q4", userA, userB, "age");
      expect(similarity).toBe(1.0);
    });

    test("should return 0.5 when only one age is in range", () => {
      const userA = createUser("a", {
        q4: {
          answer: { age: 25 },
          preference: { minAge: 30, maxAge: 35 },
        },
      });
      const userB = createUser("b", {
        q4: {
          answer: { age: 35 },
          preference: { minAge: 20, maxAge: 24 },
        },
      });

      const similarity = calculateQuestionSimilarity("q4", userA, userB, "age");
      expect(similarity).toBe(0.5);
    });

    test("should return 0.0 when neither age is in range", () => {
      const userA = createUser("a", {
        q4: {
          answer: { age: 25 },
          preference: { minAge: 22, maxAge: 28 },
        },
      });
      const userB = createUser("b", {
        q4: {
          answer: { age: 30 },
          preference: { minAge: 20, maxAge: 24 },
        },
      });

      const similarity = calculateQuestionSimilarity("q4", userA, userB, "age");
      expect(similarity).toBe(0.0);
    });

    test("should return 1.0 when preference is 'doesn't matter'", () => {
      const userA = createUser("a", {
        q4: {
          answer: { age: 25 },
          preference: { doesntMatter: true },
        },
      });
      const userB = createUser("b", {
        q4: {
          answer: { age: 50 },
          preference: { doesntMatter: true },
        },
      });

      const similarity = calculateQuestionSimilarity("q4", userA, userB, "age");
      expect(similarity).toBe(1.0);
    });
  });

  describe("Type F: Same/Similar/Different", () => {
    test("should return 1.0 when both prefer 'same' and answers are identical", () => {
      const userA = createUser("a", {
        q5: { answer: 4, preference: "same" },
      });
      const userB = createUser("b", {
        q5: { answer: 4, preference: "same" },
      });

      const similarity = calculateQuestionSimilarity(
        "q5",
        userA,
        userB,
        "same-similar-different"
      );
      expect(similarity).toBeGreaterThanOrEqual(0.9); // High similarity for identical answers
    });

    test("should return high score when both prefer 'similar' and answers are close", () => {
      const userA = createUser("a", {
        q5: { answer: 3, preference: "similar" },
      });
      const userB = createUser("b", {
        q5: { answer: 4, preference: "similar" },
      });

      const similarity = calculateQuestionSimilarity(
        "q5",
        userA,
        userB,
        "same-similar-different"
      );
      expect(similarity).toBeGreaterThanOrEqual(0.5);
    });

    test("should return high score when both prefer 'different' and answers are far apart", () => {
      const userA = createUser("a", {
        q5: { answer: 1, preference: "different" },
      });
      const userB = createUser("b", {
        q5: { answer: 5, preference: "different" },
      });

      const similarity = calculateQuestionSimilarity(
        "q5",
        userA,
        userB,
        "same-similar-different"
      );
      expect(similarity).toBeGreaterThanOrEqual(0.8);
    });

    test("should return low score when preference conflicts with reality", () => {
      const userA = createUser("a", {
        q5: { answer: 1, preference: "same" },
      });
      const userB = createUser("b", {
        q5: { answer: 5, preference: "same" },
      });

      const similarity = calculateQuestionSimilarity(
        "q5",
        userA,
        userB,
        "same-similar-different"
      );
      expect(similarity).toBeLessThan(0.3);
    });
  });

  describe("Type G: Directional", () => {
    test("should calculate raw numeric similarity (α/β applied later)", () => {
      const userA = createUser("a", {
        q10: { answer: 2, preference: "more" },
      });
      const userB = createUser("b", {
        q10: { answer: 4, preference: "similar" },
      });

      const similarity = calculateQuestionSimilarity(
        "q10",
        userA,
        userB,
        "directional"
      );
      // 2-point difference on 5-point scale = 0.5
      expect(similarity).toBe(0.5);
    });

    test("should return 1.0 for identical answers", () => {
      const userA = createUser("a", {
        q10: { answer: 3, preference: "same" },
      });
      const userB = createUser("b", {
        q10: { answer: 3, preference: "more" },
      });

      const similarity = calculateQuestionSimilarity(
        "q10",
        userA,
        userB,
        "directional"
      );
      expect(similarity).toBe(1.0);
    });
  });

  describe("Type H: Binary", () => {
    test("should return 1.0 when both answer 'yes'", () => {
      const userA = createUser("a", { q8: { answer: "yes" } });
      const userB = createUser("b", { q8: { answer: "yes" } });

      const similarity = calculateQuestionSimilarity(
        "q8",
        userA,
        userB,
        "binary"
      );
      expect(similarity).toBe(1.0);
    });

    test("should return 1.0 when both answer 'no'", () => {
      const userA = createUser("a", { q8: { answer: "no" } });
      const userB = createUser("b", { q8: { answer: "no" } });

      const similarity = calculateQuestionSimilarity(
        "q8",
        userA,
        userB,
        "binary"
      );
      expect(similarity).toBe(1.0);
    });

    test("should return 0.0 when answers differ", () => {
      const userA = createUser("a", { q8: { answer: "yes" } });
      const userB = createUser("b", { q8: { answer: "no" } });

      const similarity = calculateQuestionSimilarity(
        "q8",
        userA,
        userB,
        "binary"
      );
      expect(similarity).toBe(0.0);
    });
  });

  describe("Missing responses", () => {
    test("should return 0.5 when either response is missing", () => {
      const userA = createUser("a", { q1: { answer: 3 } });
      const userB = createUser("b", {});

      const similarity = calculateQuestionSimilarity(
        "q1",
        userA,
        userB,
        "numeric"
      );
      expect(similarity).toBe(0.5);
    });
  });
});
