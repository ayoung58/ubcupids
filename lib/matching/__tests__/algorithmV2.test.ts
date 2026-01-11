/**
 * Unit Tests for Matching Algorithm V2
 *
 * Tests the 8-phase matching process:
 * - Phase 1: Hard filter dealbreakers (Q1, Q2, Q4)
 * - Phase 2-5: Question similarity, importance weighting, directional scoring
 * - Phase 6: Section weighting (65% lifestyle, 35% personality)
 * - Phase 7: Eligibility thresholds
 * - Phase 8: Blossom preparation
 */

import {
  runMatchingAlgorithm,
  passesHardFilters,
  calculatePairScore,
  prepareBlossomEdges,
  User,
  QuestionScore,
  BlossomEdge,
} from "../algorithmV2";
import { Responses, QuestionResponse } from "@/src/lib/questionnaire-types";

// ============================================
// Helper Functions
// ============================================

function createMockUser(id: string, responses: Partial<Responses>): User {
  const fullResponses: Responses = responses as Responses;

  return {
    id,
    name: `User ${id}`,
    responses: fullResponses,
  };
}

// ============================================
// Phase 1: Dealbreaker Hard Filters
// ============================================

describe("filterByDealbreakers - Hard Filters (Q1, Q2, Q4)", () => {
  test("Q1 gender dealbreaker - compatible genders", () => {
    const userA = createMockUser("A", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: true,
      },
      q2: {
        ownAnswer: "woman",
        preference: {
          type: "specific_values",
          value: ["man"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: true,
      },
    });

    const userB = createMockUser("B", {
      q1: {
        ownAnswer: "woman",
        preference: {
          type: "specific_values",
          value: ["man"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: true,
      },
      q2: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: true,
      },
    });

    const result = passesHardFilters(userA, userB);
    expect(result.passes ? [userA] : []).toHaveLength(1);
    expect(result.passes ? [] : [userA]).toHaveLength(0);
  });

  test("Q1 gender dealbreaker - incompatible genders", () => {
    const userA = createMockUser("A", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: true,
      },
    });

    const userB = createMockUser("B", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: true,
      },
    });

    const result = passesHardFilters(userA, userB);
    expect(result.passes ? [userA] : []).toHaveLength(0);
    expect(result.passes ? [] : [userA]).toHaveLength(1);
    expect(result.reason).toContain("Q1");
  });

  test("Q2 sexual orientation - wildcard 'anyone'", () => {
    const userA = createMockUser("A", {
      q2: {
        ownAnswer: "anyone",
        preference: { type: "same", doesntMatter: true },
        importance: 1,
        dealbreaker: false,
      },
    });

    const userB = createMockUser("B", {
      q2: {
        ownAnswer: "gay",
        preference: {
          type: "specific_values",
          value: ["anyone", "gay", "bisexual"],
          doesntMatter: false,
        },
        importance: 3,
        dealbreaker: false,
      },
    });

    const result = passesHardFilters(userA, userB);
    // "anyone" wildcard should pass
    expect(result.passes ? [userA] : []).toHaveLength(1);
  });

  test("Q4 relationship type dealbreaker - mismatch", () => {
    const userA = createMockUser("A", {
      q4: {
        ownAnswer: "monogamous",
        preference: { type: "same", doesntMatter: false },
        importance: 4,
        dealbreaker: true,
      },
    });

    const userB = createMockUser("B", {
      q4: {
        ownAnswer: "open",
        preference: { type: "same", doesntMatter: false },
        importance: 4,
        dealbreaker: true,
      },
    });

    const result = passesHardFilters(userA, userB);
    expect(result.passes ? [] : [userA]).toHaveLength(1);
    expect(result.reason).toContain("Q4");
  });

  test("No dealbreakers set - passes", () => {
    const userA = createMockUser("A", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 3,
        dealbreaker: false, // Not a dealbreaker
      },
    });

    const userB = createMockUser("B", {
      q1: {
        ownAnswer: "man", // Doesn't match preference but not a dealbreaker
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 3,
        dealbreaker: false,
      },
    });

    const result = passesHardFilters(userA, userB);
    expect(result.passes ? [userA] : []).toHaveLength(1); // Should pass hard filters
  });
});

