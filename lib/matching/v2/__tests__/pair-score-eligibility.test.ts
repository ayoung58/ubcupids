import { describe, test, expect } from "vitest";
import { calculatePairScore } from "../pair-score";
import { checkEligibility, findBestScores } from "../eligibility";
import { MATCHING_CONFIG } from "../config";

describe("Phase 6: Pair Scores", () => {
  describe("calculatePairScore", () => {
    test("should calculate pair score with mutuality formula", () => {
      const questionScores = {
        q1: { a: 0.8, b: 0.8, section: "LIFESTYLE" },
        q2: { a: 0.6, b: 0.6, section: "LIFESTYLE" },
      };

      const result = calculatePairScore(70, 70, questionScores, MATCHING_CONFIG);

      expect(result.userAToB).toBe(70);
      expect(result.userBToA).toBe(70);
      expect(result.pairScore).toBe(70); // Perfect mutuality
      expect(result.mutualityPenalty).toBe(0); // No penalty
      expect(result.questionCount).toBe(2);
    });

    test("should apply mutuality penalty for asymmetric scores", () => {
      const questionScores = {
        q1: { a: 0.8, b: 0.6, section: "LIFESTYLE" },
      };

      const result = calculatePairScore(80, 60, questionScores, MATCHING_CONFIG);

      // α=0.65, min=60, mean=70
      // pair_score = 0.65×60 + 0.35×70 = 39 + 24.5 = 63.5
      expect(result.pairScore).toBeCloseTo(63.5, 1);
      expect(result.mutualityPenalty).toBeCloseTo(0.206, 2); // (80-63.5)/80
    });

    test("should handle perfect match (100/100)", () => {
      const questionScores = {
        q1: { a: 1.0, b: 1.0, section: "LIFESTYLE" },
        q22: { a: 1.0, b: 1.0, section: "PERSONALITY" },
      };

      const result = calculatePairScore(100, 100, questionScores, MATCHING_CONFIG);

      expect(result.pairScore).toBe(100);
      expect(result.mutualityPenalty).toBe(0);
      expect(result.lowScoreQuestions).toHaveLength(0);
      expect(result.asymmetricPreferences).toHaveLength(0);
    });

    test("should handle zero match (0/0)", () => {
      const questionScores = {
        q1: { a: 0.0, b: 0.0, section: "LIFESTYLE" },
      };

      const result = calculatePairScore(0, 0, questionScores, MATCHING_CONFIG);

      expect(result.pairScore).toBe(0);
      expect(result.mutualityPenalty).toBe(0);
    });

    test("should identify low-scoring questions", () => {
      const questionScores = {
        q1: { a: 0.2, b: 0.2, section: "LIFESTYLE" }, // Low
        q2: { a: 0.8, b: 0.8, section: "LIFESTYLE" }, // High
        q3: { a: 0.1, b: 0.3, section: "LIFESTYLE" }, // Low
        q22: { a: 0.5, b: 0.5, section: "PERSONALITY" }, // OK
      };

      const result = calculatePairScore(50, 50, questionScores, MATCHING_CONFIG);

      expect(result.lowScoreQuestions).toHaveLength(2);
      // Both q1 (0.2) and q3 (0.2) are equally low, order may vary
      expect(result.lowScoreQuestions[0].score).toBeCloseTo(0.2, 1);
      expect(result.lowScoreQuestions[1].score).toBeCloseTo(0.2, 1);
    });

    test("should identify asymmetric preferences", () => {
      const questionScores = {
        q1: { a: 0.9, b: 0.4, section: "LIFESTYLE" }, // Diff = 0.5
        q2: { a: 0.7, b: 0.6, section: "LIFESTYLE" }, // Diff = 0.1 (not flagged)
        q3: { a: 0.3, b: 0.8, section: "LIFESTYLE" }, // Diff = 0.5
      };

      const result = calculatePairScore(70, 60, questionScores, MATCHING_CONFIG);

      expect(result.asymmetricPreferences).toHaveLength(2);
      expect(result.asymmetricPreferences[0].difference).toBeCloseTo(0.5, 1);
      expect(result.asymmetricPreferences[1].difference).toBeCloseTo(0.5, 1);
    });

    test("should handle highly asymmetric case (90/40)", () => {
      const questionScores = {
        q1: { a: 0.9, b: 0.4, section: "LIFESTYLE" },
      };

      const result = calculatePairScore(90, 40, questionScores, MATCHING_CONFIG);

      // α=0.65, min=40, mean=65
      // pair_score = 0.65×40 + 0.35×65 = 26 + 22.75 = 48.75
      expect(result.pairScore).toBeCloseTo(48.75, 1);
      expect(result.mutualityPenalty).toBeCloseTo(0.458, 2); // (90-48.75)/90
    });

    test("should sort diagnostics correctly", () => {
      const questionScores = {
        q1: { a: 0.25, b: 0.25, section: "LIFESTYLE" },
        q2: { a: 0.1, b: 0.1, section: "LIFESTYLE" },
        q3: { a: 0.3, b: 0.2, section: "LIFESTYLE" },
        q4: { a: 0.8, b: 0.2, section: "LIFESTYLE" }, // Asymmetric
        q5: { a: 0.1, b: 0.6, section: "LIFESTYLE" }, // Very asymmetric
      };

      const result = calculatePairScore(50, 50, questionScores, MATCHING_CONFIG);

      // Low scores sorted ascending
      expect(result.lowScoreQuestions[0].questionId).toBe("q2"); // 0.1
      expect(result.lowScoreQuestions[1].questionId).toBe("q1"); // 0.25
      expect(result.lowScoreQuestions[2].questionId).toBe("q3"); // 0.25

      // Asymmetric sorted descending by difference
      expect(result.asymmetricPreferences[0].questionId).toBe("q4"); // diff=0.6
      expect(result.asymmetricPreferences[1].questionId).toBe("q5"); // diff=0.5
    });
  });
});

