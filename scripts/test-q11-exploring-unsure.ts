/**
 * Test Q11 (Relationship Style) with "exploring_unsure" flexibility
 *
 * Tests that "exploring_unsure" acts as a flexible option similar to
 * "whatever_feels_natural" for Q26 or "irregular" for Q29.
 */

import { calculateSimilarity } from "../lib/matching/v2/similarity";
import { DEFAULT_CONFIG } from "../lib/matching/v2/config";
import { MatchingUser } from "../lib/matching/v2/types";

// Helper to create mock user
function createUser(
  id: string,
  q11Answer: string,
  q11Preference: "same" | "similar" | null,
  q11Importance: string = "important",
): MatchingUser {
  return {
    id,
    email: `${id}@test.com`,
    responses: {
      q11: {
        questionId: "q11",
        answer: q11Answer,
        preference: q11Preference,
        importance: q11Importance,
      },
    },
  } as MatchingUser;
}

console.log("=".repeat(80));
console.log(
  "Testing Q11 (Relationship Style) with 'exploring_unsure' Flexibility",
);
console.log("=".repeat(80));

// TEST 1: One user has specific style, other is exploring_unsure
console.log(
  "\n📊 TEST 1: User A has specific preference, User B is exploring_unsure",
);
console.log("-".repeat(80));

const userA1 = createUser(
  "A1",
  "exclusively_monogamous",
  "same",
  "somewhat_important",
);
const userB1 = createUser("B1", "exploring_unsure", "similar", "not_important");

const sim1 = calculateSimilarity(userA1, userB1, DEFAULT_CONFIG);
console.log(`User A: answer="exclusively_monogamous", preference="same"`);
console.log(`User B: answer="exploring_unsure", preference="similar"`);
console.log(`\nSimilarity Score: ${sim1.q11?.toFixed(3)}`);
console.log(
  `Expected: 0.500 (User B is exploring/unsure, flexible but not perfect)`,
);
console.log(
  sim1.q11 === 0.5
    ? "✅ PASS: exploring_unsure treated as flexible"
    : "❌ FAIL: Should return 0.5 for exploring_unsure",
);

// TEST 2: Both users have exploring_unsure
console.log("\n\n📊 TEST 2: Both users are exploring_unsure");
console.log("-".repeat(80));

const userA2 = createUser("A2", "exploring_unsure", "similar", "not_important");
const userB2 = createUser("B2", "exploring_unsure", "similar", "not_important");

const sim2 = calculateSimilarity(userA2, userB2, DEFAULT_CONFIG);
console.log(`User A: answer="exploring_unsure", preference="similar"`);
console.log(`User B: answer="exploring_unsure", preference="similar"`);
console.log(`\nSimilarity Score: ${sim2.q11?.toFixed(3)}`);
console.log(`Expected: 0.500 (Both exploring, flexible match)`);
console.log(
  sim2.q11 === 0.5
    ? "✅ PASS: Both exploring_unsure handled correctly"
    : "❌ FAIL: Should return 0.5 when both are exploring_unsure",
);

// TEST 3: Both have specific styles, same
console.log("\n\n📊 TEST 3: Both have same specific relationship style");
console.log("-".repeat(80));

const userA3 = createUser("A3", "exclusively_monogamous", "same", "important");
const userB3 = createUser("B3", "exclusively_monogamous", "same", "important");

const sim3 = calculateSimilarity(userA3, userB3, DEFAULT_CONFIG);
console.log(`User A: answer="exclusively_monogamous", preference="same"`);
console.log(`User B: answer="exclusively_monogamous", preference="same"`);
console.log(`\nSimilarity Score: ${sim3.q11?.toFixed(3)}`);
console.log(`Expected: 1.000 (Both want same style and have it)`);
console.log(
  sim3.q11 === 1.0
    ? "✅ PASS: Same specific styles match perfectly"
    : "❌ FAIL: Should score 1.0 for matching specific styles",
);

