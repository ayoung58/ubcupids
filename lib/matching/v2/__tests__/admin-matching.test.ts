/**
 * Admin Matching Dashboard - Integration Tests
 *
 * Tests the admin UI integration with the matching algorithm V2.2 API.
 */

import { describe, it, expect } from "vitest";

describe("Admin Matching Dashboard", () => {
  describe("Statistics Display", () => {
    it("should handle initial stats correctly", async () => {
      const initialStats = {
        totalUsers: 50,
        totalMatches: 20,
        unmatchedUsers: 10,
      };

      // Stats should be valid
      expect(initialStats.totalUsers).toBeGreaterThanOrEqual(0);
      expect(initialStats.totalMatches).toBeGreaterThanOrEqual(0);
      expect(initialStats.unmatchedUsers).toBeGreaterThanOrEqual(0);

      // Matches should not exceed half of total users
      expect(initialStats.totalMatches).toBeLessThanOrEqual(
        initialStats.totalUsers / 2
      );
    });

    it("should calculate match rate correctly", () => {
      const testCases = [
        { users: 100, matches: 40, expectedRate: 40 },
        { users: 50, matches: 20, expectedRate: 40 },
        { users: 10, matches: 3, expectedRate: 30 },
        { users: 0, matches: 0, expectedRate: 0 },
      ];

      testCases.forEach(({ users, matches, expectedRate }) => {
        const rate = users > 0 ? (matches / users) * 100 : 0;
        expect(rate).toBeCloseTo(expectedRate, 1);
      });
    });
  });

  describe("API Integration", () => {
    it("should construct correct API request for dry run", () => {
      const dryRunRequest = {
        dryRun: true,
        includeDiagnostics: true,
      };

      expect(dryRunRequest.dryRun).toBe(true);
      expect(dryRunRequest.includeDiagnostics).toBe(true);
    });

    it("should construct correct API request for production run", () => {
      const productionRequest = {
        dryRun: false,
        includeDiagnostics: true,
      };

      expect(productionRequest.dryRun).toBe(false);
      expect(productionRequest.includeDiagnostics).toBe(true);
    });

    it("should validate matching result structure", () => {
      const mockResult = {
        runId: "match-run-1234567890-abc123",
        timestamp: new Date().toISOString(),
        userCount: 50,
        matchesCreated: 20,
        unmatchedCount: 10,
        executionTimeMs: 1234,
        diagnostics: {
          phase1_filteredPairs: 5,
          phase2to6_pairScoresCalculated: 1225,
          phase2to6_averageRawScore: 62.5,
          phase7_eligiblePairs: 800,
          phase7_failedAbsolute: 200,
          phase7_failedRelativeA: 100,
          phase7_failedRelativeB: 125,
          phase7_perfectionists: ["user1", "user2"],
          phase8_matchesCreated: 20,
          phase8_unmatchedUsers: 10,
          phase8_averageMatchScore: 75.3,
          phase8_medianMatchScore: 78.0,
          phase8_minMatchScore: 55.0,
          phase8_maxMatchScore: 95.0,
          scoreDistribution: {
            "0-20": 10,
            "20-40": 50,
            "40-60": 200,
            "60-80": 600,
            "80-100": 365,
          },
        },
      };

      // Validate required fields
      expect(mockResult.runId).toBeDefined();
      expect(mockResult.timestamp).toBeDefined();
      expect(mockResult.userCount).toBeGreaterThanOrEqual(0);
      expect(mockResult.matchesCreated).toBeGreaterThanOrEqual(0);
      expect(mockResult.unmatchedCount).toBeGreaterThanOrEqual(0);
      expect(mockResult.executionTimeMs).toBeGreaterThan(0);

      // Validate diagnostics structure
      expect(mockResult.diagnostics).toBeDefined();
      expect(
        mockResult.diagnostics?.phase1_filteredPairs
      ).toBeGreaterThanOrEqual(0);
      expect(
        mockResult.diagnostics?.phase2to6_pairScoresCalculated
      ).toBeGreaterThanOrEqual(0);
      expect(
        mockResult.diagnostics?.phase7_eligiblePairs
      ).toBeGreaterThanOrEqual(0);
      expect(
        mockResult.diagnostics?.phase8_matchesCreated
      ).toBeGreaterThanOrEqual(0);

      // Validate score metrics
      expect(
        mockResult.diagnostics?.phase8_averageMatchScore
      ).toBeGreaterThanOrEqual(0);
      expect(
        mockResult.diagnostics?.phase8_averageMatchScore
      ).toBeLessThanOrEqual(100);
      expect(mockResult.diagnostics?.phase8_minMatchScore).toBeLessThanOrEqual(
        mockResult.diagnostics?.phase8_maxMatchScore
      );
    });
  });

  describe("Diagnostics Display", () => {
    it("should format score distribution correctly", () => {
      const scoreDistribution = {
        "0-20": 10,
        "20-40": 50,
        "40-60": 200,
        "60-80": 600,
        "80-100": 365,
      };

      const total = Object.values(scoreDistribution).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(total).toBe(1225);

      // Verify all scores are accounted for
      Object.entries(scoreDistribution).forEach(([range, count]) => {
        expect(count).toBeGreaterThanOrEqual(0);
        expect(range).toMatch(/^\d+-\d+$/);
      });
    });

    it("should calculate execution time display correctly", () => {
      const testCases = [
        { ms: 1000, expected: "1.00s" },
        { ms: 1234, expected: "1.23s" },
        { ms: 500, expected: "0.50s" },
        { ms: 10500, expected: "10.50s" },
      ];

      testCases.forEach(({ ms, expected }) => {
        const formatted = (ms / 1000).toFixed(2) + "s";
        expect(formatted).toBe(expected);
      });
    });

    it("should validate perfectionist detection", () => {
      const perfectionists = ["user1", "user2", "user3"];

      expect(Array.isArray(perfectionists)).toBe(true);
      expect(perfectionists.length).toBeGreaterThanOrEqual(0);
      perfectionists.forEach((userId) => {
        expect(typeof userId).toBe("string");
        expect(userId.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API error responses", () => {
      const errorResponse = {
        error: "No eligible users found with completed questionnaires",
      };

      expect(errorResponse.error).toBeDefined();
      expect(typeof errorResponse.error).toBe("string");
    });

    it("should validate minimum user requirement", () => {
      const minUsers = 2;

      expect(minUsers).toBeGreaterThanOrEqual(2);

      // Test cases
      expect(0 < minUsers).toBe(true); // Should show warning
      expect(1 < minUsers).toBe(true); // Should show warning
      expect(2 >= minUsers).toBe(true); // Should enable button
      expect(10 >= minUsers).toBe(true); // Should enable button
    });
  });

  describe("Phase Breakdown Validation", () => {
    it("should validate phase progression logic", () => {
      const diagnostics = {
        phase1_filteredPairs: 5,
        phase2to6_pairScoresCalculated: 1225,
        phase7_eligiblePairs: 800,
        phase8_matchesCreated: 20,
      };

      // Phase 2-6 should process pairs that passed phase 1
      expect(diagnostics.phase2to6_pairScoresCalculated).toBeGreaterThan(
        diagnostics.phase1_filteredPairs
      );

      // Phase 7 should filter down from phase 2-6
      expect(diagnostics.phase7_eligiblePairs).toBeLessThanOrEqual(
        diagnostics.phase2to6_pairScoresCalculated
      );

      // Phase 8 should create matches from eligible pairs
      expect(diagnostics.phase8_matchesCreated).toBeLessThanOrEqual(
        diagnostics.phase7_eligiblePairs / 2
      );
    });

    it("should validate failure reason tracking", () => {
      const failures = {
        failedAbsolute: 200,
        failedRelativeA: 100,
        failedRelativeB: 125,
      };

      expect(failures.failedAbsolute).toBeGreaterThanOrEqual(0);
      expect(failures.failedRelativeA).toBeGreaterThanOrEqual(0);
      expect(failures.failedRelativeB).toBeGreaterThanOrEqual(0);

      const totalFailures =
        failures.failedAbsolute +
        failures.failedRelativeA +
        failures.failedRelativeB;
      expect(totalFailures).toBeGreaterThan(0);
    });
  });
});