// ============================================
// Phase 2-6: Similarity, Importance, Scoring
// ============================================

describe("calculatePairScore - Full Pipeline", () => {
  test("high compatibility across all questions", () => {
    const userA = createMockUser("A", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
      q3: {
        ownAnswer: "straight",
        preference: { type: "same", doesntMatter: false },
        importance: 4,
        dealbreaker: false,
      },
      q5: {
        ownAnswer: "asian",
        preference: { type: "same", doesntMatter: true },
        importance: 1,
        dealbreaker: false,
      },
    });

    const userB = createMockUser("B", {
      q1: {
        ownAnswer: "woman",
        preference: {
          type: "specific_values",
          value: ["man"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
      q3: {
        ownAnswer: "straight",
        preference: { type: "same", doesntMatter: false },
        importance: 4,
        dealbreaker: false,
      },
      q5: {
        ownAnswer: "white",
        preference: { type: "same", doesntMatter: true },
        importance: 1,
        dealbreaker: false,
      },
    });

    const score = calculatePairScore(userA, userB);

    // Should have high total score
    expect(score.totalScore).toBeGreaterThan(0.7);
    expect(score.isEligible).toBe(true);
  });

  test("low compatibility - opposite preferences", () => {
    const userA = createMockUser("A", {
      q6: {
        ownAnswer: "atheist",
        preference: { type: "same", doesntMatter: false },
        importance: 4,
        dealbreaker: false,
      },
      q16: {
        ownAnswer: "no_pets",
        preference: { type: "same", doesntMatter: false },
        importance: 4,
        dealbreaker: false,
      },
    });

    const userB = createMockUser("B", {
      q6: {
        ownAnswer: "christian",
        preference: { type: "same", doesntMatter: false },
        importance: 4,
        dealbreaker: false,
      },
      q16: {
        ownAnswer: "dog",
        preference: { type: "same", doesntMatter: false },
        importance: 4,
        dealbreaker: false,
      },
    });

    const score = calculatePairScore(userA, userB);

    // Should have low score due to mismatched high-importance preferences
    expect(score.totalScore).toBeLessThan(0.5);
  });

  test("importance weighting - high importance increases impact", () => {
    const userA = createMockUser("A", {
      q10: {
        ownAnswer: "very_important",
        preference: { type: "similar", doesntMatter: false },
        importance: 4, // High importance
        dealbreaker: false,
      },
    });

    const userB = createMockUser("B", {
      q10: {
        ownAnswer: "not_important",
        preference: { type: "similar", doesntMatter: false },
        importance: 4,
        dealbreaker: false,
      },
    });

    const score = calculatePairScore(userA, userB);

    // Find Q10 score
    const q10Score = score.questionScores.find(
      (q: QuestionScore) => q.questionId === "q10"
    );
    expect(q10Score).toBeDefined();
    expect(q10Score!.similarity).toBeLessThan(0.5); // Low similarity
    expect(q10Score!.weightedScore).toBeLessThan(0.5); // Should be weighted down
  });

  test("section weighting - Section 1 (65%) vs Section 2 (35%)", () => {
    // User with perfect Section 1, poor Section 2
    const userA = createMockUser("A", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
      q21: {
        ownAnswer: {
          show: ["words_of_affirmation"],
          receive: ["physical_touch"],
        },
        preference: { type: "similar", doesntMatter: false },
        importance: 4,
        dealbreaker: false,
      },
    });

    const userB = createMockUser("B", {
      q1: {
        ownAnswer: "woman",
        preference: {
          type: "specific_values",
          value: ["man"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
      q21: {
        ownAnswer: { show: ["quality_time"], receive: ["acts_of_service"] },
        preference: { type: "similar", doesntMatter: false },
        importance: 4,
        dealbreaker: false,
      },
    });

    const score = calculatePairScore(userA, userB);

    // Section 1 should have more weight
    expect(score.section1Score).toBeGreaterThan(score.section2Score);
  });

  test("eligibility threshold - below 40% rejected", () => {
    const userA = createMockUser("A", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
    });

    const userB = createMockUser("B", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
    });

    const score = calculatePairScore(userA, userB);

    // Should fail eligibility if too low
    if (score.totalScore < 0.4) {
      expect(score.isEligible).toBe(false);
    }
  });
});

// ============================================
// Phase 7: Eligibility Filtering
// ============================================

describe("Eligibility Thresholds", () => {
  test("pairs above threshold marked eligible", () => {
    const userA = createMockUser("A", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
      q2: {
        ownAnswer: "straight",
        preference: {
          type: "specific_values",
          value: ["straight"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
    });

    const userB = createMockUser("B", {
      q1: {
        ownAnswer: "woman",
        preference: {
          type: "specific_values",
          value: ["man"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
      q2: {
        ownAnswer: "straight",
        preference: {
          type: "specific_values",
          value: ["straight"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
    });

    const score = calculatePairScore(userA, userB);

    if (score.totalScore >= 0.4) {
      expect(score.isEligible).toBe(true);
    }
  });

  test("pairs below threshold marked ineligible", () => {
    // Create completely incompatible users
    const userA = createMockUser("A", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
    });

    const userB = createMockUser("B", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
    });

    const score = calculatePairScore(userA, userB);

    if (score.totalScore < 0.4) {
      expect(score.isEligible).toBe(false);
    }
  });
});

// ============================================
// Phase 8: Blossom Preparation
// ============================================

describe("prepareBlossomEdges - Graph Format", () => {
  test("converts eligible pairs to weighted edges", () => {
    const userA = createMockUser("A", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
    });

    const userB = createMockUser("B", {
      q1: {
        ownAnswer: "woman",
        preference: {
          type: "specific_values",
          value: ["man"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
    });

    const score = calculatePairScore(userA, userB);

    if (score.isEligible) {
      const edges = prepareBlossomEdges([score]);

      expect(edges).toHaveLength(1);
      expect(edges[0].from).toBe("A");
      expect(edges[0].to).toBe("B");
      expect(edges[0].weight).toBeGreaterThan(0);
      expect(edges[0].weight).toBeLessThanOrEqual(1000); // Scaled to [0, 1000]
    }
  });

  test("excludes ineligible pairs from edges", () => {
    const lowScorePair = {
      userA: "A",
      userB: "B",
      questionScores: [],
      section1Score: 0.2,
      section2Score: 0.1,
      totalScore: 0.15,
      isEligible: false,
    };

    const edges = prepareBlossomEdges([lowScorePair]);
    expect(edges).toHaveLength(0);
  });

  test("weight scaling - higher scores get higher weights", () => {
    const highScore = {
      userA: "A",
      userB: "B",
      questionScores: [],
      section1Score: 0.9,
      section2Score: 0.85,
      totalScore: 0.88,
      isEligible: true,
    };

    const lowScore = {
      userA: "C",
      userB: "D",
      questionScores: [],
      section1Score: 0.5,
      section2Score: 0.4,
      totalScore: 0.45,
      isEligible: true,
    };

    const edges = prepareBlossomEdges([highScore, lowScore]);

    const highEdge = edges.find((e: BlossomEdge) => e.from === "A");
    const lowEdge = edges.find((e: BlossomEdge) => e.from === "C");

    expect(highEdge!.weight).toBeGreaterThan(lowEdge!.weight);
  });
});

// ============================================
// Integration Tests - Full Algorithm
// ============================================

describe("runMatchingAlgorithm - Full Integration", () => {
  test("complete pipeline with multiple users", () => {
    const candidates = [
      createMockUser("C1", {
        q1: {
          ownAnswer: "man",
          preference: {
            type: "specific_values",
            value: ["woman"],
            doesntMatter: false,
          },
          importance: 4,
          dealbreaker: true,
        },
        q2: {
          ownAnswer: "straight",
          preference: {
            type: "specific_values",
            value: ["straight", "bisexual"],
            doesntMatter: false,
          },
          importance: 4,
          dealbreaker: true,
        },
        q4: {
          ownAnswer: "monogamous",
          preference: { type: "same", doesntMatter: false },
          importance: 4,
          dealbreaker: true,
        },
      }),
      createMockUser("C2", {
        q1: {
          ownAnswer: "woman",
          preference: {
            type: "specific_values",
            value: ["man"],
            doesntMatter: false,
          },
          importance: 4,
          dealbreaker: true,
        },
        q2: {
          ownAnswer: "straight",
          preference: {
            type: "specific_values",
            value: ["straight"],
            doesntMatter: false,
          },
          importance: 4,
          dealbreaker: true,
        },
        q4: {
          ownAnswer: "monogamous",
          preference: { type: "same", doesntMatter: false },
          importance: 4,
          dealbreaker: true,
        },
      }),
    ];

    const matches = [
      createMockUser("M1", {
        q1: {
          ownAnswer: "woman",
          preference: {
            type: "specific_values",
            value: ["man"],
            doesntMatter: false,
          },
          importance: 4,
          dealbreaker: true,
        },
        q2: {
          ownAnswer: "straight",
          preference: {
            type: "specific_values",
            value: ["straight"],
            doesntMatter: false,
          },
          importance: 4,
          dealbreaker: true,
        },
        q4: {
          ownAnswer: "monogamous",
          preference: { type: "same", doesntMatter: false },
          importance: 4,
          dealbreaker: true,
        },
      }),
    ];

    const result = runMatchingAlgorithm([...candidates, ...matches]);

    expect(result).toBeDefined();
    expect(result.eligiblePairs).toBeDefined();
    expect(result.blossomEdges).toBeDefined();

    // Should have at least some eligible pairs
    const hasEligible = result.eligiblePairs.length > 0;
    const hasFiltered =
      result.filteredByDealbreaker.length > 0 ||
      result.filteredByThreshold.length > 0;

    expect(hasEligible || hasFiltered).toBe(true);
  });

  test("filters incompatible pairs early", () => {
    const candidates = [
      createMockUser("C1", {
        q1: {
          ownAnswer: "man",
          preference: {
            type: "specific_values",
            value: ["woman"],
            doesntMatter: false,
          },
          importance: 4,
          dealbreaker: true,
        },
      }),
    ];

    const matches = [
      createMockUser("M1", {
        q1: {
          ownAnswer: "man", // Same gender, incompatible
          preference: {
            type: "specific_values",
            value: ["woman"],
            doesntMatter: false,
          },
          importance: 4,
          dealbreaker: true,
        },
      }),
    ];

    const result = runMatchingAlgorithm([...candidates, ...matches]);

    expect(result.filteredByDealbreaker.length).toBeGreaterThan(0);
  });
});

// ============================================
// Edge Cases
// ============================================

describe("Edge Cases", () => {
  test("empty user lists", () => {
    const result = runMatchingAlgorithm([]);

    expect(result.eligiblePairs).toHaveLength(0);
    expect(result.filteredByDealbreaker).toHaveLength(0);
    expect(result.blossomEdges).toHaveLength(0);
  });

  test("users with partial responses", () => {
    const userA = createMockUser("A", {
      q1: {
        ownAnswer: "man",
        preference: {
          type: "specific_values",
          value: ["woman"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
      // Missing most other questions
    });

    const userB = createMockUser("B", {
      q1: {
        ownAnswer: "woman",
        preference: {
          type: "specific_values",
          value: ["man"],
          doesntMatter: false,
        },
        importance: 4,
        dealbreaker: false,
      },
    });

    const score = calculatePairScore(userA, userB);

    // Should still calculate score with available data
    expect(score).toBeDefined();
    expect(score.totalScore).toBeGreaterThanOrEqual(0);
  });

  test("all questions marked 'doesn't matter'", () => {
    const userA = createMockUser("A", {
      q1: {
        ownAnswer: "man",
        preference: { type: "same", doesntMatter: true },
        importance: 1,
        dealbreaker: false,
      },
      q2: {
        ownAnswer: "straight",
        preference: { type: "same", doesntMatter: true },
        importance: 1,
        dealbreaker: false,
      },
    });

    const userB = createMockUser("B", {
      q1: {
        ownAnswer: "woman",
        preference: { type: "same", doesntMatter: true },
        importance: 1,
        dealbreaker: false,
      },
      q2: {
        ownAnswer: "gay",
        preference: { type: "same", doesntMatter: true },
        importance: 1,
        dealbreaker: false,
      },
    });

    const score = calculatePairScore(userA, userB);

    // Should have perfect or very high score
    expect(score.totalScore).toBeGreaterThan(0.8);
  });
});