// TEST 4: Both have specific styles, different
console.log("\n\n📊 TEST 4: Both have different specific relationship styles");
console.log("-".repeat(80));

const userA4 = createUser("A4", "exclusively_monogamous", "same", "important");
const userB4 = createUser("B4", "polyamorous", "same", "important");

const sim4 = calculateSimilarity(userA4, userB4, DEFAULT_CONFIG);
console.log(`User A: answer="exclusively_monogamous", preference="same"`);
console.log(`User B: answer="polyamorous", preference="same"`);
console.log(`\nSimilarity Score: ${sim4.q11?.toFixed(3)}`);
console.log(`Expected: 0.000 (Both want 'same' but styles are different)`);
console.log(
  sim4.q11 === 0.0
    ? "✅ PASS: Different specific styles score low"
    : "❌ FAIL: Should score 0.0 for incompatible specific styles",
);

// TEST 5: One has "similar" preference, matching
console.log("\n\n📊 TEST 5: Both have same style, one wants 'similar'");
console.log("-".repeat(80));

const userA5 = createUser("A5", "open_to_non_monogamy", "similar", "important");
const userB5 = createUser("B5", "open_to_non_monogamy", "same", "important");

const sim5 = calculateSimilarity(userA5, userB5, DEFAULT_CONFIG);
console.log(`User A: answer="open_to_non_monogamy", preference="similar"`);
console.log(`User B: answer="open_to_non_monogamy", preference="same"`);
console.log(`\nSimilarity Score: ${sim5.q11?.toFixed(3)}`);
console.log(`Expected: 1.000 (Answers match, both satisfied)`);
console.log(
  sim5.q11 === 1.0
    ? "✅ PASS: Same answers satisfy both 'similar' and 'same'"
    : "❌ FAIL: Should score 1.0 when answers match",
);

// TEST 6: exploring_unsure with "same" preference (edge case)
console.log("\n\n📊 TEST 6: User A wants 'same', User B is exploring_unsure");
console.log("-".repeat(80));

const userA6 = createUser("A6", "polyamorous", "same", "important");
const userB6 = createUser("B6", "exploring_unsure", "similar", "not_important");

const sim6 = calculateSimilarity(userA6, userB6, DEFAULT_CONFIG);
console.log(`User A: answer="polyamorous", preference="same"`);
console.log(`User B: answer="exploring_unsure", preference="similar"`);
console.log(`\nSimilarity Score: ${sim6.q11?.toFixed(3)}`);
console.log(`Expected: 0.500 (User B is flexible)`);
console.log(
  sim6.q11 === 0.5
    ? "✅ PASS: exploring_unsure provides flexibility"
    : "❌ FAIL: Should return 0.5 for exploring_unsure",
);

console.log("\n" + "=".repeat(80));
console.log("Summary");
console.log("=".repeat(80));

const tests = [
  { name: "TEST 1", passed: sim1.q11 === 0.5 },
  { name: "TEST 2", passed: sim2.q11 === 0.5 },
  { name: "TEST 3", passed: sim3.q11 === 1.0 },
  { name: "TEST 4", passed: sim4.q11 === 0.0 },
  { name: "TEST 5", passed: sim5.q11 === 1.0 },
  { name: "TEST 6", passed: sim6.q11 === 0.5 },
];

const passedCount = tests.filter((t) => t.passed).length;
const totalCount = tests.length;

console.log(`\nTests Passed: ${passedCount}/${totalCount}`);
tests.forEach((t) => {
  console.log(`  ${t.name}: ${t.passed ? "✅ PASS" : "❌ FAIL"}`);
});

if (passedCount === totalCount) {
  console.log(
    "\n🎉 All tests passed! Q11 exploring_unsure handling is correct.",
  );
} else {
  console.log("\n⚠️ Some tests failed. Review the Q11 logic.");
}

console.log("\n");
