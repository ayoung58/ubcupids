/**
 * Q6 Religion with Semantic Similarity Tests
 *
 * Tests for semantic-aware religion matching that considers:
 * - Secular group: atheist, agnostic
 * - Flexible: spiritual_not_religious
 * - Specific religions
 */

import { describe, test, expect } from "vitest";
import { calculateSimilarity } from "../similarity";
import type { MatchingUser } from "../types";

function createMockUser(
  id: string,
  responses: Record<string, any>,
): MatchingUser {
  return {
    id,
    email: `${id}@test.com`,
    name: `User ${id}`,
    gender: "man",
    interestedInGenders: ["woman"],
    campus: "Vancouver",
    okMatchingDifferentCampus: true,
    responses: {
      q1: { answer: "man" },
      q2: { answer: ["woman"] },
      ...responses,
    },
    responseRecord: {} as any,
  };
}

describe("Q6: Religion with Semantic Similarity", () => {
  describe("Subset + Same Semantic Group (Secular)", () => {
    test("should return 0.9 for subset with 'same' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["atheist"],
          preference: "same",
          importance: "somewhat_important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["agnostic", "atheist"],
          preference: "same",
          importance: "not_important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(0.9);
    });

    test("should return 1.0 for subset with 'similar' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["atheist"],
          preference: "similar",
          importance: "somewhat_important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["agnostic", "atheist"],
          preference: "similar",
          importance: "not_important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(1.0);
    });
  });

  describe("Subset + Different Groups", () => {
    test("should return 0.7 for subset with different groups and 'same' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["atheist"],
          preference: "same",
          importance: "somewhat_important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["christian", "atheist"],
          preference: "same",
          importance: "not_important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(0.7);
    });

    test("should return 0.8 for subset with different groups and 'similar' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["atheist"],
          preference: "similar",
          importance: "somewhat_important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["christian", "atheist"],
          preference: "similar",
          importance: "not_important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(0.8);
    });
  });

  describe("Spiritual But Not Religious", () => {
    test("should return 0.5 for 'spiritual_not_religious' with 'same' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["spiritual_not_religious"],
          preference: "same",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["christian"],
          preference: "same",
          importance: "not_important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(0.5);
    });

    test("should return 0.8 for 'spiritual_not_religious' with 'similar' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["spiritual_not_religious"],
          preference: "similar",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["christian"],
          preference: "similar",
          importance: "not_important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(0.8);
    });
  });

  describe("No Overlap + Both Secular", () => {
    test("should return 0.3 for no overlap both secular with 'same' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["atheist"],
          preference: "same",
          importance: "somewhat_important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["agnostic"],
          preference: "same",
          importance: "not_important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(0.3);
    });

    test("should return 0.7 for no overlap both secular with 'similar' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["atheist"],
          preference: "similar",
          importance: "somewhat_important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["agnostic"],
          preference: "similar",
          importance: "not_important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(0.7);
    });
  });

  describe("Exact Match", () => {
    test("should return 1.0 for exact match with 'same' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["atheist"],
          preference: "same",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["atheist"],
          preference: "same",
          importance: "important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(1.0);
    });

    test("should return 1.0 for exact match with 'similar' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["christian", "catholic"],
          preference: "similar",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["christian", "catholic"],
          preference: "similar",
          importance: "important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(1.0);
    });
  });

  describe("No Overlap + Different Groups", () => {
    test("should return 0.0 for completely different religions with 'same' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["christian"],
          preference: "same",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["muslim"],
          preference: "same",
          importance: "important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(0.0);
    });

    test("should return 0.0 for completely different religions with 'similar' preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["christian"],
          preference: "similar",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["muslim"],
          preference: "similar",
          importance: "important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q6).toBe(0.0);
    });
  });

  describe("No Preference Specified", () => {
    test("should handle null preferences with semantic similarity", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["atheist"],
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["agnostic"],
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      // Both secular, no overlap, no preference → 0.5
      expect(similarities.q6).toBe(0.5);
    });

    test("should handle flexible with null preference", () => {
      const userA = createMockUser("a", {
        q6: {
          answer: ["spiritual_not_religious"],
        },
      });

      const userB = createMockUser("b", {
        q6: {
          answer: ["christian"],
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      // Flexible involved → 0.5
      expect(similarities.q6).toBe(0.5);
    });
  });
});
