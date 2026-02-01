import { describe, test, expect } from "vitest";
import {
  applySectionWeighting,
  getQuestionSection,
} from "../section-weighting";
import { MATCHING_CONFIG } from "../config";
import { MatchingUser } from "../types";

// Helper to create mock user with specific importance levels
function createMockUser(
  responses: Record<string, { importance?: string }> = {},
): MatchingUser {
  return {
    id: "test-user",
    email: "test@example.com",
    responses: Object.fromEntries(
      Object.entries(responses).map(([qid, data]) => [
        qid,
        {
          questionId: qid,
          answer: [],
          preference: null,
          importance: data.importance || "somewhat_important",
        },
      ]),
    ),
  } as MatchingUser;
}

describe("Phase 5: Section Weighting", () => {
  describe("applySectionWeighting", () => {
    test("should weight sections with default V2.2 config (65/35)", () => {
      const questionScores: Record<string, number> = {
        q1: 1.0, // Lifestyle
        q2: 1.0, // Lifestyle
        q22: 0.5, // Personality
        q23: 0.5, // Personality
      };

      // Create mock users with "important" for all questions (weight=1.0)
      const userA = createMockUser({
        q1: { importance: "important" },
        q2: { importance: "important" },
        q22: { importance: "important" },
        q23: { importance: "important" },
      });
      const userB = createMockUser({
        q1: { importance: "important" },
        q2: { importance: "important" },
        q22: { importance: "important" },
        q23: { importance: "important" },
      });

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        MATCHING_CONFIG,
      );

      expect(result.lifestyleScore).toBe(1.0);
      expect(result.personalityScore).toBe(0.5);
      expect(result.weightedLifestyleScore).toBe(0.65); // 1.0 × 0.65
      expect(result.weightedPersonalityScore).toBeCloseTo(0.175, 2); // 0.5 × 0.35
      expect(result.totalScore).toBeCloseTo(82.5, 1); // (0.65 + 0.175) × 100
      expect(result.lifestyleQuestionCount).toBe(2);
      expect(result.personalityQuestionCount).toBe(2);
      expect(result.totalQuestionCount).toBe(4);
    });

    test("should apply custom section weights", () => {
      const questionScores: Record<string, number> = {
        q1: 0.8, // Lifestyle
        q22: 0.6, // Personality
      };

      const customConfig = {
        ...MATCHING_CONFIG,
        SECTION_WEIGHTS: {
          LIFESTYLE: 0.65,
          PERSONALITY: 0.35,
        },
      };

      const userA = createMockUser({
        q1: { importance: "important" },
        q22: { importance: "important" },
      });
      const userB = createMockUser({
        q1: { importance: "important" },
        q22: { importance: "important" },
      });

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        customConfig,
      );

      expect(result.lifestyleScore).toBe(0.8);
      expect(result.personalityScore).toBe(0.6);
      expect(result.weightedLifestyleScore).toBeCloseTo(0.52, 2); // 0.8 × 0.65
      expect(result.weightedPersonalityScore).toBeCloseTo(0.21, 2); // 0.6 × 0.35
      expect(result.totalScore).toBeCloseTo(73, 0); // (0.52 + 0.21) × 100
    });

    test("should handle all lifestyle questions", () => {
      const questionScores: Record<string, number> = {
        q1: 1.0,
        q5: 0.8,
        q10: 0.9,
        q15: 0.7,
        q21: 0.85,
      };

      const userA = createMockUser({
        q1: { importance: "important" },
        q5: { importance: "important" },
        q10: { importance: "important" },
        q15: { importance: "important" },
        q21: { importance: "important" },
      });
      const userB = createMockUser({
        q1: { importance: "important" },
        q5: { importance: "important" },
        q10: { importance: "important" },
        q15: { importance: "important" },
        q21: { importance: "important" },
      });

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        MATCHING_CONFIG,
      );

      const expectedAvg = (1.0 + 0.8 + 0.9 + 0.7 + 0.85) / 5;
      expect(result.lifestyleScore).toBeCloseTo(expectedAvg, 2);
      expect(result.personalityScore).toBe(0); // No personality questions
      expect(result.weightedLifestyleScore).toBeCloseTo(
        expectedAvg * 0.65, // V2.2 weight
        2,
      );
      expect(result.lifestyleQuestionCount).toBe(5);
      expect(result.personalityQuestionCount).toBe(0);
    });

    test("should handle all personality questions", () => {
      const questionScores: Record<string, number> = {
        q22: 0.9,
        q25: 0.8,
        q29: 0.85,
        q33: 0.75,
        q37: 0.95,
      };

      const userA = createMockUser({
        q22: { importance: "important" },
        q25: { importance: "important" },
        q29: { importance: "important" },
        q33: { importance: "important" },
        q37: { importance: "important" },
      });
      const userB = createMockUser({
        q22: { importance: "important" },
        q25: { importance: "important" },
        q29: { importance: "important" },
        q33: { importance: "important" },
        q37: { importance: "important" },
      });

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        MATCHING_CONFIG,
      );

      const expectedAvg = (0.9 + 0.8 + 0.85 + 0.75 + 0.95) / 5;
      expect(result.personalityScore).toBeCloseTo(expectedAvg, 2);
      expect(result.lifestyleScore).toBe(0); // No lifestyle questions
      expect(result.weightedPersonalityScore).toBeCloseTo(
        expectedAvg * 0.35, // V2.2 weight
        2,
      );
      expect(result.lifestyleQuestionCount).toBe(0);
      expect(result.personalityQuestionCount).toBe(5);
    });

    test("should handle perfect similarity (all 1.0)", () => {
      const questionScores: Record<string, number> = {
        q1: 1.0,
        q2: 1.0,
        q3: 1.0,
        q22: 1.0,
        q23: 1.0,
        q24: 1.0,
      };

      const userA = createMockUser({
        q1: { importance: "important" },
        q2: { importance: "important" },
        q3: { importance: "important" },
        q22: { importance: "important" },
        q23: { importance: "important" },
        q24: { importance: "important" },
      });
      const userB = createMockUser({
        q1: { importance: "important" },
        q2: { importance: "important" },
        q3: { importance: "important" },
        q22: { importance: "important" },
        q23: { importance: "important" },
        q24: { importance: "important" },
      });

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        MATCHING_CONFIG,
      );

      expect(result.lifestyleScore).toBe(1.0);
      expect(result.personalityScore).toBe(1.0);
      expect(result.totalScore).toBe(100);
    });

    test("should handle zero similarity (all 0.0)", () => {
      const questionScores: Record<string, number> = {
        q1: 0.0,
        q2: 0.0,
        q22: 0.0,
        q23: 0.0,
      };

      const userA = createMockUser({
        q1: { importance: "important" },
        q2: { importance: "important" },
        q22: { importance: "important" },
        q23: { importance: "important" },
      });
      const userB = createMockUser({
        q1: { importance: "important" },
        q2: { importance: "important" },
        q22: { importance: "important" },
        q23: { importance: "important" },
      });

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        MATCHING_CONFIG,
      );

      expect(result.lifestyleScore).toBe(0.0);
      expect(result.personalityScore).toBe(0.0);
      expect(result.totalScore).toBe(0);
    });

    test("should handle empty question scores", () => {
      const questionScores: Record<string, number> = {};

      const userA = createMockUser({});
      const userB = createMockUser({});

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        MATCHING_CONFIG,
      );

      expect(result.lifestyleScore).toBe(0);
      expect(result.personalityScore).toBe(0);
      expect(result.totalScore).toBe(0);
      expect(result.totalQuestionCount).toBe(0);
    });

    test("should handle mixed high/low scores", () => {
      const questionScores: Record<string, number> = {
        q1: 1.0, // Lifestyle high
        q5: 0.2, // Lifestyle low
        q22: 0.9, // Personality high
        q25: 0.3, // Personality low
      };

      const userA = createMockUser({
        q1: { importance: "important" },
        q5: { importance: "important" },
        q22: { importance: "important" },
        q25: { importance: "important" },
      });
      const userB = createMockUser({
        q1: { importance: "important" },
        q5: { importance: "important" },
        q22: { importance: "important" },
        q25: { importance: "important" },
      });

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        MATCHING_CONFIG,
      );

      expect(result.lifestyleScore).toBe(0.6); // (1.0 + 0.2) / 2
      expect(result.personalityScore).toBe(0.6); // (0.9 + 0.3) / 2
      expect(result.totalScore).toBe(60); // (0.3 + 0.3) × 100
    });

    test("should ignore unknown question IDs", () => {
      const questionScores: Record<string, number> = {
        q1: 0.8,
        q99: 0.5, // Unknown question
        q22: 0.7,
        unknown: 0.3, // Unknown question
      };

      const userA = createMockUser({
        q1: { importance: "important" },
        q22: { importance: "important" },
      });
      const userB = createMockUser({
        q1: { importance: "important" },
        q22: { importance: "important" },
      });

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        MATCHING_CONFIG,
      );

      expect(result.lifestyleQuestionCount).toBe(1); // Only q1
      expect(result.personalityQuestionCount).toBe(1); // Only q22
      expect(result.totalQuestionCount).toBe(2); // q99 and unknown ignored
    });

    test("should calculate with all 37 questions", () => {
      const questionScores: Record<string, number> = {};
      const userAResponses: Record<string, { importance: string }> = {};
      const userBResponses: Record<string, { importance: string }> = {};

      // Add all lifestyle questions (Q1-Q21)
      for (let i = 1; i <= 21; i++) {
        questionScores[`q${i}`] = 0.8;
        userAResponses[`q${i}`] = { importance: "important" };
        userBResponses[`q${i}`] = { importance: "important" };
      }

      // Add all personality questions (Q22-Q37)
      for (let i = 22; i <= 37; i++) {
        questionScores[`q${i}`] = 0.6;
        userAResponses[`q${i}`] = { importance: "important" };
        userBResponses[`q${i}`] = { importance: "important" };
      }

      const userA = createMockUser(userAResponses);
      const userB = createMockUser(userBResponses);

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        MATCHING_CONFIG,
      );

      expect(result.lifestyleScore).toBeCloseTo(0.8, 5);
      expect(result.personalityScore).toBeCloseTo(0.6, 5);
      expect(result.lifestyleQuestionCount).toBe(21);
      expect(result.personalityQuestionCount).toBe(16);
      expect(result.totalQuestionCount).toBe(37);
      expect(result.totalScore).toBeCloseTo(73, 1); // (0.52 + 0.21) × 100
    });

    test("should weight questions by maximum importance between users", () => {
      const questionScores: Record<string, number> = {
        q1: 1.0, // High importance from userA
        q2: 0.5, // High importance from userB
        q3: 0.8, // Low importance from both
      };

      // User A cares strongly about q1, doesn't care about q2
      const userA = createMockUser({
        q1: { importance: "very_important" }, // weight 2.0
        q2: { importance: "not_important" }, // weight 0
        q3: { importance: "not_important" }, // weight 0
      });

      // User B doesn't care about q1, cares strongly about q2
      const userB = createMockUser({
        q1: { importance: "not_important" }, // weight 0
        q2: { importance: "very_important" }, // weight 2.0
        q3: { importance: "not_important" }, // weight 0
      });

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        MATCHING_CONFIG,
      );

      // Should use max importance: q1 gets weight 2.0, q2 gets weight 2.0, q3 gets weight 0
      // Weighted average: (1.0*2.0 + 0.5*2.0 + 0.8*0) / (2.0 + 2.0 + 0) = 3.0 / 4.0 = 0.75
      expect(result.lifestyleScore).toBeCloseTo(0.75, 2);
    });

    test("should handle all zero importance by falling back to simple average", () => {
      const questionScores: Record<string, number> = {
        q1: 1.0,
        q2: 0.6,
      };

      // Both users mark everything as not_important (weight 0)
      const userA = createMockUser({
        q1: { importance: "not_important" },
        q2: { importance: "not_important" },
      });
      const userB = createMockUser({
        q1: { importance: "not_important" },
        q2: { importance: "not_important" },
      });

      const result = applySectionWeighting(
        questionScores,
        userA,
        userB,
        MATCHING_CONFIG,
      );

      // Should fall back to simple average: (1.0 + 0.6) / 2 = 0.8
      expect(result.lifestyleScore).toBe(0.8);
    });
  });

  describe("getQuestionSection", () => {
    test("should return LIFESTYLE for Q1-Q21", () => {
      expect(getQuestionSection("q1")).toBe("LIFESTYLE");
      expect(getQuestionSection("q10")).toBe("LIFESTYLE");
      expect(getQuestionSection("q21")).toBe("LIFESTYLE");
    });

    test("should return PERSONALITY for Q22-Q37", () => {
      expect(getQuestionSection("q22")).toBe("PERSONALITY");
      expect(getQuestionSection("q29")).toBe("PERSONALITY");
      expect(getQuestionSection("q37")).toBe("PERSONALITY");
    });

    test("should return undefined for unknown questions", () => {
      expect(getQuestionSection("q0")).toBeUndefined();
      expect(getQuestionSection("q38")).toBeUndefined();
      expect(getQuestionSection("q99")).toBeUndefined();
      expect(getQuestionSection("unknown")).toBeUndefined();
    });
  });
});
