/**
 * Tests for Q26 string preference handling and hard filter questions
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

describe("Q26: String Preferences (same/similar)", () => {
  it("should return 1.0 when both select same answer with similar preference", () => {
    const userA = createMockUser("a", {
      q26: {
        answer: "frequent",
        preference: "similar",
        importance: "somewhat_important",
      },
    });

    const userB = createMockUser("b", {
      q26: {
        answer: "frequent",
        preference: "similar",
        importance: "important",
      },
    });

    const similarities = calculateSimilarity(userA, userB);
    expect(similarities.q26).toBe(1.0);
  });

  it("should score based on ordinal distance with similar preference", () => {
    const userA = createMockUser("a", {
      q26: {
        answer: "minimal",
        preference: "similar",
        importance: "important",
      },
    });

    const userB = createMockUser("b", {
      q26: {
        answer: "moderate",
        preference: "similar",
        importance: "important",
      },
    });

    const similarities = calculateSimilarity(userA, userB);
    // Distance: |1 - 2| = 1, formula: 1 - 1/3 = 0.667
    // Both have similar preference, so average is same value
    expect(similarities.q26).toBeCloseTo(0.667, 2);
  });

  it("should return 1.0 with same preference when answers match", () => {
    const userA = createMockUser("a", {
      q26: {
        answer: "constant",
        preference: "same",
        importance: "important",
      },
    });

    const userB = createMockUser("b", {
      q26: {
        answer: "constant",
        preference: "same",
        importance: "important",
      },
    });

    const similarities = calculateSimilarity(userA, userB);
    expect(similarities.q26).toBe(1.0);
  });

  it("should return 0.0 with same preference when answers don't match", () => {
    const userA = createMockUser("a", {
      q26: {
        answer: "minimal",
        preference: "same",
        importance: "important",
      },
    });

    const userB = createMockUser("b", {
      q26: {
        answer: "frequent",
        preference: "same",
        importance: "important",
      },
    });

    const similarities = calculateSimilarity(userA, userB);
    expect(similarities.q26).toBe(0.0);
  });

  it("should return 1.0 with whatever_feels_natural regardless of other answer", () => {
    const userA = createMockUser("a", {
      q26: {
        answer: "minimal",
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
});

describe("Hard Filter Questions: Q1 and Q2", () => {
  it("should return 0.0 for Q1 (hard filter)", () => {
    const userA = createMockUser("a", {
      q1: {
        answer: "man",
        importance: "very_important",
      },
    });

    const userB = createMockUser("b", {
      q1: {
        answer: "man",
        importance: "very_important",
      },
    });

    const similarities = calculateSimilarity(userA, userB);
    expect(similarities.q1).toBe(0.0);
  });

  it("should return 0.0 for Q2 (hard filter)", () => {
    const userA = createMockUser("a", {
      q2: {
        answer: ["men"],
        importance: "very_important",
      },
    });

    const userB = createMockUser("b", {
      q2: {
        answer: ["men", "women", "non_binary"],
        importance: "very_important",
      },
    });

    const similarities = calculateSimilarity(userA, userB);
    expect(similarities.q2).toBe(0.0);
  });

  it("should exclude Q1 from scoring even when answers match", () => {
    const userA = createMockUser("a", {
      q1: {
        answer: "woman",
        importance: "very_important",
      },
    });

    const userB = createMockUser("b", {
      q1: {
        answer: "woman",
        importance: "very_important",
      },
    });

    const similarities = calculateSimilarity(userA, userB);
    // Hard filter, always 0.0 even with matching answers
    expect(similarities.q1).toBe(0.0);
  });
});
