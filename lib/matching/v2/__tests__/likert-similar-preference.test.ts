/**
 * Tests for Likert "similar" preference fix
 * All Likert questions with "similar" preference should use gradual scoring
 */

import { describe, it, expect } from "vitest";
import { calculateSimilarity } from "../similarity";
import { MatchingUser } from "../types";

describe("Likert Similar Preference - Gradual Distance-Based Scoring", () => {
  it("Q35: should score 0.5 when distance is 2 on 1-5 scale", () => {
    const userA: MatchingUser = {
      id: "a",
      responses: {
        q35: {
          answer: 4,
          preference: "similar",
          importance: "not_important",
        },
      },
    };

    const userB: MatchingUser = {
      id: "b",
      responses: {
        q35: {
          answer: 2,
          preference: "similar",
          importance: "somewhat_important",
        },
      },
    };

    const similarities = calculateSimilarity(userA, userB);
    // Formula: 1 - |4-2|/4 = 1 - 0.5 = 0.5
    expect(similarities.q35).toBe(0.5);
  });

  it("Q22: should score 0.0 when answers are at opposite ends (distance 4)", () => {
    const userA: MatchingUser = {
      id: "a",
      responses: {
        q22: {
          answer: 1,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const userB: MatchingUser = {
      id: "b",
      responses: {
        q22: {
          answer: 5,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const similarities = calculateSimilarity(userA, userB);
    // Formula: 1 - |1-5|/4 = 1 - 1 = 0.0
    expect(similarities.q22).toBe(0.0);
  });

  it("Q16: should score 0.75 when distance is 1 on 1-5 scale", () => {
    const userA: MatchingUser = {
      id: "a",
      responses: {
        q16: {
          answer: 3,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const userB: MatchingUser = {
      id: "b",
      responses: {
        q16: {
          answer: 4,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const similarities = calculateSimilarity(userA, userB);
    // Formula: 1 - |3-4|/4 = 1 - 0.25 = 0.75
    expect(similarities.q16).toBe(0.75);
  });

  it("Q7: should score 1.0 when answers are identical", () => {
    const userA: MatchingUser = {
      id: "a",
      responses: {
        q7: {
          answer: 3,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const userB: MatchingUser = {
      id: "b",
      responses: {
        q7: {
          answer: 3,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const similarities = calculateSimilarity(userA, userB);
    // Formula: 1 - |3-3|/4 = 1 - 0 = 1.0
    expect(similarities.q7).toBe(1.0);
  });

  it("Q10: should score 0.25 when distance is 3 on 1-5 scale", () => {
    const userA: MatchingUser = {
      id: "a",
      responses: {
        q10: {
          answer: 1,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const userB: MatchingUser = {
      id: "b",
      responses: {
        q10: {
          answer: 4,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const similarities = calculateSimilarity(userA, userB);
    // Formula: 1 - |1-4|/4 = 1 - 0.75 = 0.25
    expect(similarities.q10).toBeCloseTo(0.25, 2);
  });

  it("Q28: should score 0.5 when distance is 2", () => {
    const userA: MatchingUser = {
      id: "a",
      responses: {
        q28: {
          answer: 1,
          preference: "similar",
          importance: "somewhat_important",
        },
      },
    };

    const userB: MatchingUser = {
      id: "b",
      responses: {
        q28: {
          answer: 3,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const similarities = calculateSimilarity(userA, userB);
    // Formula: 1 - |1-3|/4 = 1 - 0.5 = 0.5
    expect(similarities.q28).toBe(0.5);
  });

  it("Q33: should score 0.75 when distance is 1", () => {
    const userA: MatchingUser = {
      id: "a",
      responses: {
        q33: {
          answer: 1,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const userB: MatchingUser = {
      id: "b",
      responses: {
        q33: {
          answer: 2,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const similarities = calculateSimilarity(userA, userB);
    // Formula: 1 - |1-2|/4 = 1 - 0.25 = 0.75
    expect(similarities.q33).toBe(0.75);
  });

  it("Q34: should score 0.75 when distance is 1", () => {
    const userA: MatchingUser = {
      id: "a",
      responses: {
        q34: {
          answer: 2,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const userB: MatchingUser = {
      id: "b",
      responses: {
        q34: {
          answer: 3,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const similarities = calculateSimilarity(userA, userB);
    // Formula: 1 - |2-3|/4 = 1 - 0.25 = 0.75
    expect(similarities.q34).toBe(0.75);
  });

  it("should handle null/undefined preference as 1.0 satisfaction", () => {
    const userA: MatchingUser = {
      id: "a",
      responses: {
        q27: {
          answer: 1,
          preference: "similar",
          importance: "important",
        },
      },
    };

    const userB: MatchingUser = {
      id: "b",
      responses: {
        q27: {
          answer: 5,
          preference: null,
          importance: "important",
        },
      },
    };

    const similarities = calculateSimilarity(userA, userB);
    // A's satisfaction: similar preference, raw sim = 1 - |1-5|/4 = 0.0
    // B's satisfaction: null preference = 1.0
    // Average: (0.0 + 1.0) / 2 = 0.5
    expect(similarities.q27).toBe(0.5);
  });
});
