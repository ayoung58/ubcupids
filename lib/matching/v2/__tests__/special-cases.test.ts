import { describe, test, expect } from "vitest";
import {
  calculateLoveLanguageCompatibility,
  type LoveLanguageResponse,
} from "../special-cases/love-languages";
import {
  calculateSleepScheduleCompatibility,
  type SleepScheduleResponse,
} from "../special-cases/sleep-schedule";
import {
  calculateConflictResolutionCompatibility,
  type ConflictResolutionResponse,
} from "../special-cases/conflict-resolution";
import { MATCHING_CONFIG } from "../config";

describe("Special Cases", () => {
  describe("Q21: Love Languages", () => {
    test("should return 1.0 for perfect mutual match", () => {
      const userA: LoveLanguageResponse = {
        show: ["words-of-affirmation", "quality-time"],
        receive: ["physical-touch", "acts-of-service"],
      };
      const userB: LoveLanguageResponse = {
        show: ["physical-touch", "acts-of-service"],
        receive: ["words-of-affirmation", "quality-time"],
      };

      const result = calculateLoveLanguageCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.showCompatibility).toBe(1.0); // 2/2 matches
      expect(result.receiveCompatibility).toBe(1.0); // 2/2 matches
      expect(result.weightedScore).toBe(1.0); // (1.0 × 0.6) + (1.0 × 0.4)
      expect(result.mutualMatches).toBe(4);
    });

    test("should calculate partial matches correctly", () => {
      const userA: LoveLanguageResponse = {
        show: ["words-of-affirmation", "quality-time"],
        receive: ["physical-touch", "acts-of-service"],
      };
      const userB: LoveLanguageResponse = {
        show: ["physical-touch", "receiving-gifts"],
        receive: ["words-of-affirmation", "receiving-gifts"],
      };

      const result = calculateLoveLanguageCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.showCompatibility).toBe(0.5); // 1/2 matches (words)
      expect(result.receiveCompatibility).toBe(0.5); // 1/2 matches (touch)
      expect(result.weightedScore).toBe(0.5); // (0.5 × 0.6) + (0.5 × 0.4)
      expect(result.mutualMatches).toBe(2);
    });

    test("should return 0.0 for no matches", () => {
      const userA: LoveLanguageResponse = {
        show: ["words-of-affirmation", "quality-time"],
        receive: ["physical-touch", "acts-of-service"],
      };
      const userB: LoveLanguageResponse = {
        show: ["receiving-gifts", "physical-touch"], // Changed from words
        receive: ["receiving-gifts", "acts-of-service"], // Changed from time
      };

      const result = calculateLoveLanguageCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.showCompatibility).toBe(0.0); // 0/2 matches (A shows [words,time], B receives [gifts,acts])
      expect(result.receiveCompatibility).toBe(0.5); // 1/2 matches (B shows [gifts,touch], A receives [touch,acts])
      expect(result.weightedScore).toBe(0.2); // (0.0 × 0.6) + (0.5 × 0.4)
      expect(result.mutualMatches).toBe(1);
    });

    test("should apply custom weights", () => {
      const userA: LoveLanguageResponse = {
        show: ["words-of-affirmation", "quality-time"],
        receive: ["physical-touch", "acts-of-service"],
      };
      const userB: LoveLanguageResponse = {
        show: ["physical-touch", "acts-of-service"],
        receive: ["receiving-gifts", "quality-time"],
      };

      const customConfig = {
        ...MATCHING_CONFIG,
        LOVE_LANGUAGE_WEIGHTS: {
          SHOW: 0.7,
          RECEIVE: 0.3,
        },
      };

      const result = calculateLoveLanguageCompatibility(
        userA,
        userB,
        customConfig
      );

      expect(result.showCompatibility).toBe(0.5); // 1/2 matches (time)
      expect(result.receiveCompatibility).toBe(1.0); // 2/2 matches
      expect(result.weightedScore).toBeCloseTo(0.65, 2); // (0.5 × 0.7) + (1.0 × 0.3)
    });

    test("should handle asymmetric matches", () => {
      const userA: LoveLanguageResponse = {
        show: ["words-of-affirmation", "quality-time"],
        receive: ["physical-touch", "acts-of-service"],
      };
      const userB: LoveLanguageResponse = {
        show: ["acts-of-service", "receiving-gifts"],
        receive: ["words-of-affirmation", "quality-time"],
      };

      const result = calculateLoveLanguageCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.showCompatibility).toBe(1.0); // A shows what B receives
      expect(result.receiveCompatibility).toBe(0.5); // B shows 1/2 of what A receives
      expect(result.weightedScore).toBeCloseTo(0.8, 1); // (1.0 × 0.6) + (0.5 × 0.4)
    });
  });

  describe("Q29: Sleep Schedule", () => {
    test("should return 1.0 when user A is flexible", () => {
      const userA: SleepScheduleResponse = { answer: "flexible" };
      const userB: SleepScheduleResponse = { answer: "early-bird" };

      const result = calculateSleepScheduleCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.similarity).toBe(1.0);
      expect(result.isFlexible).toBe(true);
      expect(result.appliedFlexibilityBonus).toBe(true);
      expect(result.finalScore).toBe(1.0);
    });

    test("should return 1.0 when user B is flexible", () => {
      const userA: SleepScheduleResponse = { answer: "night-owl" };
      const userB: SleepScheduleResponse = { answer: "flexible" };

      const result = calculateSleepScheduleCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.similarity).toBe(1.0);
      expect(result.isFlexible).toBe(true);
      expect(result.appliedFlexibilityBonus).toBe(true);
    });

    test("should return 1.0 for matching schedules", () => {
      const userA: SleepScheduleResponse = { answer: "early-bird" };
      const userB: SleepScheduleResponse = { answer: "early-bird" };

      const result = calculateSleepScheduleCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.similarity).toBe(1.0);
      expect(result.isFlexible).toBe(false);
      expect(result.appliedFlexibilityBonus).toBe(false);
      expect(result.finalScore).toBe(1.0);
    });

    test("should return 0.3 for mismatched rigid schedules", () => {
      const userA: SleepScheduleResponse = { answer: "early-bird" };
      const userB: SleepScheduleResponse = { answer: "night-owl" };

      const result = calculateSleepScheduleCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.similarity).toBe(0.3);
      expect(result.isFlexible).toBe(false);
      expect(result.finalScore).toBe(0.3);
    });

    test("should return 1.0 for both irregular (same schedule)", () => {
      const userA: SleepScheduleResponse = { answer: "irregular" };
      const userB: SleepScheduleResponse = { answer: "irregular" };

      const result = calculateSleepScheduleCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.similarity).toBe(1.0); // Same schedule = perfect match
      expect(result.isFlexible).toBe(false);
    });

    test("should return 1.0 when both are flexible", () => {
      const userA: SleepScheduleResponse = { answer: "flexible" };
      const userB: SleepScheduleResponse = { answer: "flexible" };

      const result = calculateSleepScheduleCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.similarity).toBe(1.0);
      expect(result.isFlexible).toBe(true);
      expect(result.finalScore).toBe(1.0);
    });
  });

  describe("Q25: Conflict Resolution", () => {
    test("should return 1.0 for same style with 'same' preference", () => {
      const userA: ConflictResolutionResponse = {
        answer: "direct",
        preference: "same",
      };
      const userB: ConflictResolutionResponse = {
        answer: "direct",
        preference: "same",
      };

      const result = calculateConflictResolutionCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.baseCompatibility).toBe(1.0);
      expect(result.userAPreferenceMet).toBe(true);
      expect(result.userBPreferenceMet).toBe(true);
      expect(result.finalScore).toBe(1.0);
      expect(result.bothWantSame).toBe(true);
    });

    test("should apply penalty when 'same' preference not met", () => {
      const userA: ConflictResolutionResponse = {
        answer: "direct",
        preference: "same",
      };
      const userB: ConflictResolutionResponse = {
        answer: "space",
        preference: "compatible",
      };

      const result = calculateConflictResolutionCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.baseCompatibility).toBe(0.3); // direct+space from matrix
      expect(result.userAPreferenceMet).toBe(false); // A wants same, got space
      expect(result.userBPreferenceMet).toBe(false); // B wants compatible (≥0.5), got 0.3
      expect(result.finalScore).toBeCloseTo(0.12, 2); // 0.3 × 0.4
    });

    test("should work with 'compatible' preference and high matrix value", () => {
      const userA: ConflictResolutionResponse = {
        answer: "direct",
        preference: "compatible",
      };
      const userB: ConflictResolutionResponse = {
        answer: "compromise",
        preference: "compatible",
      };

      const result = calculateConflictResolutionCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.baseCompatibility).toBe(0.8); // direct+compromise from matrix
      expect(result.userAPreferenceMet).toBe(true); // 0.8 ≥ 0.5
      expect(result.userBPreferenceMet).toBe(true); // 0.8 ≥ 0.5
      expect(result.finalScore).toBe(0.8);
    });

    test("should apply moderate penalty when one preference met", () => {
      const userA: ConflictResolutionResponse = {
        answer: "humor",
        preference: "compatible",
      };
      const userB: ConflictResolutionResponse = {
        answer: "space",
        preference: "same",
      };

      const result = calculateConflictResolutionCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.baseCompatibility).toBe(0.6); // humor+space from matrix
      expect(result.userAPreferenceMet).toBe(true); // 0.6 ≥ 0.5
      expect(result.userBPreferenceMet).toBe(false); // B wants same, got humor
      expect(result.finalScore).toBeCloseTo(0.42, 2); // 0.6 × 0.7
    });

    test("should handle all matching with compatible preference", () => {
      const userA: ConflictResolutionResponse = {
        answer: "compromise",
        preference: "compatible",
      };
      const userB: ConflictResolutionResponse = {
        answer: "compromise",
        preference: "compatible",
      };

      const result = calculateConflictResolutionCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.baseCompatibility).toBe(1.0);
      expect(result.userAPreferenceMet).toBe(true);
      expect(result.userBPreferenceMet).toBe(true);
      expect(result.finalScore).toBe(1.0);
    });

    test("should use matrix for direct+humor compatibility", () => {
      const userA: ConflictResolutionResponse = {
        answer: "direct",
        preference: "compatible",
      };
      const userB: ConflictResolutionResponse = {
        answer: "humor",
        preference: "compatible",
      };

      const result = calculateConflictResolutionCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.baseCompatibility).toBe(0.7); // direct+humor from matrix
      expect(result.userAPreferenceMet).toBe(true); // 0.7 ≥ 0.5
      expect(result.userBPreferenceMet).toBe(true); // 0.7 ≥ 0.5
      expect(result.finalScore).toBe(0.7);
    });

    test("should handle space+compromise below threshold", () => {
      const userA: ConflictResolutionResponse = {
        answer: "space",
        preference: "compatible",
      };
      const userB: ConflictResolutionResponse = {
        answer: "compromise",
        preference: "compatible",
      };

      const result = calculateConflictResolutionCompatibility(
        userA,
        userB,
        MATCHING_CONFIG
      );

      expect(result.baseCompatibility).toBe(0.5); // space+compromise from matrix
      expect(result.userAPreferenceMet).toBe(true); // 0.5 ≥ 0.5 (edge case)
      expect(result.userBPreferenceMet).toBe(true); // 0.5 ≥ 0.5 (edge case)
      expect(result.finalScore).toBe(0.5);
    });
  });
});
