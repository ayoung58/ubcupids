/**
 * Test for Q9b ordinal scoring fix
 * Verifies that identical answers with "similar" preference score correctly
 */

import { describe, it, expect } from "vitest";
import { calculateQuestionSimilarity } from "../similarity";
import { MatchingUser } from "../types";
import { MATCHING_CONFIG } from "../config";

describe("Q9b Ordinal Scoring", () => {
  const createUser = (
    id: string,
    email: string,
    answer: string,
    preference: string,
    importance: number,
  ): MatchingUser => ({
    id,
    email,
    name: `User ${id.toUpperCase()}`,
    gender: "woman",
    interestedInGenders: ["men"],
    campus: "UBCV",
    okMatchingDifferentCampus: true,
    responses: {
      q9b: { answer, preference, importance },
    },
    responseRecord: {} as any,
  });

  describe("Identical answers with 'similar' preference", () => {
    it("should score 1.0 when both users answer 'never' and prefer 'similar'", () => {
      const userA = createUser("a", "a@test.com", "never", "similar", 1.0);
      const userB = createUser("b", "b@test.com", "never", "similar", 1.0);

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      expect(similarity).toBe(1.0);
    });

    it("should score 1.0 when both users answer 'occasionally' and prefer 'similar'", () => {
      const userA = createUser(
        "a",
        "a@test.com",
        "occasionally",
        "similar",
        1.0,
      );
      const userB = createUser(
        "b",
        "b@test.com",
        "occasionally",
        "similar",
        1.0,
      );

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      expect(similarity).toBe(1.0);
    });

    it("should score 1.0 when both users answer 'regularly' and prefer 'similar'", () => {
      const userA = createUser("a", "a@test.com", "regularly", "similar", 1.0);
      const userB = createUser("b", "b@test.com", "regularly", "similar", 1.0);

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      expect(similarity).toBe(1.0);
    });
  });

  describe("Different answers with 'same' preference", () => {
    it("should score 0.0 when answers differ and both prefer 'same'", () => {
      const userA = createUser("a", "a@test.com", "never", "same", 1.0);
      const userB = createUser("b", "b@test.com", "regularly", "same", 1.0);

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      expect(similarity).toBe(0.0);
    });
  });

  describe("Adjacent values with 'similar' preference", () => {
    it("should score 0.5 for never → occasionally (1 step away)", () => {
      const userA = createUser("a", "a@test.com", "never", "similar", 1.0);
      const userB = createUser(
        "b",
        "b@test.com",
        "occasionally",
        "similar",
        1.0,
      );

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      // distance = 1, maxRange = 2, rawSimilarity = 1 - 1/2 = 0.5
      expect(similarity).toBe(0.5);
    });

    it("should score 0.5 for occasionally → regularly (1 step away)", () => {
      const userA = createUser(
        "a",
        "a@test.com",
        "occasionally",
        "similar",
        1.0,
      );
      const userB = createUser("b", "b@test.com", "regularly", "similar", 1.0);

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      expect(similarity).toBe(0.5);
    });
  });

  describe("Maximum distance", () => {
    it("should score 0.0 for never → regularly (2 steps away)", () => {
      const userA = createUser("a", "a@test.com", "never", "similar", 1.0);
      const userB = createUser("b", "b@test.com", "regularly", "similar", 1.0);

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      // distance = 2, maxRange = 2, rawSimilarity = 1 - 2/2 = 0.0
      expect(similarity).toBe(0.0);
    });
  });

  describe("Null preference (no preference = happy with anything)", () => {
    it("should score 1.0 when both users have null preference (both flexible)", () => {
      const userA: MatchingUser = {
        id: "a",
        email: "a@test.com",
        name: "User A",
        gender: "woman",
        interestedInGenders: ["men"],
        campus: "UBCV",
        okMatchingDifferentCampus: true,
        responses: {
          q9b: { answer: "never", preference: null, importance: 1.0 },
        },
        responseRecord: {} as any,
      };
      const userB: MatchingUser = {
        id: "b",
        email: "b@test.com",
        name: "User B",
        gender: "woman",
        interestedInGenders: ["men"],
        campus: "UBCV",
        okMatchingDifferentCampus: true,
        responses: {
          q9b: { answer: "occasionally", preference: null, importance: 1.0 },
        },
        responseRecord: {} as any,
      };

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      // Both have null preference = both are happy with anything = 1.0
      expect(similarity).toBe(1.0);
    });
  });

  describe("Mixed preferences", () => {
    it("should average satisfaction when one prefers 'same' and other prefers 'similar'", () => {
      const userA = createUser("a", "a@test.com", "never", "same", 1.0);
      const userB = createUser(
        "b",
        "b@test.com",
        "occasionally",
        "similar",
        1.0,
      );

      const similarity = calculateQuestionSimilarity(
        "q9b",
        userA,
        userB,
        "ordinal",
        MATCHING_CONFIG,
      );

      // A wants 'same' but answers differ → aSatisfied = 0.0
      // B wants 'similar' with rawSimilarity = 0.5 → bSatisfied = 0.5
      // average = (0.0 + 0.5) / 2 = 0.25
      expect(similarity).toBe(0.25);
    });
  });
});
