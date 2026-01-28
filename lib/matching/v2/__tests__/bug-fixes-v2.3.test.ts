/**
 * Tests for three bug fixes in v2.3:
 * 1. Q5 (multi-select): Null preferences should return 1.0
 * 2. Q26 (texting): "whatever_feels_natural" should be flexible
 * 3. Q32 (multi-select): "similar" preference should use proportional overlap
 */

import { describe, it, expect } from "vitest";
import { calculateSimilarity } from "../similarity";
import { MatchingUser } from "../types";

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

describe("Bug Fixes v2.3", () => {
  describe("Q5: Multi-select with null preferences", () => {
    it("should return 1.0 when both users have null preference (happy with anything)", () => {
      const userA = createMockUser("a", {
        q5: {
          answer: ["white"],
          preference: null,
          importance: "not_important",
        },
      });

      const userB = createMockUser("b", {
        q5: {
          answer: ["south_asian"],
          preference: null,
          importance: "not_important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q5).toBe(1.0);
    });

    it("should return 1.0 when one has null preference and one has specific preference", () => {
      const userA = createMockUser("a", {
        q5: {
          answer: ["white"],
          preference: null,
          importance: "not_important",
        },
      });

      const userB = createMockUser("b", {
        q5: {
          answer: ["south_asian"],
          preference: ["white", "south_asian"],
          importance: "important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      // A has no preference (1.0), B's preference includes A's answer (1.0)
      // Average: (1.0 + 1.0) / 2 = 1.0
      expect(similarities.q5).toBe(1.0);
    });
  });

  describe("Q26: Texting frequency with 'whatever_feels_natural'", () => {
    it("should return 1.0 when one user selects 'whatever_feels_natural'", () => {
      const userA = createMockUser("a", {
        q26: {
          answer: "frequent",
          preference: "similar",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q26: {
          answer: "whatever_feels_natural",
          preference: "similar",
          importance: "not_important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q26).toBe(1.0);
    });

    it("should return 1.0 when both users select 'whatever_feels_natural'", () => {
      const userA = createMockUser("a", {
        q26: {
          answer: "whatever_feels_natural",
          preference: "similar",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q26: {
          answer: "whatever_feels_natural",
          preference: "similar",
          importance: "important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q26).toBe(1.0);
    });

    it("should work normally when neither selects 'whatever_feels_natural'", () => {
      const userA = createMockUser("a", {
        q26: {
          answer: "frequent",
          preference: ["frequent", "constant"],
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q26: {
          answer: "frequent",
          preference: ["frequent", "moderate"],
          importance: "important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      expect(similarities.q26).toBe(1.0); // Both satisfied
    });
  });

  describe("Q32: Multi-select with 'similar' preference", () => {
    it("should use proportional overlap when preference is 'similar'", () => {
      const userA = createMockUser("a", {
        q32: {
          answer: [
            "flirting",
            "depends_on_context",
            "physical_intimacy",
            "emotional_intimacy",
            "online_interactions",
          ],
          preference: "similar",
          importance: "somewhat_important",
        },
      });

      const userB = createMockUser("b", {
        q32: {
          answer: ["depends_on_context", "physical_intimacy"],
          preference: "similar",
          importance: "somewhat_important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);

      // A's satisfaction: B selected 2 items, both are in A's list → 2/2 = 1.0
      // B's satisfaction: A selected 5 items, 2 are in B's list → 2/5 = 0.4
      // Average: (1.0 + 0.4) / 2 = 0.7
      expect(similarities.q32).toBe(0.7);
    });

    it("should return 1.0 when both select the same items with 'similar' preference", () => {
      const userA = createMockUser("a", {
        q32: {
          answer: ["physical_intimacy", "emotional_intimacy"],
          preference: "similar",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q32: {
          answer: ["physical_intimacy", "emotional_intimacy"],
          preference: "similar",
          importance: "important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      // Both select same 2 items
      // A's satisfaction: 2/2 = 1.0
      // B's satisfaction: 2/2 = 1.0
      // Average: 1.0
      expect(similarities.q32).toBe(1.0);
    });

    it("should return 0.0 when there is no overlap with 'similar' preference", () => {
      const userA = createMockUser("a", {
        q32: {
          answer: ["flirting", "online_interactions"],
          preference: "similar",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q32: {
          answer: ["physical_intimacy", "emotional_intimacy"],
          preference: "similar",
          importance: "important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      // No overlap: intersection = 0
      // Both get 0.0 satisfaction
      expect(similarities.q32).toBe(0.0);
    });

    it("should return 0.0 when preference is 'same' and items don't match exactly", () => {
      const userA = createMockUser("a", {
        q32: {
          answer: ["physical_intimacy", "emotional_intimacy", "flirting"],
          preference: "same",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q32: {
          answer: ["physical_intimacy", "emotional_intimacy"],
          preference: "same",
          importance: "important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      // Sets are different sizes, so not exact match
      expect(similarities.q32).toBe(0.0);
    });

    it("should return 1.0 when preference is 'same' and items match exactly", () => {
      const userA = createMockUser("a", {
        q32: {
          answer: ["physical_intimacy", "emotional_intimacy"],
          preference: "same",
          importance: "important",
        },
      });

      const userB = createMockUser("b", {
        q32: {
          answer: ["emotional_intimacy", "physical_intimacy"], // Same items, different order
          preference: "same",
          importance: "important",
        },
      });

      const similarities = calculateSimilarity(userA, userB);
      // Exact match (order doesn't matter for sets)
      expect(similarities.q32).toBe(1.0);
    });
  });
});
