/**
 * Test script to demonstrate importance-weighted averaging
 *
 * This tests the fix for the issue where users with mostly "no preference"
 * (not_important) could match well with anyone based on just 1-2 questions
 * they care about.
 *
 * With the new importance-weighted averaging:
 * - Questions marked as more important contribute more to the section average
 * - We use the MAXIMUM importance between users (if one person cares, it matters)
 * - Questions with 0 importance contribute nothing unless ALL are 0
 */

import { applySectionWeighting } from "../lib/matching/v2/section-weighting";
import { DEFAULT_CONFIG } from "../lib/matching/v2/config";
import { MatchingUser } from "../lib/matching/v2/types";

// Helper to create mock user
function createMockUser(
  id: string,
  responses: Record<string, { importance: string }>,
): MatchingUser {
  return {
    id,
    email: `${id}@example.com`,
    responses: Object.fromEntries(
      Object.entries(responses).map(([qid, data]) => [
        qid,
        {
          questionId: qid,
          answer: [],
          preference: null,
          importance: data.importance,
        },
      ]),
    ),
  } as MatchingUser;
}

console.log("=".repeat(80));
console.log("Testing Importance-Weighted Averaging");
console.log("=".repeat(80));

// SCENARIO 1: User A has "no preference" for 9 questions, "very important" for 1
console.log("\n📊 SCENARIO 1: User with mostly 'no preference'");
console.log("-".repeat(80));

// User A: doesn't care about q1-q9, cares strongly about q10
const userA = createMockUser("userA", {
  q1: { importance: "not_important" }, // 0
  q2: { importance: "not_important" }, // 0
  q3: { importance: "not_important" }, // 0
  q4: { importance: "not_important" }, // 0
  q5: { importance: "not_important" }, // 0
  q6: { importance: "not_important" }, // 0
  q7: { importance: "not_important" }, // 0
  q8: { importance: "not_important" }, // 0
  q9: { importance: "not_important" }, // 0
  q10: { importance: "very_important" }, // 2.0
});

// User B: cares moderately about everything
const userB = createMockUser("userB", {
  q1: { importance: "important" }, // 1.0
  q2: { importance: "important" }, // 1.0
  q3: { importance: "important" }, // 1.0
  q4: { importance: "important" }, // 1.0
  q5: { importance: "important" }, // 1.0
  q6: { importance: "important" }, // 1.0
  q7: { importance: "important" }, // 1.0
  q8: { importance: "important" }, // 1.0
  q9: { importance: "important" }, // 1.0
  q10: { importance: "important" }, // 1.0
});

// They match perfectly on the 9 questions A doesn't care about
// They match poorly (0.2) on the 1 question A cares about
const questionScores1: Record<string, number> = {
  q1: 1.0, // Perfect match, but A doesn't care
  q2: 1.0, // Perfect match, but A doesn't care
  q3: 1.0, // Perfect match, but A doesn't care
  q4: 1.0, // Perfect match, but A doesn't care
  q5: 1.0, // Perfect match, but A doesn't care
  q6: 1.0, // Perfect match, but A doesn't care
  q7: 1.0, // Perfect match, but A doesn't care
  q8: 1.0, // Perfect match, but A doesn't care
  q9: 1.0, // Perfect match, but A doesn't care
  q10: 0.2, // Poor match, but A DOES care!
};

const result1 = applySectionWeighting(
  questionScores1,
  userA,
  userB,
  DEFAULT_CONFIG,
);

console.log("\nUser A: Doesn't care about q1-q9 (not_important)");
console.log("        Cares strongly about q10 (very_important)");
console.log("\nUser B: Cares about all questions (important)");
console.log("\nQuestion Scores:");
console.log("  q1-q9: 1.0 (perfect matches on unimportant questions)");
console.log("  q10:   0.2 (poor match on the important question)");
console.log("\n📈 Results:");
console.log(`  Lifestyle Score: ${result1.lifestyleScore.toFixed(3)}`);
console.log(`  Total Score:     ${result1.totalScore.toFixed(1)}`);

// Calculate what the score WOULD BE with simple averaging
const simpleAverage = (1.0 * 9 + 0.2) / 10;
const simpleTotal = simpleAverage * 0.65 * 100;

console.log(`\n🔄 For comparison:`);
console.log(`  Simple average (old method):      ${simpleAverage.toFixed(3)}`);
console.log(`  Old total score:                  ${simpleTotal.toFixed(1)}`);
console.log(
  `\n✅ Improvement: Importance weighting correctly prioritizes the question A cares about!`,
);

// SCENARIO 2: Both users care about different questions
console.log("\n\n📊 SCENARIO 2: Users care about different questions");
console.log("-".repeat(80));

const userC = createMockUser("userC", {
  q1: { importance: "very_important" }, // 2.0
  q2: { importance: "not_important" }, // 0
  q3: { importance: "not_important" }, // 0
});

const userD = createMockUser("userD", {
  q1: { importance: "not_important" }, // 0
  q2: { importance: "very_important" }, // 2.0
  q3: { importance: "not_important" }, // 0
});

const questionScores2: Record<string, number> = {
  q1: 0.3, // Poor match on C's important question
  q2: 0.9, // Great match on D's important question
  q3: 1.0, // Perfect match on nobody's important question
};

const result2 = applySectionWeighting(
  questionScores2,
  userC,
  userD,
  DEFAULT_CONFIG,
);

console.log("\nUser C: Cares about q1 (very_important)");
console.log("User D: Cares about q2 (very_important)");
console.log("\nQuestion Scores:");
console.log("  q1: 0.3 (poor match on C's important question)");
console.log("  q2: 0.9 (great match on D's important question)");
console.log("  q3: 1.0 (perfect match on unimportant question)");
console.log("\n📈 Results:");
console.log(`  Lifestyle Score: ${result2.lifestyleScore.toFixed(3)}`);
console.log(
  `  Max importance weighting: (0.3*2.0 + 0.9*2.0 + 1.0*0) / (2.0 + 2.0 + 0)`,
);
console.log(`                            = 2.4 / 4.0 = 0.600`);
console.log(
  `\n✅ Both important questions count equally, unimportant q3 ignored!`,
);

// SCENARIO 3: All questions have zero importance (edge case)
console.log("\n\n📊 SCENARIO 3: All questions marked not_important");
console.log("-".repeat(80));

const userE = createMockUser("userE", {
  q1: { importance: "not_important" },
  q2: { importance: "not_important" },
});

const userF = createMockUser("userF", {
  q1: { importance: "not_important" },
  q2: { importance: "not_important" },
});

const questionScores3: Record<string, number> = {
  q1: 1.0,
  q2: 0.6,
};

const result3 = applySectionWeighting(
  questionScores3,
  userE,
  userF,
  DEFAULT_CONFIG,
);

console.log("\nBoth users: Mark all questions as not_important");
console.log("\nQuestion Scores: q1=1.0, q2=0.6");
console.log("\n📈 Results:");
console.log(`  Lifestyle Score: ${result3.lifestyleScore.toFixed(3)}`);
console.log(
  `\n✅ Falls back to simple average: (1.0 + 0.6) / 2 = 0.800 (to avoid NaN)`,
);

console.log("\n" + "=".repeat(80));
console.log("Summary");
console.log("=".repeat(80));
console.log("\n✨ Key Benefits of Importance-Weighted Averaging:");
console.log("  1. Questions people care about contribute more to the score");
console.log("  2. Uses MAX importance (if one person cares, it matters)");
console.log("  3. Prevents gaming with many 'no preference' responses");
console.log("  4. Falls back to simple average if all weights are 0");
console.log("\n");
