/**
 * Tests for Phase 8: Global Matching with Blossom Algorithm
 */

import { describe, it, expect } from "vitest";
import {
  runGlobalMatching,
  validateMatching,
  EligiblePair,
  MatchingResult,
} from "../blossom-matching";
import { MatchingUser } from "../types";

// Helper to create mock users
function createMockUsers(count: number): MatchingUser[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `user${i + 1}`,
    responses: {},
  }));
}

// Helper to create an eligible pair
function createPair(
  userAId: string,
  userBId: string,
  pairScore: number,
  scoreAtoB: number = pairScore,
  scoreBtoA: number = pairScore
): EligiblePair {
  return {
    userAId,
    userBId,
    pairScore,
    scoreAtoB,
    scoreBtoA,
  };
}

describe("Global Matching - Phase 8", () => {
  describe("runGlobalMatching", () => {
    it("should handle empty user pool", () => {
      const users: MatchingUser[] = [];
      const pairs: EligiblePair[] = [];

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);
      expect(result.stats.totalUsers).toBe(0);
      expect(result.stats.matchesCreated).toBe(0);
    });

    it("should handle single user with no pairs", () => {
      const users = createMockUsers(1);
      const pairs: EligiblePair[] = [];

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(0);
      expect(result.unmatched).toHaveLength(1);
      expect(result.unmatched[0].userId).toBe("user1");
      expect(result.unmatched[0].reason).toBe("No eligible pairs found");
    });

    it("should match a perfect pair", () => {
      const users = createMockUsers(2);
      const pairs = [createPair("user1", "user2", 95, 96, 94)];

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(1);
      expect(result.unmatched).toHaveLength(0);

      const match = result.matched[0];
      expect([match.userAId, match.userBId].sort()).toEqual(["user1", "user2"]);
      expect(match.pairScore).toBe(95);

      // Check stats
      expect(result.stats.totalUsers).toBe(2);
      expect(result.stats.matchesCreated).toBe(1);
      expect(result.stats.unmatchedUsers).toBe(0);
      expect(result.stats.averagePairScore).toBe(95);
      expect(result.stats.maxPairScore).toBe(95);
    });

    it("should handle odd number of users (one unmatched)", () => {
      const users = createMockUsers(3);
      const pairs = [
        createPair("user1", "user2", 90),
        createPair("user1", "user3", 70),
        createPair("user2", "user3", 60),
      ];

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(1);
      expect(result.unmatched).toHaveLength(1);

      // Blossom should choose the best match (user1-user2 with score 90)
      const match = result.matched[0];
      expect([match.userAId, match.userBId].sort()).toEqual(["user1", "user2"]);
      expect(match.pairScore).toBe(90);

      // user3 should be unmatched
      expect(result.unmatched[0].userId).toBe("user3");
      expect(result.unmatched[0].bestPossibleScore).toBe(70);
    });

    it("should maximize global weight (avoid greedy suboptimal solution)", () => {
      // Classic example where greedy fails:
      // user1-user2: 60, user1-user3: 50, user2-user4: 50, user3-user4: 60
      // Greedy might pick user1-user2 (60) first, leaving user3-user4 (60) = 120 total
      // Optimal: user1-user3 (50) + user2-user4 (50) = 100, BUT...
      // Actually optimal: user1-user2 (60) + user3-user4 (60) = 120
      // Let's create a better example:
      // user1-user2: 80, user3-user4: 80
      // user1-user3: 90, user2-user4: 90
      // Greedy might pick user1-user2 (80), leaving user3-user4 (80) = 160
      // Optimal: user1-user3 (90) + user2-user4 (90) = 180

      const users = createMockUsers(4);
      const pairs = [
        createPair("user1", "user2", 80),
        createPair("user3", "user4", 80),
        createPair("user1", "user3", 90),
        createPair("user2", "user4", 90),
      ];

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(2);
      expect(result.unmatched).toHaveLength(0);

      // Calculate total weight
      const totalWeight = result.matched.reduce(
        (sum, m) => sum + m.pairScore,
        0
      );
      expect(totalWeight).toBe(180); // Optimal solution

      // Check that we got the optimal pairs
      const matchedPairs = result.matched
        .map((m) => [m.userAId, m.userBId].sort().join("-"))
        .sort();
      expect(matchedPairs).toEqual(["user1-user3", "user2-user4"]);
    });

    it("should handle multiple eligible pairs and choose optimal matching", () => {
      const users = createMockUsers(6);
      const pairs = [
        createPair("user1", "user2", 95),
        createPair("user3", "user4", 90),
        createPair("user5", "user6", 85),
        createPair("user1", "user4", 70),
        createPair("user2", "user3", 75),
      ];

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(3);
      expect(result.unmatched).toHaveLength(0);

      // All users should be matched
      const matchedUserIds = new Set<string>();
      result.matched.forEach((m) => {
        matchedUserIds.add(m.userAId);
        matchedUserIds.add(m.userBId);
      });
      expect(matchedUserIds.size).toBe(6);
    });

    it("should handle scenario where some users have no eligible pairs", () => {
      const users = createMockUsers(4);
      const pairs = [
        createPair("user1", "user2", 80),
        // user3 and user4 have no eligible pairs
      ];

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(1);
      expect(result.unmatched).toHaveLength(2);

      // Check matched pair
      const match = result.matched[0];
      expect([match.userAId, match.userBId].sort()).toEqual(["user1", "user2"]);

      // Check unmatched users
      const unmatchedIds = result.unmatched.map((u) => u.userId).sort();
      expect(unmatchedIds).toEqual(["user3", "user4"]);
      expect(result.unmatched[0].reason).toContain("No eligible pairs");
    });

    it("should correctly identify when best match was paired with someone else", () => {
      const users = createMockUsers(3);
      const pairs = [
        createPair("user1", "user2", 95),
        createPair("user2", "user3", 70),
      ];

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(1);
      expect(result.unmatched).toHaveLength(1);

      // user1-user2 should be matched (higher score)
      const match = result.matched[0];
      expect([match.userAId, match.userBId].sort()).toEqual(["user1", "user2"]);

      // user3 should be unmatched because user2 was paired with user1
      const unmatched = result.unmatched[0];
      expect(unmatched.userId).toBe("user3");
      expect(unmatched.reason).toContain(
        "Best match was paired with someone else"
      );
      expect(unmatched.bestPossibleScore).toBe(70);
      expect(unmatched.bestPossibleMatchId).toBe("user2");
    });

    it("should handle large batch (10 users)", () => {
      const users = createMockUsers(10);
      const pairs: EligiblePair[] = [];

      // Create pairs for all combinations with random scores
      for (let i = 1; i <= 10; i++) {
        for (let j = i + 1; j <= 10; j++) {
          const score = 50 + Math.random() * 40; // 50-90 range
          pairs.push(createPair(`user${i}`, `user${j}`, score));
        }
      }

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(5); // 10 users = 5 matches
      expect(result.unmatched).toHaveLength(0);
      expect(result.stats.totalUsers).toBe(10);
      expect(result.stats.matchesCreated).toBe(5);

      // Verify no duplicate matches
      const validation = validateMatching(result.matched);
      expect(validation.isValid).toBe(true);
    });

    it("should handle large batch (50 users) efficiently", () => {
      const users = createMockUsers(50);
      const pairs: EligiblePair[] = [];

      // Create pairs for subset of combinations (not all pairs are eligible)
      for (let i = 1; i <= 50; i++) {
        for (let j = i + 1; j <= 50; j++) {
          // Only create pair if they meet some arbitrary criteria
          if ((i + j) % 3 === 0) {
            const score = 50 + Math.random() * 40;
            pairs.push(createPair(`user${i}`, `user${j}`, score));
          }
        }
      }

      const startTime = Date.now();
      const result = runGlobalMatching(users, pairs);
      const duration = Date.now() - startTime;

      expect(result.matched.length).toBeGreaterThan(0);
      expect(result.stats.totalUsers).toBe(50);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds

      // Verify matching validity
      const validation = validateMatching(result.matched);
      expect(validation.isValid).toBe(true);
    });

    it("should calculate statistics correctly", () => {
      const users = createMockUsers(6);
      const pairs = [
        createPair("user1", "user2", 95),
        createPair("user3", "user4", 75),
        createPair("user5", "user6", 85),
      ];

      const result = runGlobalMatching(users, pairs);

      expect(result.stats.totalUsers).toBe(6);
      expect(result.stats.eligiblePairs).toBe(3);
      expect(result.stats.matchesCreated).toBe(3);
      expect(result.stats.unmatchedUsers).toBe(0);
      expect(result.stats.averagePairScore).toBeCloseTo(85, 1);
      expect(result.stats.medianPairScore).toBe(85);
      expect(result.stats.minPairScore).toBe(75);
      expect(result.stats.maxPairScore).toBe(95);
    });

    it("should preserve directional scores in match results", () => {
      const users = createMockUsers(2);
      const pairs = [createPair("user1", "user2", 80, 85, 75)];

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(1);

      const match = result.matched[0];
      expect(match.pairScore).toBe(80);

      // Check directional scores are preserved correctly
      if (match.userAId === "user1") {
        expect(match.scoreAtoB).toBe(85);
        expect(match.scoreBtoA).toBe(75);
      } else {
        expect(match.scoreAtoB).toBe(75);
        expect(match.scoreBtoA).toBe(85);
      }
    });
  });

  describe("validateMatching", () => {
    it("should validate correct matching", () => {
      const matched = [
        {
          userAId: "user1",
          userBId: "user2",
          pairScore: 80,
          scoreAtoB: 80,
          scoreBtoA: 80,
        },
        {
          userAId: "user3",
          userBId: "user4",
          pairScore: 75,
          scoreAtoB: 75,
          scoreBtoA: 75,
        },
      ];

      const result = validateMatching(matched);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect duplicate user assignments", () => {
      const matched = [
        {
          userAId: "user1",
          userBId: "user2",
          pairScore: 80,
          scoreAtoB: 80,
          scoreBtoA: 80,
        },
        {
          userAId: "user1",
          userBId: "user3",
          pairScore: 75,
          scoreAtoB: 75,
          scoreBtoA: 75,
        },
      ];

      const result = validateMatching(matched);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("user1");
      expect(result.errors[0]).toContain("multiple matches");
    });

    it("should detect self-matches", () => {
      const matched = [
        {
          userAId: "user1",
          userBId: "user1",
          pairScore: 80,
          scoreAtoB: 80,
          scoreBtoA: 80,
        },
      ];

      const result = validateMatching(matched);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("matched with themselves");
    });

    it("should detect invalid scores", () => {
      const matched = [
        {
          userAId: "user1",
          userBId: "user2",
          pairScore: 150,
          scoreAtoB: 150,
          scoreBtoA: 150,
        },
      ];

      const result = validateMatching(matched);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Invalid pair score");
    });

    it("should handle empty matching", () => {
      const matched: any[] = [];

      const result = validateMatching(matched);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle triangle scenario (A prefers B, B prefers C, C prefers A)", () => {
      const users = createMockUsers(3);
      const pairs = [
        createPair("user1", "user2", 70, 90, 50), // A loves B, B lukewarm on A
        createPair("user2", "user3", 70, 90, 50), // B loves C, C lukewarm on B
        createPair("user3", "user1", 70, 90, 50), // C loves A, A lukewarm on C
      ];

      const result = runGlobalMatching(users, pairs);

      // One pair will be matched, one user unmatched
      expect(result.matched).toHaveLength(1);
      expect(result.unmatched).toHaveLength(1);

      // All pairs have same weight, so any match is equally optimal
      expect(result.matched[0].pairScore).toBe(70);
    });

    it("should handle fully connected graph (everyone eligible with everyone)", () => {
      const users = createMockUsers(6);
      const pairs: EligiblePair[] = [];

      for (let i = 1; i <= 6; i++) {
        for (let j = i + 1; j <= 6; j++) {
          pairs.push(createPair(`user${i}`, `user${j}`, 60 + i + j));
        }
      }

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(3);
      expect(result.unmatched).toHaveLength(0);

      // Verify validity
      const validation = validateMatching(result.matched);
      expect(validation.isValid).toBe(true);
    });

    it("should handle disconnected components (separate groups with no cross-connections)", () => {
      const users = createMockUsers(6);
      const pairs = [
        // Group 1: user1, user2, user3
        createPair("user1", "user2", 90),
        createPair("user2", "user3", 80),
        createPair("user1", "user3", 70),
        // Group 2: user4, user5, user6
        createPair("user4", "user5", 85),
        createPair("user5", "user6", 75),
        createPair("user4", "user6", 65),
      ];

      const result = runGlobalMatching(users, pairs);

      expect(result.matched).toHaveLength(2);
      expect(result.unmatched).toHaveLength(2);

      // Each group should have one match, one unmatched
      const validation = validateMatching(result.matched);
      expect(validation.isValid).toBe(true);
    });

    it("should handle single pair with very low score", () => {
      const users = createMockUsers(2);
      const pairs = [
        createPair("user1", "user2", 10), // Very low compatibility
      ];

      const result = runGlobalMatching(users, pairs);

      // Algorithm doesn't filter by minimum score (that's Phase 7's job)
      // It just finds optimal matching given eligible pairs
      expect(result.matched).toHaveLength(1);
      expect(result.matched[0].pairScore).toBe(10);
    });
  });
});
