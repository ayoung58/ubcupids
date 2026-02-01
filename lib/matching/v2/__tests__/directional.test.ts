/**
 * Unit Tests - Phase 4: Directional Scoring
 *
 * Tests α/β multiplier logic for directional preferences
 */

import { describe, test, expect } from "vitest";
import { applyDirectionalScoring } from "../directional";
import { MATCHING_CONFIG } from "../config";

describe("Phase 4: Directional Scoring", () => {
  const baseWeightedSimilarity = 0.8;
  const alpha = MATCHING_CONFIG.ALPHA; // 1.0
  const beta = MATCHING_CONFIG.BETA; // 0.7

  describe("Preference: more", () => {
    test("should apply α when partner has more", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        2, // userA answer
        4, // userB answer (higher)
        "more", // userA preference
        undefined,
      );

      expect(result.userAMultiplier).toBe(alpha);
      expect(result.userAFinal).toBe(0.8); // 0.8 × 1.0
    });

    test("should apply 0.0 when partner has less", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        4, // userA answer
        2, // userB answer (lower)
        "more", // userA preference
        undefined,
      );

      expect(result.userAMultiplier).toBe(0.0);
      expect(result.userAFinal).toBe(0.0); // 0.8 × 0.0
    });

    test("should apply 0.0 when partner has same", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        3,
        3,
        "more",
        undefined,
      );

      expect(result.userAMultiplier).toBe(0.0); // Equal doesn't satisfy 'more' preference
      expect(result.userAFinal).toBe(0.0); // 0.8 × 0.0
    });
  });

  describe("Preference: less", () => {
    test("should apply α when partner has less", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        4, // userA answer
        2, // userB answer (lower)
        "less", // userA preference
        undefined,
      );

      expect(result.userAMultiplier).toBe(alpha);
      expect(result.userAFinal).toBe(0.8);
    });

    test("should apply 0.0 when partner has more", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        2, // userA answer
        4, // userB answer (higher)
        "less", // userA preference
        undefined,
      );

      expect(result.userAMultiplier).toBe(0.0);
      expect(result.userAFinal).toBe(0.0);
    });

    test("should apply 0.0 when partner has same", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        3,
        3,
        "less",
        undefined,
      );

      expect(result.userAMultiplier).toBe(0.0); // Equal doesn't satisfy 'less' preference
      expect(result.userAFinal).toBe(0.0); // 0.8 × 0.0
    });
  });

  describe("Preference: similar", () => {
    test("should apply α when difference is ±1", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        3,
        4, // Difference of 1
        "similar",
        undefined,
      );

      expect(result.userAMultiplier).toBe(alpha);
      expect(result.userAFinal).toBe(0.8);
    });

    test("should apply α when difference is 0", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        3,
        3, // Exact match
        "similar",
        undefined,
      );

      expect(result.userAMultiplier).toBe(alpha);
      expect(result.userAFinal).toBe(0.8);
    });

    test("should apply 1.0 when difference is 2", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        2,
        4, // Difference of 2
        "similar",
        undefined,
      );

      expect(result.userAMultiplier).toBe(1.0);
      expect(result.userAFinal).toBe(0.8);
    });

    test("should apply 0.0 when difference is 3 or more", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        1,
        5, // Difference of 4
        "similar",
        undefined,
      );

      expect(result.userAMultiplier).toBe(0.0);
      expect(result.userAFinal).toBe(0.0);
    });
  });

  describe("Preference: same", () => {
    test("should apply α when answers are identical", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        3,
        3,
        "same",
        undefined,
      );

      expect(result.userAMultiplier).toBe(alpha);
      expect(result.userAFinal).toBe(0.8);
    });

    test("should apply 1.0 when difference is 1", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        3,
        4,
        "same",
        undefined,
      );

      expect(result.userAMultiplier).toBe(1.0);
      expect(result.userAFinal).toBe(0.8);
    });

    test("should apply 0.0 when difference is 2 or more", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        2,
        5,
        "same",
        undefined,
      );

      expect(result.userAMultiplier).toBe(0.0);
      expect(result.userAFinal).toBe(0.0);
    });
  });

  describe("No preference", () => {
    test("should apply 1.0 when no preference specified", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        2,
        5,
        undefined,
        undefined,
      );

      expect(result.userAMultiplier).toBe(1.0);
      expect(result.userBMultiplier).toBe(1.0);
      expect(result.averageFinal).toBe(1.0); // Both null preference = flexible, score 1.0
    });
  });

  describe("Asymmetric preferences", () => {
    test("should handle different preferences for each user", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        2, // userA answer
        4, // userB answer
        "more", // userA wants more (aligned: B > A)
        "less", // userB wants less (aligned: A < B)
      );

      expect(result.userAMultiplier).toBe(alpha); // A gets boost (B has more)
      expect(result.userBMultiplier).toBe(alpha); // B gets boost (A has less)
      expect(result.averageFinal).toBe(0.8); // Both aligned
    });

    test("should handle conflicting preferences", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        4, // userA answer
        2, // userB answer
        "more", // userA wants more (conflict: B < A)
        "more", // userB wants more (aligned: A > B)
      );

      expect(result.userAMultiplier).toBe(0.0); // A gets 0 (B has less)
      expect(result.userBMultiplier).toBe(alpha); // B gets boost (A has more)
      expect(result.averageFinal).toBeCloseTo((0.0 + 0.8) / 2, 2); // Mixed
    });
  });

  describe("Custom config", () => {
    test("should use custom α and β values", () => {
      const customConfig = {
        ...MATCHING_CONFIG,
        ALPHA: 1.2,
        BETA: 0.5,
      };

      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        2,
        4,
        "more",
        undefined,
        customConfig,
      );

      expect(result.userAMultiplier).toBe(1.2); // Custom α
      expect(result.userAFinal).toBe(0.96); // 0.8 × 1.2
    });
  });

  describe("Edge cases", () => {
    test("should handle zero weighted similarity", () => {
      const result = applyDirectionalScoring(0.0, 2, 4, "more", undefined);

      expect(result.userAFinal).toBe(0.0); // 0.0 × 1.0 = 0.0
      expect(result.userBFinal).toBe(1.0); // B has no preference, score = 1.0
      expect(result.averageFinal).toBe(0.5); // (0.0 + 1.0) / 2
    });

    test("should handle perfect weighted similarity", () => {
      const result = applyDirectionalScoring(1.0, 2, 4, "more", undefined);

      expect(result.userAFinal).toBe(1.0); // 1.0 × 1.0
      expect(result.averageFinal).toBe(1.0);
    });
  });

  describe("Null preference handling", () => {
    test("should set score to 1.0 for user with null preference (far apart answers)", () => {
      const result = applyDirectionalScoring(
        0.0, // raw similarity is 0 (answers far apart)
        1, // userA answer
        5, // userB answer
        null, // userA has no preference (flexible)
        "more", // userB wants more
      );

      // User A has null preference - should get 1.0 regardless of raw similarity
      expect(result.userAFinal).toBe(1.0);
      // User B wants "more", partner has 1 which is < 5, so conflict (β)
      expect(result.userBFinal).toBe(0.0); // 0.0 × 0.7 = 0.0
      expect(result.averageFinal).toBe(0.5); // (1.0 + 0.0) / 2
    });

    test("should handle case where one wants more but partner has less", () => {
      const result = applyDirectionalScoring(
        0.75, // raw similarity (3 vs 4, distance 1)
        3, // userA answer
        4, // userB answer
        null, // userA has no preference
        "more", // userB wants partner > 4
      );

      // User A has null preference - always satisfied
      expect(result.userAFinal).toBe(1.0);
      // User B wants "more" (wants partner > 4), partner is 3 (< 4), conflict
      expect(result.userBMultiplier).toBe(0.0);
      expect(result.userBFinal).toBe(0.0); // 0.75 × 0.0
      expect(result.averageFinal).toBeCloseTo(0.5, 2); // (1.0 + 0.0) / 2
    });

    test("should handle both users with null preference", () => {
      const result = applyDirectionalScoring(
        0.0, // even if raw similarity is 0
        1,
        5,
        null, // both flexible
        null,
      );

      expect(result.userAFinal).toBe(1.0);
      expect(result.userBFinal).toBe(1.0);
      expect(result.averageFinal).toBe(1.0); // Both satisfied
    });

    test("should handle specific preference with null partner", () => {
      const result = applyDirectionalScoring(
        0.5,
        2, // userA answer
        4, // userB answer
        "more", // userA wants more
        null, // userB has no preference
      );

      // User A wants "more", partner is 4 (> 2), aligned (α)
      expect(result.userAMultiplier).toBe(alpha);
      expect(result.userAFinal).toBe(0.5); // 0.5 × 1.0
      // User B has no preference - always satisfied
      expect(result.userBFinal).toBe(1.0);
      expect(result.averageFinal).toBe(0.75); // (0.5 + 1.0) / 2
    });
  });
});
