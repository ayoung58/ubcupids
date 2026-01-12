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
    test("should not change score when both have max importance (5)", () => {
      const result = applyImportanceWeighting(0.8, 5, 5);
      expect(result.userAWeighted).toBe(0.8);
      expect(result.userBWeighted).toBe(0.8);
      expect(result.averageWeighted).toBe(0.8);
    });

    test("should reduce score when both have min importance (1)", () => {
      const result = applyImportanceWeighting(0.8, 1, 1);
      expect(result.userAWeighted).toBeCloseTo(0.16, 2); // 0.8 × 1/5
      expect(result.userBWeighted).toBeCloseTo(0.16, 2);
      expect(result.averageWeighted).toBeCloseTo(0.16, 2);
    });

    test("should average when importances differ", () => {
      const result = applyImportanceWeighting(0.8, 5, 1);
      expect(result.userAWeighted).toBeCloseTo(0.8, 2); // 0.8 × 5/5
      expect(result.userBWeighted).toBeCloseTo(0.16, 2); // 0.8 × 1/5
      expect(result.averageWeighted).toBeCloseTo(0.48, 2); // (0.8 + 0.16) / 2
    });

    test("should use neutral importance (3) when not provided", () => {
      const result = applyImportanceWeighting(0.6, undefined, undefined);
      expect(result.userAWeighted).toBe(0.36); // 0.6 × 3/5
      expect(result.userBWeighted).toBe(0.36);
      expect(result.averageWeighted).toBe(0.36);
    });

    test("should handle mixed defined/undefined importance", () => {
      const result = applyImportanceWeighting(0.5, 4, undefined);
      expect(result.userAWeighted).toBe(0.4); // 0.5 × 4/5
      expect(result.userBWeighted).toBe(0.3); // 0.5 × 3/5 (default)
      expect(result.averageWeighted).toBe(0.35);
    });

    test("should clamp importance above 5", () => {
      const result = applyImportanceWeighting(0.6, 10, 5);
      expect(result.userAWeighted).toBe(0.6); // Clamped to 5
      expect(result.userBWeighted).toBe(0.6);
      expect(result.averageWeighted).toBe(0.6);
    });

    test("should clamp importance below 1", () => {
      const result = applyImportanceWeighting(0.6, 0, 1);
      expect(result.userAWeighted).toBe(0.12); // Clamped to 1
      expect(result.userBWeighted).toBe(0.12);
      expect(result.averageWeighted).toBe(0.12);
    });

    test("should handle zero similarity", () => {
      const result = applyImportanceWeighting(0.0, 5, 5);
      expect(result.userAWeighted).toBe(0.0);
      expect(result.userBWeighted).toBe(0.0);
      expect(result.averageWeighted).toBe(0.0);
    });

    test("should handle perfect similarity", () => {
      const result = applyImportanceWeighting(1.0, 3, 3);
      expect(result.userAWeighted).toBe(0.6); // 1.0 × 3/5
      expect(result.userBWeighted).toBe(0.6);
      expect(result.averageWeighted).toBe(0.6);
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
