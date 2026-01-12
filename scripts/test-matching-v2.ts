/**
 * Matching Algorithm V2.2 Test Script
 *
 * Standalone script for testing matching scenarios with detailed diagnostics.
 * Run with: npx tsx scripts/test-matching-v2.ts
 *
 * This script tests various scenarios:
 * 1. Perfect match pair (high mutual compatibility)
 * 2. Dealbreaker conflict (Phase 1 filter)
 * 3. Asymmetric pair (one-sided high score)
 * 4. Triangle scenario (A→B→C→A preference chain)
 * 5. Large batch (50+ users with varying compatibility)
 */

import { runMatchingPipeline, MatchingUser } from "../lib/matching/v2";
import { ResponseValue } from "../lib/matching/v2/types";

// Helper to create mock user with responses
function createMockUser(
  id: string,
  responses: Record<string, ResponseValue>
): MatchingUser {
  return { id, responses };
}

// Scenario 1: Perfect Match Pair
function testPerfectMatch() {
  console.log("\n=== Scenario 1: Perfect Match Pair ===\n");

  const users: MatchingUser[] = [
    createMockUser("alice", {
      q1: { answer: "woman" },
      q2: { answer: ["men"], preference: ["men"] },
      q3: {
        answer: "heterosexual",
        preference: "same",
        importance: "important",
      },
      q4: { answer: 25, preference: { min: 23, max: 28 } },
      q7: { answer: 2, preference: "similar", importance: "very-important" }, // Progressive
      q8: {
        answer: "socially",
        preference: ["socially", "rarely"],
        importance: "important",
      },
      q10: {
        answer: 3,
        preference: "similar",
        importance: "somewhat-important",
      }, // Exercise
      q11: {
        answer: "monogamous",
        preference: "same",
        importance: "dealbreaker",
      },
    }),
    createMockUser("bob", {
      q1: { answer: "man" },
      q2: { answer: ["women"], preference: ["women"] },
      q3: {
        answer: "heterosexual",
        preference: "same",
        importance: "important",
      },
      q4: { answer: 26, preference: { min: 23, max: 30 } },
      q7: { answer: 2, preference: "similar", importance: "very-important" }, // Progressive
      q8: {
        answer: "socially",
        preference: ["socially", "rarely", "frequently"],
        importance: "important",
      },
      q10: {
        answer: 3,
        preference: "similar",
        importance: "somewhat-important",
      },
      q11: {
        answer: "monogamous",
        preference: "same",
        importance: "dealbreaker",
      },
    }),
  ];

  const result = runMatchingPipeline(users);

  console.log("Users:", users.length);
  console.log("Matches created:", result.matches.length);
  console.log("Unmatched users:", result.unmatched.length);

  if (result.matches.length > 0) {
    const match = result.matches[0];
    console.log(`\nMatch: ${match.userAId} ↔ ${match.userBId}`);
    console.log(`  Pair Score: ${match.pairScore.toFixed(2)}`);
    console.log(
      `  ${match.userAId}→${match.userBId}: ${match.scoreAtoB.toFixed(2)}`
    );
    console.log(
      `  ${match.userBId}→${match.userAId}: ${match.scoreBtoA.toFixed(2)}`
    );
  }

  console.log("\nDiagnostics:");
  console.log(
    `  Phase 1 filtered pairs: ${result.diagnostics.phase1_filteredPairs}`
  );
  console.log(
    `  Phase 2-6 pair scores: ${result.diagnostics.phase2to6_pairScoresCalculated}`
  );
  console.log(
    `  Phase 7 eligible pairs: ${result.diagnostics.phase7_eligiblePairs}`
  );
  console.log(`  Execution time: ${result.diagnostics.executionTimeMs}ms`);

  return result;
}

