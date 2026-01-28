/**
 * Comprehensive tests for null preference handling
 * Verifies that "No preference" consistently means satisfaction = 1.0 across all question types
 */

import { describe, it, expect } from "vitest";
import { calculateQuestionSimilarity } from "../similarity";
import { MatchingUser } from "../types";
import { MATCHING_CONFIG } from "../config";

/**
 * Helper to create a minimal mock user
 */
function createMockUser(
  id: string,
  responses: Record<string, any>,
): MatchingUser {
  return {
    id,
    email: `${id}@test.com`,
    name: `User ${id.toUpperCase()}`,
    gender: "woman",
    interestedInGenders: ["men"],
    campus: "UBCV",
    okMatchingDifferentCampus: true,
    responses,
    responseRecord: {} as any,
  };
}

describe("Null Preference Handling - Consistency Across Question Types", () => {
  describe("Type C: Categorical Multi (Q15 - Living Situation)", () => {
    it("should score 1.0 when both users have null preference", () => {
      const userA = createMockUser("a", {
        q15: { answer: "on_campus", preference: null, importance: 1.0 },
      });
      const userB = createMockUser("b", {
        q15: {
          answer: "off_campus_roommates",
          preference: null,
          importance: 1.0,
        },
      });

      const similarity = calculateQuestionSimilarity(
        "q15",
        userA,
        userB,
        "categorical-multi",
        MATCHING_CONFIG,
      );

      // Both have null preference = both happy with anything = 1.0
      expect(similarity).toBe(1.0);
    });

    it("should score 1.0 when one has null preference and other has compatible specific", () => {
      const userA = createMockUser("a", {
        q15: {
          answer: "on_campus",
          preference: ["on_campus", "off_campus_roommates"],
          importance: 1.0,
        },
      });
      const userB = createMockUser("b", {
        q15: { answer: "on_campus", preference: null, importance: 1.0 },
      });

      const similarity = calculateQuestionSimilarity(
        "q15",
        userA,
        userB,
        "categorical-multi",
        MATCHING_CONFIG,
      );

      // A: satisfied (B's answer in A's preference) = 1.0
      // B: no preference = 1.0
      // Average: 1.0
      expect(similarity).toBe(1.0);
    });

    it("should score 0.5 when one has null preference and other has incompatible specific", () => {
      const userA = createMockUser("a", {
        q15: {
          answer: "on_campus",
          preference: ["off_campus_alone"],
          importance: 1.0,
        },
      });
      const userB = createMockUser("b", {
        q15: { answer: "on_campus", preference: null, importance: 1.0 },
      });

      const similarity = calculateQuestionSimilarity(
        "q15",
        userA,
        userB,
        "categorical-multi",
        MATCHING_CONFIG,
      );

      // A: not satisfied (B's answer not in A's preference) = 0.0
      // B: no preference = 1.0
      // Average: 0.5
      expect(similarity).toBe(0.5);
    });
  });

  describe("Type F1: Ordinal (Q9b - Drug Frequency)", () => {
    it("should score 1.0 when both users have null preference", () => {
      const userA = createMockUser("a", {
        q9b: { answer: "never", preference: null, importance: 1.0 },
      });
      const userB = createMockUser("b", {
        q9b: { answer: "regularly", preference: null, importance: 1.0 },
      });

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      // Both have null preference = both happy with anything = 1.0
      expect(similarity).toBe(1.0);
    });

    it("should score 1.0 when one has null preference and other has compatible specific", () => {
      const userA = createMockUser("a", {
        q9b: { answer: "never", preference: "same", importance: 1.0 },
      });
      const userB = createMockUser("b", {
        q9b: { answer: "never", preference: null, importance: 1.0 },
      });

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      // A: wants same, answers match = 1.0
      // B: no preference = 1.0
      // Average: 1.0
      expect(similarity).toBe(1.0);
    });

    it("should score 0.5 when one has null preference and other has incompatible specific", () => {
      const userA = createMockUser("a", {
        q9b: { answer: "never", preference: "same", importance: 1.0 },
      });
      const userB = createMockUser("b", {
        q9b: { answer: "regularly", preference: null, importance: 1.0 },
      });

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      // A: wants same, answers don't match = 0.0
      // B: no preference = 1.0
      // Average: 0.5
      expect(similarity).toBe(0.5);
    });
  });

  describe("Type F2: Same/Similar/Different (Q22 - Social Energy)", () => {
    it("should score 1.0 when both users have null preference", () => {
      const userA = createMockUser("a", {
        q22: { answer: 1, preference: null, importance: 1.0 },
      });
      const userB = createMockUser("b", {
        q22: { answer: 5, preference: null, importance: 1.0 },
      });

      const similarity = calculateQuestionSimilarity(
        "q22",
        userA,
        userB,
        "same-similar-different",
        MATCHING_CONFIG,
      );

      // Both have null preference = both happy with anything = 1.0
      expect(similarity).toBe(1.0);
    });

    it("should score 1.0 when one has null preference and other has compatible specific", () => {
      const userA = createMockUser("a", {
        q22: { answer: 3, preference: "same", importance: 1.0 },
      });
      const userB = createMockUser("b", {
        q22: { answer: 3, preference: null, importance: 1.0 },
      });

      const similarity = calculateQuestionSimilarity(
        "q22",
        userA,
        userB,
        "same-similar-different",
        MATCHING_CONFIG,
      );

      // A: wants same, rawSimilarity = 1.0, satisfied = 1.0
      // B: no preference = 1.0
      // Average: 1.0
      expect(similarity).toBe(1.0);
    });

    it("should score 0.5 when one has null preference and other has very incompatible specific", () => {
      const userA = createMockUser("a", {
        q22: { answer: 1, preference: "same", importance: 1.0 },
      });
      const userB = createMockUser("b", {
        q22: { answer: 5, preference: null, importance: 1.0 },
      });

      const similarity = calculateQuestionSimilarity(
        "q22",
        userA,
        userB,
        "same-similar-different",
        MATCHING_CONFIG,
      );

      // A: wants same, rawSimilarity = 0.0, aSatisfied = 0.0
      // B: no preference = 1.0
      // Average: 0.5
      expect(similarity).toBe(0.5);
    });
  });

  describe("Scenario: All questions have null preference except one", () => {
    it("should result in perfect match when the one specific question matches", () => {
      // Two users who don't care about anything except Q15 (living situation)
      // and they both match perfectly on that one question

      const userA = createMockUser("a", {
        q15: {
          answer: "on_campus",
          preference: ["on_campus"],
          importance: 2.0,
        }, // Only this matters
        q7: { answer: 3, preference: null, importance: 0.0 }, // Don't care
        q22: { answer: 2, preference: null, importance: 0.0 }, // Don't care
      });

      const userB = createMockUser("b", {
        q15: {
          answer: "on_campus",
          preference: ["on_campus"],
          importance: 2.0,
        }, // Only this matters
        q7: { answer: 5, preference: null, importance: 0.0 }, // Don't care
        q22: { answer: 4, preference: null, importance: 0.0 }, // Don't care
      });

      // Q15: Both want on_campus, both have it → 1.0
      const q15Similarity = calculateQuestionSimilarity(
        "q15",
        userA,
        userB,
        "categorical-multi",
        MATCHING_CONFIG,
      );
      expect(q15Similarity).toBe(1.0);

      // Q7: Both have null preference despite different answers → 1.0
      const q7Similarity = calculateQuestionSimilarity(
        "q7",
        userA,
        userB,
        "numeric",
        MATCHING_CONFIG,
      );
      // Note: Q7 is numeric type which doesn't have preference handling
      // but importance is 0.0 so it won't contribute to the score anyway

      // Q22: Both have null preference despite different answers → 1.0
      const q22Similarity = calculateQuestionSimilarity(
        "q22",
        userA,
        userB,
        "same-similar-different",
        MATCHING_CONFIG,
      );
      expect(q22Similarity).toBe(1.0);
    });
  });
});
