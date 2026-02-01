/**
 * Test null preference handling for directional questions (Type G)
 *
 * Tests that when one user has null preference (no preference/doesn't matter),
 * they should be flexible and match well regardless of numeric distance.
 */

import { calculateSimilarity } from "../lib/matching/v2/similarity";
import { DEFAULT_CONFIG } from "../lib/matching/v2/config";
import { MatchingUser } from "../lib/matching/v2/types";

// Helper to create mock user
function createUser(
  id: string,
  q10Answer: number,
  q10Preference: "more" | "less" | "similar" | "same" | null,
  q10Importance: string = "important",
): MatchingUser {
  return {
    id,
    email: `${id}@test.com`,
    name: `User ${id}`,
    gender: "M",
    interestedInGenders: ["F"],
    campus: "Vancouver",
    okMatchingDifferentCampus: true,
    responses: {
      q10: {
        questionId: "q10",
        answer: q10Answer,
        preference: q10Preference,
        importance: q10Importance,
      },
    },
    responseRecord: {} as any,
  } as MatchingUser;
}

console.log("=".repeat(80));
console.log(
  "Testing Null Preference for Q10 (Directional - Exercise Frequency)",
);
console.log("=".repeat(80));

// TEST 1: User A has "similar" preference, User B has null preference
console.log("\n📊 TEST 1: One user has specific preference, other has null");
console.log("-".repeat(80));

const userA1 = createUser("A1", 1, "similar", "somewhat_important");
const userB1 = createUser("B1", 5, null, "not_important");

const sim1 = calculateSimilarity(userA1, userB1, DEFAULT_CONFIG);
console.log(
  `User A: answer=1, preference="similar", importance=somewhat_important`,
);
console.log(`User B: answer=5, preference=null, importance=not_important`);
console.log(`\nSimilarity Score: ${sim1.q10?.toFixed(3)}`);
console.log(
  `Expected: 1.000 (User B has no preference, so should be flexible)`,
);
console.log(
  sim1.q10 === 1.0
    ? "✅ PASS: Null preference handled correctly"
    : "❌ FAIL: Should return 1.0 for null preference",
);

// TEST 2: Both users have null preference
console.log("\n\n📊 TEST 2: Both users have null preference");
console.log("-".repeat(80));

const userA2 = createUser("A2", 1, null, "not_important");
const userB2 = createUser("B2", 5, null, "not_important");

const sim2 = calculateSimilarity(userA2, userB2, DEFAULT_CONFIG);
console.log(`User A: answer=1, preference=null, importance=not_important`);
console.log(`User B: answer=5, preference=null, importance=not_important`);
console.log(`\nSimilarity Score: ${sim2.q10?.toFixed(3)}`);
console.log(`Expected: 1.000 (Both flexible, perfect match)`);
console.log(
  sim2.q10 === 1.0
    ? "✅ PASS: Both null preferences handled correctly"
    : "❌ FAIL: Should return 1.0 when both have null preference",
);

// TEST 3: Both users have specific preferences (far apart)
console.log("\n\n📊 TEST 3: Both have specific preferences, answers far apart");
console.log("-".repeat(80));

const userA3 = createUser("A3", 1, "similar", "important");
const userB3 = createUser("B3", 5, "similar", "important");

const sim3 = calculateSimilarity(userA3, userB3, DEFAULT_CONFIG);
console.log(`User A: answer=1, preference="similar", importance=important`);
console.log(`User B: answer=5, preference="similar", importance=important`);
console.log(`\nSimilarity Score: ${sim3.q10?.toFixed(3)}`);
console.log(`Expected: 0.000 (Both want "similar" but answers are far apart)`);
console.log(
  sim3.q10 === 0.0
    ? "✅ PASS: Distant answers with 'similar' preference score low"
    : "❌ FAIL: Should score 0.0 for maximum distance with 'similar' preference",
);

// TEST 4: Both users have specific preferences (close together)
console.log("\n\n📊 TEST 4: Both have specific preferences, answers close");
console.log("-".repeat(80));

const userA4 = createUser("A4", 3, "similar", "important");
const userB4 = createUser("B4", 4, "similar", "important");

const sim4 = calculateSimilarity(userA4, userB4, DEFAULT_CONFIG);
console.log(`User A: answer=3, preference="similar", importance=important`);
console.log(`User B: answer=4, preference="similar", importance=important`);
console.log(`\nSimilarity Score: ${sim4.q10?.toFixed(3)}`);
console.log(`Expected: 0.750 (Distance=1 on 1-5 scale: 1 - 1/4 = 0.75)`);
console.log(
  Math.abs((sim4.q10 ?? 0) - 0.75) < 0.01
    ? "✅ PASS: Close answers score high"
    : "❌ FAIL: Should score 0.75 for distance of 1",
);

// TEST 5: User A wants "more", User B has null preference
console.log("\n\n📊 TEST 5: One wants 'more', other has null preference");
console.log("-".repeat(80));

const userA5 = createUser("A5", 2, "more", "important");
const userB5 = createUser("B5", 1, null, "not_important");

const sim5 = calculateSimilarity(userA5, userB5, DEFAULT_CONFIG);
console.log(`User A: answer=2, preference="more", importance=important`);
console.log(`User B: answer=1, preference=null, importance=not_important`);
console.log(`\nSimilarity Score: ${sim5.q10?.toFixed(3)}`);
console.log(`Expected: 1.000 (User B is flexible, so should match perfectly)`);
console.log(
  sim5.q10 === 1.0
    ? "✅ PASS: Null preference overrides specific preference"
    : "❌ FAIL: Null preference should result in 1.0",
);

console.log("\n" + "=".repeat(80));
console.log("Summary");
console.log("=".repeat(80));

const tests = [
  { name: "TEST 1", passed: sim1.q10 === 1.0 },
  { name: "TEST 2", passed: sim2.q10 === 1.0 },
  { name: "TEST 3", passed: sim3.q10 === 0.0 },
  { name: "TEST 4", passed: Math.abs((sim4.q10 ?? 0) - 0.75) < 0.01 },
  { name: "TEST 5", passed: sim5.q10 === 1.0 },
];

const passedCount = tests.filter((t) => t.passed).length;
const totalCount = tests.length;

console.log(`\nTests Passed: ${passedCount}/${totalCount}`);
tests.forEach((t) => {
  console.log(`  ${t.name}: ${t.passed ? "✅ PASS" : "❌ FAIL"}`);
});

if (passedCount === totalCount) {
  console.log("\n🎉 All tests passed! Null preference handling is correct.");
} else {
  console.log("\n⚠️ Some tests failed. Review the null preference logic.");
}

console.log("\n");