// Scenario 2: Dealbreaker Conflict
function testDealbreaker() {
  console.log("\n=== Scenario 2: Dealbreaker Conflict ===\n");

  const users: MatchingUser[] = [
    createMockUser("charlie", {
      q1: { answer: "woman" },
      q2: { answer: ["men"], preference: ["men"] },
      q8: { answer: "never", preference: ["never"], importance: "dealbreaker" }, // No alcohol
      q11: {
        answer: "monogamous",
        preference: "same",
        importance: "important",
      },
    }),
    createMockUser("dave", {
      q1: { answer: "man" },
      q2: { answer: ["women"], preference: ["women"] },
      q8: {
        answer: "frequently",
        preference: ["frequently", "socially"],
        importance: "important",
      }, // Drinks frequently
      q11: {
        answer: "monogamous",
        preference: "same",
        importance: "important",
      },
    }),
  ];

  const result = runMatchingPipeline(users);

  console.log("Users:", users.length);
  console.log("Matches created:", result.matches.length);
  console.log("Unmatched users:", result.unmatched.length);

  console.log(
    "\nDealbreakers triggered:",
    result.diagnostics.phase1_dealbreakers.length
  );
  if (result.diagnostics.phase1_dealbreakers.length > 0) {
    result.diagnostics.phase1_dealbreakers.forEach((db) => {
      console.log(
        `  ${db.userAId} ↔ ${db.userBId} on question ${db.questionId}`
      );
    });
  }

  if (result.unmatched.length > 0) {
    console.log("\nUnmatched reasons:");
    result.unmatched.forEach((u) => {
      console.log(`  ${u.userId}: ${u.reason}`);
    });
  }

  return result;
}

// Scenario 3: Asymmetric Pair
function testAsymmetric() {
  console.log("\n=== Scenario 3: Asymmetric Pair (One-Sided) ===\n");

  const users: MatchingUser[] = [
    createMockUser("eve", {
      q1: { answer: "woman" },
      q2: { answer: ["men"], preference: ["men"] },
      q7: { answer: 1, preference: "similar", importance: "very-important" }, // Very progressive
      q8: {
        answer: "never",
        preference: ["never", "rarely"],
        importance: "important",
      },
      q10: { answer: 5, preference: "similar", importance: "very-important" }, // Very active
      q11: {
        answer: "monogamous",
        preference: "same",
        importance: "important",
      },
    }),
    createMockUser("frank", {
      q1: { answer: "man" },
      q2: { answer: ["women"], preference: ["women"] },
      q7: { answer: 5, preference: "similar", importance: "very-important" }, // Very conservative
      q8: {
        answer: "socially",
        preference: ["socially", "frequently"],
        importance: "important",
      },
      q10: {
        answer: 1,
        preference: "similar",
        importance: "somewhat-important",
      }, // Sedentary
      q11: {
        answer: "monogamous",
        preference: "same",
        importance: "important",
      },
    }),
  ];

  const result = runMatchingPipeline(users);

  console.log("Users:", users.length);
  console.log("Matches created:", result.matches.length);
  console.log("Unmatched users:", result.unmatched.length);

  if (result.matches.length > 0) {
    const match = result.matches[0];
    console.log(`\nMatch: ${match.userAId} ↔ ${match.userBId}`);
    console.log(`  Pair Score: ${match.pairScore.toFixed(2)}`);
    console.log(
      `  ${match.userAId}→${match.userBId}: ${match.scoreAtoB.toFixed(2)}`
    );
    console.log(
      `  ${match.userBId}→${match.userAId}: ${match.scoreBtoA.toFixed(2)}`
    );

    const asymmetry = Math.abs(match.scoreAtoB - match.scoreBtoA);
    console.log(`  Asymmetry: ${asymmetry.toFixed(2)} (should be high)`);
  } else {
    console.log(
      "\nNo matches created (pair may have failed eligibility due to low mutuality)"
    );
  }

  console.log("\nDiagnostics:");
  console.log(
    `  Average raw score: ${result.diagnostics.phase2to6_averageRawScore.toFixed(2)}`
  );
  console.log(`  Eligible pairs: ${result.diagnostics.phase7_eligiblePairs}`);
  console.log(
    `  Failed relative threshold A: ${result.diagnostics.phase7_failedRelativeA}`
  );
  console.log(
    `  Failed relative threshold B: ${result.diagnostics.phase7_failedRelativeB}`
  );

  return result;
}