describe("Phase 7: Eligibility Thresholding", () => {
  describe("checkEligibility", () => {
    test("should pass all thresholds for good match", () => {
      // Pair: 70, A→B: 70, B→A: 68
      // A best: 80 → threshold: 48
      // B best: 75 → threshold: 45
      const result = checkEligibility(70, 70, 68, 80, 75, MATCHING_CONFIG);

      expect(result.isEligible).toBe(true);
      expect(result.passedAbsoluteThreshold).toBe(true); // 70 ≥ 50
      expect(result.passedUserARelativeThreshold).toBe(true); // 70 ≥ 48
      expect(result.passedUserBRelativeThreshold).toBe(true); // 68 ≥ 45
      expect(result.failureReasons).toHaveLength(0);
    });

    test("should fail absolute threshold", () => {
      const result = checkEligibility(45, 45, 45, 80, 80, MATCHING_CONFIG);

      expect(result.isEligible).toBe(false);
      expect(result.passedAbsoluteThreshold).toBe(false); // 45 < 50
      expect(result.failureReasons.length).toBeGreaterThanOrEqual(1);
      expect(result.failureReasons[0]).toContain("below minimum threshold");
    });

    test("should fail user A relative threshold", () => {
      // A best: 100 → threshold: 60
      // A→B: 55 (below 60)
      const result = checkEligibility(55, 55, 70, 100, 80, MATCHING_CONFIG);

      expect(result.isEligible).toBe(false);
      expect(result.passedUserARelativeThreshold).toBe(false); // 55 < 60
      expect(result.failureReasons.some(r => r.includes("User A score"))).toBe(true);
    });

    test("should fail user B relative threshold", () => {
      // B best: 100 → threshold: 60
      // B→A: 55 (below 60)
      const result = checkEligibility(55, 70, 55, 80, 100, MATCHING_CONFIG);

      expect(result.isEligible).toBe(false);
      expect(result.passedUserBRelativeThreshold).toBe(false); // 55 < 60
      expect(result.failureReasons.some(r => r.includes("User B score"))).toBe(true);
    });

    test("should fail multiple thresholds", () => {
      const result = checkEligibility(40, 40, 40, 100, 100, MATCHING_CONFIG);

      expect(result.isEligible).toBe(false);
      expect(result.failureReasons).toHaveLength(3); // All 3 failed
      expect(result.failureReasons[0]).toContain("Pair score");
      expect(result.failureReasons[1]).toContain("User A");
      expect(result.failureReasons[2]).toContain("User B");
    });

    test("should pass at exact thresholds", () => {
      // Pair: 50 (exactly T_MIN)
      // A→B: 60, A best: 100 → threshold: 60 (exactly)
      // B→A: 48, B best: 80 → threshold: 48 (exactly)
      const result = checkEligibility(50, 60, 48, 100, 80, MATCHING_CONFIG);

      expect(result.isEligible).toBe(true);
      expect(result.passedAbsoluteThreshold).toBe(true);
      expect(result.passedUserARelativeThreshold).toBe(true);
      expect(result.passedUserBRelativeThreshold).toBe(true);
    });

    test("should use custom beta value", () => {
      // Beta: 0.8 (stricter)
      // A best: 100 → threshold: 80
      // A→B: 75 (below 80)
      const result = checkEligibility(75, 75, 75, 100, 100, MATCHING_CONFIG, 0.8);

      expect(result.isEligible).toBe(false);
      expect(result.relativeThreshold).toBe(0.8);
      expect(result.passedUserARelativeThreshold).toBe(false);
      expect(result.passedUserBRelativeThreshold).toBe(false);
    });

    test("should handle perfect best scores", () => {
      const result = checkEligibility(100, 100, 100, 100, 100, MATCHING_CONFIG);

      expect(result.isEligible).toBe(true);
      expect(result.passedAbsoluteThreshold).toBe(true);
      expect(result.passedUserARelativeThreshold).toBe(true);
      expect(result.passedUserBRelativeThreshold).toBe(true);
    });
  });

  describe("findBestScores", () => {
    test("should find best scores for all users", () => {
      const pairScores = {
        "alice_bob": { score: 75, partnerUserId: "bob" },
        "alice_charlie": { score: 85, partnerUserId: "charlie" },
        "bob_charlie": { score: 60, partnerUserId: "charlie" },
      };

      const bestScores = findBestScores(pairScores);

      expect(bestScores.get("alice")?.bestScore).toBe(85);
      expect(bestScores.get("alice")?.bestMatchId).toBe("charlie");
      expect(bestScores.get("bob")?.bestScore).toBe(75);
      expect(bestScores.get("bob")?.bestMatchId).toBe("alice");
      expect(bestScores.get("charlie")?.bestScore).toBe(85);
      expect(bestScores.get("charlie")?.bestMatchId).toBe("alice");
    });

    test("should handle single pair", () => {
      const pairScores = {
        "alice_bob": { score: 70, partnerUserId: "bob" },
      };

      const bestScores = findBestScores(pairScores);

      expect(bestScores.get("alice")?.bestScore).toBe(70);
      expect(bestScores.get("bob")?.bestScore).toBe(70);
    });

    test("should update when better score found", () => {
      const pairScores = {
        "alice_bob": { score: 60, partnerUserId: "bob" },
        "alice_charlie": { score: 80, partnerUserId: "charlie" },
        "alice_dave": { score: 70, partnerUserId: "dave" },
      };

      const bestScores = findBestScores(pairScores);

      expect(bestScores.get("alice")?.bestScore).toBe(80);
      expect(bestScores.get("alice")?.bestMatchId).toBe("charlie");
    });

    test("should handle empty input", () => {
      const pairScores = {};

      const bestScores = findBestScores(pairScores);

      expect(bestScores.size).toBe(0);
    });
  });
});
