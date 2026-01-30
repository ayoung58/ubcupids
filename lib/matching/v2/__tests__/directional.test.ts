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

    test("should apply β when partner has less", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        4, // userA answer
        2, // userB answer (lower)
        "more", // userA preference
        undefined,
      );

      expect(result.userAMultiplier).toBe(beta);
      expect(result.userAFinal).toBeCloseTo(0.56, 2); // 0.8 × 0.7
    });

    test("should apply β when partner has same", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        3,
        3,
        "more",
        undefined,
      );

      expect(result.userAMultiplier).toBe(beta); // Equal doesn't satisfy 'more' preference
      expect(result.userAFinal).toBeCloseTo(0.56, 2); // 0.8 × 0.7
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

    test("should apply β when partner has more", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        2, // userA answer
        4, // userB answer (higher)
        "less", // userA preference
        undefined,
      );

      expect(result.userAMultiplier).toBe(beta);
      expect(result.userAFinal).toBeCloseTo(0.56, 2);
    });

    test("should apply β when partner has same", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        3,
        3,
        "less",
        undefined,
      );

      expect(result.userAMultiplier).toBe(beta); // Equal doesn't satisfy 'less' preference
      expect(result.userAFinal).toBeCloseTo(0.56, 2); // 0.8 × 0.7
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

    test("should apply β when difference is 3 or more", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        1,
        5, // Difference of 4
        "similar",
        undefined,
      );

      expect(result.userAMultiplier).toBe(beta);
      expect(result.userAFinal).toBeCloseTo(0.56, 2);
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

    test("should apply β when difference is 2 or more", () => {
      const result = applyDirectionalScoring(
        baseWeightedSimilarity,
        2,
        5,
        "same",
        undefined,
      );

      expect(result.userAMultiplier).toBe(beta);
      expect(result.userAFinal).toBeCloseTo(0.56, 2);
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
      expect(result.averageFinal).toBe(0.8);
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

      expect(result.userAMultiplier).toBe(beta); // A gets penalty (B has less)
      expect(result.userBMultiplier).toBe(alpha); // B gets boost (A has more)
      expect(result.averageFinal).toBeCloseTo((0.56 + 0.8) / 2, 2); // Mixed
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

      expect(result.userAFinal).toBe(0.0);
      expect(result.userBFinal).toBe(0.0);
      expect(result.averageFinal).toBe(0.0);
    });

    test("should handle perfect weighted similarity", () => {
      const result = applyDirectionalScoring(1.0, 2, 4, "more", undefined);

      expect(result.userAFinal).toBe(1.0); // 1.0 × 1.0
      expect(result.averageFinal).toBe(1.0);
    });
  });
});
