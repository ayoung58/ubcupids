/**
 * Unit Tests - Phase 3: Importance Weighting
 *
 * Tests importance multiplier logic
 */

import { describe, test, expect } from "vitest";
import {
  applyImportanceWeighting,
  applyNoImportanceWeighting,
} from "../importance";

describe("Phase 3: Importance Weighting", () => {
  describe("applyImportanceWeighting", () => {
    test("should amplify score when both have VERY_IMPORTANT (2.0)", () => {
      const result = applyImportanceWeighting(0.8, 2.0, 2.0);
      expect(result.userAWeighted).toBe(1.6); // 0.8 × 2.0
      expect(result.userBWeighted).toBe(1.6);
      expect(result.averageWeighted).toBe(1.6);
    });

    test("should zero out score when both have NOT_IMPORTANT (0)", () => {
      const result = applyImportanceWeighting(0.8, 0, 0);
      expect(result.userAWeighted).toBe(0); // 0.8 × 0
      expect(result.userBWeighted).toBe(0);
      expect(result.averageWeighted).toBe(0);
    });

    test("should average when importances differ", () => {
      const result = applyImportanceWeighting(0.8, 2.0, 0.5);
      expect(result.userAWeighted).toBeCloseTo(1.6, 2); // 0.8 × 2.0
      expect(result.userBWeighted).toBeCloseTo(0.4, 2); // 0.8 × 0.5
      expect(result.averageWeighted).toBeCloseTo(1.0, 2); // (1.6 + 0.4) / 2
    });

    test("should use SOMEWHAT_IMPORTANT (0.5) when not provided", () => {
      const result = applyImportanceWeighting(0.6, undefined, undefined);
      expect(result.userAWeighted).toBe(0.3); // 0.6 × 0.5
      expect(result.userBWeighted).toBe(0.3);
      expect(result.averageWeighted).toBe(0.3);
    });

    test("should handle mixed defined/undefined importance", () => {
      const result = applyImportanceWeighting(0.5, 1.0, undefined);
      expect(result.userAWeighted).toBe(0.5); // 0.5 × 1.0
      expect(result.userBWeighted).toBe(0.25); // 0.5 × 0.5 (default)
      expect(result.averageWeighted).toBe(0.375);
    });

    test("should clamp importance above 2.0", () => {
      const result = applyImportanceWeighting(0.6, 10, 2.0);
      expect(result.userAWeighted).toBe(1.2); // Clamped to 2.0
      expect(result.userBWeighted).toBe(1.2);
      expect(result.averageWeighted).toBe(1.2);
    });

    test("should clamp importance below 0", () => {
      const result = applyImportanceWeighting(0.6, -1, 0.5);
      expect(result.userAWeighted).toBe(0); // Clamped to 0
      expect(result.userBWeighted).toBe(0.3);
      expect(result.averageWeighted).toBe(0.15);
    });

    test("should handle zero similarity", () => {
      const result = applyImportanceWeighting(0.0, 2.0, 2.0);
      expect(result.userAWeighted).toBe(0.0);
      expect(result.userBWeighted).toBe(0.0);
      expect(result.averageWeighted).toBe(0.0);
    });

    test("should handle perfect similarity with IMPORTANT (1.0)", () => {
      const result = applyImportanceWeighting(1.0, 1.0, 1.0);
      expect(result.userAWeighted).toBe(1.0); // 1.0 × 1.0
      expect(result.userBWeighted).toBe(1.0);
      expect(result.averageWeighted).toBe(1.0);
    });
  });

  describe("applyNoImportanceWeighting", () => {
    test("should return raw similarity unchanged", () => {
      const result = applyNoImportanceWeighting(0.75);
      expect(result.userAWeighted).toBe(0.75);
      expect(result.userBWeighted).toBe(0.75);
      expect(result.averageWeighted).toBe(0.75);
    });

    test("should work with zero similarity", () => {
      const result = applyNoImportanceWeighting(0.0);
      expect(result.userAWeighted).toBe(0.0);
      expect(result.userBWeighted).toBe(0.0);
      expect(result.averageWeighted).toBe(0.0);
    });

    test("should work with perfect similarity", () => {
      const result = applyNoImportanceWeighting(1.0);
      expect(result.userAWeighted).toBe(1.0);
      expect(result.userBWeighted).toBe(1.0);
      expect(result.averageWeighted).toBe(1.0);
    });
  });
});
