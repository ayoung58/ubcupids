/**
 * Tests for ordinal question scoring (Q12)
 *
 * Q12 (Sexual Activity Expectations) uses ordinal options with same/similar preference
 */

import { describe, test, expect } from "vitest";
import { calculateQuestionSimilarity } from "../similarity";
import { MatchingUser } from "../types";

function createUser(id: string, responses: Record<string, any>): MatchingUser {
  return {
    userId: id,
    responses,
    genderIdentity: "woman",
    genderPreference: ["men"],
    age: 22,
    ageRange: { min: 20, max: 25 },
  };
}

describe("Q12: Sexual Activity Expectations (Ordinal)", () => {
  describe("Same preference", () => {
    test("should return 1.0 for exact match with 'same' preference", () => {
      const userA = createUser("a", {
        q12: { answer: "connection", preference: "same" },
      });
      const userB = createUser("b", {
        q12: { answer: "connection", preference: "same" },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "ordinal"
      );
      expect(similarity).toBe(1.0);
    });

    test("should return 0.0 for different values with 'same' preference", () => {
      const userA = createUser("a", {
        q12: { answer: "marriage", preference: "same" },
      });
      const userB = createUser("b", {
        q12: { answer: "early_on", preference: "same" },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "ordinal"
      );
      expect(similarity).toBe(0.0);
    });

    test("should handle mixed preferences (one same, one similar)", () => {
      const userA = createUser("a", {
        q12: { answer: "connection", preference: "same" },
      });
      const userB = createUser("b", {
        q12: { answer: "serious_commitment", preference: "similar" },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "ordinal"
      );
      // A wants same but doesn't get it: 0.0
      // B wants similar and gets distance 1 (connection=3, serious_commitment=2): 1 - 1/3 = 0.67
      // Average: (0.0 + 0.67) / 2 = 0.335
      expect(similarity).toBeCloseTo(0.335, 2);
    });
  });

  describe("Similar preference", () => {
    test("should return 1.0 for adjacent values", () => {
      const userA = createUser("a", {
        q12: { answer: "serious_commitment", preference: "similar" },
      });
      const userB = createUser("b", {
        q12: { answer: "connection", preference: "similar" },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "ordinal"
      );
      // Both want similar
      // Distance: |2-3| = 1, max range = 3
      // Similarity: 1 - 1/3 = 0.67
      expect(similarity).toBeCloseTo(0.67, 2);
    });

    test("should return ~0.33 for two steps apart", () => {
      const userA = createUser("a", {
        q12: { answer: "marriage", preference: "similar" },
      });
      const userB = createUser("b", {
        q12: { answer: "connection", preference: "similar" },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "ordinal"
      );
      // Distance: |1-3| = 2, max range = 3
      // Similarity: 1 - 2/3 = 0.33
      expect(similarity).toBeCloseTo(0.33, 2);
    });

    test("should return 0.0 for opposite ends", () => {
      const userA = createUser("a", {
        q12: { answer: "marriage", preference: "similar" },
      });
      const userB = createUser("b", {
        q12: { answer: "early_on", preference: "similar" },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "ordinal"
      );
      // Distance: |1-4| = 3, max range = 3
      // Similarity: 1 - 3/3 = 0.0
      expect(similarity).toBe(0.0);
    });

    test("should return 1.0 for exact match with 'similar' preference", () => {
      const userA = createUser("a", {
        q12: { answer: "connection", preference: "similar" },
      });
      const userB = createUser("b", {
        q12: { answer: "connection", preference: "similar" },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "ordinal"
      );
      // Distance: 0, Similarity: 1.0
      expect(similarity).toBe(1.0);
    });
  });

  describe("Edge cases", () => {
    test("should handle prefer_not_to_answer gracefully", () => {
      const userA = createUser("a", {
        q12: { answer: "connection", preference: "similar" },
      });
      const userB = createUser("b", {
        q12: { answer: "prefer_not_to_answer", preference: "similar" },
      });

      const similarity = calculateQuestionSimilarity(
        "q12",
        userA,
        userB,
        "ordinal"
      );
      // Should return neutral score for prefer_not_to_answer
      expect(similarity).toBe(0.5);
    });
  });
});

describe("Q14: Faculty (Multi-select)", () => {
  test("should return 1.0 for identical selections", () => {
    const userA = createUser("a", {
      q14: { answer: ["science", "engineering"] },
    });
    const userB = createUser("b", {
      q14: { answer: ["science", "engineering"] },
    });

    const similarity = calculateQuestionSimilarity(
      "q14",
      userA,
      userB,
      "multi-select"
    );
    expect(similarity).toBe(1.0);
  });

  test("should calculate Jaccard similarity for partial overlap", () => {
    const userA = createUser("a", {
      q14: { answer: ["science", "engineering"] },
    });
    const userB = createUser("b", {
      q14: { answer: ["science", "arts"] },
    });

    const similarity = calculateQuestionSimilarity(
      "q14",
      userA,
      userB,
      "multi-select"
    );
    // Intersection: [science] = 1
    // Union: [science, engineering, arts] = 3
    // Jaccard: 1/3 = 0.33
    expect(similarity).toBeCloseTo(0.33, 2);
  });

  test("should return 0.0 for no overlap", () => {
    const userA = createUser("a", {
      q14: { answer: ["science"] },
    });
    const userB = createUser("b", {
      q14: { answer: ["arts"] },
    });

    const similarity = calculateQuestionSimilarity(
      "q14",
      userA,
      userB,
      "multi-select"
    );
    expect(similarity).toBe(0.0);
  });

  test("should handle single selection correctly", () => {
    const userA = createUser("a", {
      q14: { answer: ["science"] },
    });
    const userB = createUser("b", {
      q14: { answer: ["science"] },
    });

    const similarity = calculateQuestionSimilarity(
      "q14",
      userA,
      userB,
      "multi-select"
    );
    expect(similarity).toBe(1.0);
  });
});