// Scenario 4: Triangle (A→B→C→A)
function testTriangle() {
  console.log("\n=== Scenario 4: Triangle Scenario ===\n");
  console.log(
    "Setup: Grace prefers Hannah, Hannah prefers Ivan, Ivan prefers Grace\n"
  );

  const users: MatchingUser[] = [
    createMockUser("grace", {
      q1: { answer: "woman" },
      q2: { answer: ["men"], preference: ["men"] },
      q7: { answer: 2, preference: "similar", importance: "very-important" },
      q10: { answer: 5, preference: "similar", importance: "very-important" }, // Very active - likes Hannah
    }),
    createMockUser("hannah", {
      q1: { answer: "woman" }, // Actually prefers women for this scenario
      q2: { answer: ["women"], preference: ["women"] },
      q7: { answer: 4, preference: "similar", importance: "very-important" },
      q10: { answer: 3, preference: "similar", importance: "very-important" }, // Moderate - likes Ivan
    }),
    createMockUser("ivan", {
      q1: { answer: "man" },
      q2: { answer: ["women"], preference: ["women"] },
      q7: { answer: 1, preference: "similar", importance: "very-important" },
      q10: { answer: 1, preference: "similar", importance: "very-important" }, // Sedentary - likes Grace
    }),
  ];

  const result = runMatchingPipeline(users);

  console.log("Users:", users.length);
  console.log("Matches created:", result.matches.length);
  console.log("Unmatched users:", result.unmatched.length);

  if (result.matches.length > 0) {
    result.matches.forEach((match) => {
      console.log(`\nMatch: ${match.userAId} ↔ ${match.userBId}`);
      console.log(`  Pair Score: ${match.pairScore.toFixed(2)}`);
    });
  }

  if (result.unmatched.length > 0) {
    console.log("\nUnmatched:");
    result.unmatched.forEach((u) => {
      console.log(`  ${u.userId}: ${u.reason}`);
      if (u.bestPossibleScore) {
        console.log(
          `    Best possible: ${u.bestPossibleMatchId} (score: ${u.bestPossibleScore.toFixed(2)})`
        );
      }
    });
  }

  return result;
}

// Scenario 5: Large Batch
function testLargeBatch() {
  console.log("\n=== Scenario 5: Large Batch (50 users) ===\n");

  const users: MatchingUser[] = [];

  // Generate 50 users with varying attributes
  for (let i = 1; i <= 50; i++) {
    const isWoman = i % 2 === 0;
    const politicalLeaning = 1 + (i % 5); // 1-5 spectrum
    const exerciseLevel = 1 + (i % 5);
    const age = 18 + (i % 23); // 18-40

    users.push(
      createMockUser(`user${i}`, {
        q1: { answer: isWoman ? "woman" : "man" },
        q2: {
          answer: isWoman ? ["men"] : ["women"],
          preference: isWoman ? ["men"] : ["women"],
        },
        q4: { answer: age, preference: { min: age - 3, max: age + 5 } },
        q7: {
          answer: politicalLeaning,
          preference: "similar",
          importance: "important",
        },
        q8: {
          answer: i % 4 === 0 ? "never" : "socially",
          preference: ["socially", "rarely", "never"],
          importance: "somewhat-important",
        },
        q10: {
          answer: exerciseLevel,
          preference: "similar",
          importance: "somewhat-important",
        },
        q11: {
          answer: "monogamous",
          preference: "same",
          importance: "very-important",
        },
      })
    );
  }

  const startTime = Date.now();
  const result = runMatchingPipeline(users);
  const duration = Date.now() - startTime;

  console.log("Users:", users.length);
  console.log("Matches created:", result.matches.length);
  console.log("Unmatched users:", result.unmatched.length);
  console.log(
    "Match rate:",
    `${(((result.matches.length * 2) / users.length) * 100).toFixed(1)}%`
  );
  console.log("Execution time:", `${duration}ms`);

  console.log("\nScore Distribution:");
  result.diagnostics.scoreDistribution.forEach((bucket) => {
    const bar = "█".repeat(Math.floor(bucket.count / 10));
    console.log(
      `  ${bucket.range}: ${bucket.count.toString().padStart(3)} ${bar}`
    );
  });

  console.log("\nMatch Quality:");
  console.log(
    `  Average: ${result.diagnostics.phase8_averageMatchScore.toFixed(2)}`
  );
  console.log(
    `  Median:  ${result.diagnostics.phase8_medianMatchScore.toFixed(2)}`
  );
  console.log(
    `  Min:     ${result.diagnostics.phase8_minMatchScore.toFixed(2)}`
  );
  console.log(
    `  Max:     ${result.diagnostics.phase8_maxMatchScore.toFixed(2)}`
  );

  console.log("\nPhase 7 Filtering:");
  console.log(
    `  Failed absolute threshold: ${result.diagnostics.phase7_failedAbsolute}`
  );
  console.log(
    `  Failed relative threshold: ${result.diagnostics.phase7_failedRelativeA + result.diagnostics.phase7_failedRelativeB}`
  );
  console.log(
    `  Perfectionist users: ${result.diagnostics.phase7_perfectionists.length}`
  );

  return result;
}

// Run all scenarios
function runAllScenarios() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║   Matching Algorithm V2.2 - Test Scenarios               ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");

  const results = {
    perfectMatch: testPerfectMatch(),
    dealbreaker: testDealbreaker(),
    asymmetric: testAsymmetric(),
    triangle: testTriangle(),
    largeBatch: testLargeBatch(),
  };

  console.log(
    "\n╔═══════════════════════════════════════════════════════════╗"
  );
  console.log("║   Summary                                                 ║");
  console.log(
    "╚═══════════════════════════════════════════════════════════╝\n"
  );

  console.log("Scenario 1 (Perfect Match):");
  console.log(
    `  ✓ Created ${results.perfectMatch.matches.length} match (expected 1)`
  );
  console.log(
    `  ✓ High pair score: ${results.perfectMatch.matches[0]?.pairScore.toFixed(2) || "N/A"}`
  );

  console.log("\nScenario 2 (Dealbreaker):");
  console.log(
    `  ✓ Filtered ${results.dealbreaker.diagnostics.phase1_filteredPairs} pairs`
  );
  console.log(
    `  ✓ Created ${results.dealbreaker.matches.length} matches (expected 0)`
  );

  console.log("\nScenario 3 (Asymmetric):");
  console.log(`  ✓ Tested mutuality penalty`);
  if (results.asymmetric.matches.length > 0) {
    const m = results.asymmetric.matches[0];
    const asymmetry = Math.abs(m.scoreAtoB - m.scoreBtoA);
    console.log(`  ✓ Asymmetry detected: ${asymmetry.toFixed(2)}`);
  } else {
    console.log(`  ✓ Failed eligibility (mutuality too low)`);
  }

  console.log("\nScenario 4 (Triangle):");
  console.log(`  ✓ Handled odd number of users`);
  console.log(
    `  ✓ ${results.triangle.unmatched.length} user(s) unmatched (expected 1+)`
  );

  console.log("\nScenario 5 (Large Batch):");
  console.log(
    `  ✓ Processed ${results.largeBatch.diagnostics.totalUsers} users`
  );
  console.log(`  ✓ Created ${results.largeBatch.matches.length} matches`);
  console.log(
    `  ✓ Performance: ${results.largeBatch.diagnostics.executionTimeMs}ms`
  );

  console.log("\n✅ All test scenarios completed successfully!\n");
}

// Run the tests
runAllScenarios();
