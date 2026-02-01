/**
 * Comprehensive test for Q10 null preference handling
 * Tests that null preference is handled correctly in Phase 4 (directional scoring)
 * and produces asymmetric results when one user has specific preference
 */

import { calculateDirectionalScoreComplete } from "../lib/matching/v2/index";
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
console.log("Testing Q10 Directional Scoring with Null Preference");
console.log("=".repeat(80));

// TEST 1: User A has null preference, User B wants "more" but A's answer is lower
console.log("\n📊 TEST 1: User B wants 'more', but User A has lower answer");
console.log("-".repeat(80));

const userA1 = createUser("A1", 3, null, "not_important");
const userB1 = createUser("B1", 4, "more", "important");

const score1 = calculateDirectionalScoreComplete(
  userA1,
  userB1,
  DEFAULT_CONFIG,
);
console.log(`User A: answer=3, preference=null, importance=not_important`);
console.log(
  `User B: answer=4, preference="more" (wants > 4), importance=important`,
);
console.log(`\nDirectional Score: ${score1.toFixed(3)}`);
console.log(`Expected: ~0.60-0.65 (A is satisfied, B is not satisfied)`);
console.log(
  score1 >= 0.55 && score1 <= 0.7
    ? "✅ PASS: Score reflects asymmetric satisfaction"
    : `❌ FAIL: Score should be moderate (got ${score1.toFixed(3)})`,
);

// TEST 2: Both have null preference (both flexible)
console.log("\n\n📊 TEST 2: Both users have null preference");
console.log("-".repeat(80));

const userA2 = createUser("A2", 1, null, "not_important");
const userB2 = createUser("B2", 5, null, "not_important");

const score2 = calculateDirectionalScoreComplete(
  userA2,
  userB2,
  DEFAULT_CONFIG,
);
console.log(`User A: answer=1, preference=null, importance=not_important`);
console.log(`User B: answer=5, preference=null, importance=not_important`);
console.log(`\nDirectional Score: ${score2.toFixed(3)}`);
console.log(`Expected: Very high score (both are flexible, both satisfied)`);
console.log(
  score2 >= 0.9
    ? "✅ PASS: Both flexible users match well"
    : `❌ FAIL: Should be high (got ${score2.toFixed(3)})`,
);

// TEST 3: User A wants "similar", User B has null preference
console.log("\n\n📊 TEST 3: User A wants 'similar', User B is flexible");
console.log("-".repeat(80));

const userA3 = createUser("A3", 1, "similar", "important");
const userB3 = createUser("B3", 5, null, "not_important");

const score3 = calculateDirectionalScoreComplete(
  userA3,
  userB3,
  DEFAULT_CONFIG,
);
console.log(`User A: answer=1, preference="similar", importance=important`);
console.log(`User B: answer=5, preference=null, importance=not_important`);
console.log(`\nDirectional Score: ${score3.toFixed(3)}`);
console.log(
  `Expected: ~0.50-0.55 (A not satisfied [answers far], B satisfied [flexible])`,
);
console.log(
  score3 >= 0.45 && score3 <= 0.6
    ? "✅ PASS: Asymmetric score with one dissatisfied user"
    : `❌ FAIL: Should be moderate (got ${score3.toFixed(3)})`,
);

// TEST 4: Both have specific preferences, answers close
console.log(
  "\n\n📊 TEST 4: Both have specific 'similar' preference, answers close",
);
console.log("-".repeat(80));

const userA4 = createUser("A4", 3, "similar", "important");
const userB4 = createUser("B4", 4, "similar", "important");

const score4 = calculateDirectionalScoreComplete(
  userA4,
  userB4,
  DEFAULT_CONFIG,
);
console.log(`User A: answer=3, preference="similar", importance=important`);
console.log(`User B: answer=4, preference="similar", importance=important`);
console.log(`\nDirectional Score: ${score4.toFixed(3)}`);
console.log(`Expected: High score (answers are similar, both satisfied)`);
console.log(
  score4 >= 0.7
    ? "✅ PASS: Similar answers with 'similar' preference score high"
    : `❌ FAIL: Should be high (got ${score4.toFixed(3)})`,
);

// TEST 5: User A wants "more" and B has higher answer, both important
console.log("\n\n📊 TEST 5: User A wants 'more' and gets it");
console.log("-".repeat(80));

const userA5 = createUser("A5", 2, "more", "important");
const userB5 = createUser("B5", 4, "similar", "important");

const score5 = calculateDirectionalScoreComplete(
  userA5,
  userB5,
  DEFAULT_CONFIG,
);
console.log(
  `User A: answer=2, preference="more" (wants > 2), importance=important`,
);
console.log(`User B: answer=4, preference="similar", importance=important`);
console.log(`\nDirectional Score: ${score5.toFixed(3)}`);
console.log(
  `Expected: ~0.50-0.60 (A satisfied [got more], B less satisfied [not similar])`,
);
console.log(
  score5 >= 0.45 && score5 <= 0.65
    ? "✅ PASS: Mixed satisfaction reflected in score"
    : `❌ FAIL: Should be moderate (got ${score5.toFixed(3)})`,
);

// TEST 6: Critical case - should NOT return 1.0
console.log(
  "\n\n📊 TEST 6: CRITICAL - User B wants 'more' but A's answer doesn't satisfy",
);
console.log("-".repeat(80));

const userA6 = createUser("A6", 2, null, "not_important");
const userB6 = createUser("B6", 3, "more", "very_important");

const score6 = calculateDirectionalScoreComplete(
  userA6,
  userB6,
  DEFAULT_CONFIG,
);
console.log(
  `User A: answer=2, preference=null (flexible), importance=not_important`,
);
console.log(
  `User B: answer=3, preference="more" (wants > 3), importance=very_important`,
);
console.log(`\nDirectional Score: ${score6.toFixed(3)}`);
console.log(`Expected: SHOULD NOT BE 1.0! (User B wants more but got less)`);
console.log(
  score6 < 0.9
    ? "✅ PASS: Score correctly reflects that B's preference isn't met"
    : `❌ FAIL: Should NOT be 1.0 (got ${score6.toFixed(3)})`,
);

console.log("\n" + "=".repeat(80));
console.log("Summary");
console.log("=".repeat(80));

const tests = [
  { name: "TEST 1", passed: score1 >= 0.55 && score1 <= 0.7 },
  { name: "TEST 2", passed: score2 >= 0.9 },
  { name: "TEST 3", passed: score3 >= 0.45 && score3 <= 0.6 },
  { name: "TEST 4", passed: score4 >= 0.7 },
  { name: "TEST 5", passed: score5 >= 0.45 && score5 <= 0.65 },
  { name: "TEST 6 (CRITICAL)", passed: score6 < 0.9 },
];

const passedCount = tests.filter((t) => t.passed).length;
const totalCount = tests.length;

console.log(`\nTests Passed: ${passedCount}/${totalCount}`);
tests.forEach((t) => {
  console.log(`  ${t.name}: ${t.passed ? "✅ PASS" : "❌ FAIL"}`);
});

if (passedCount === totalCount) {
  console.log(
    "\n🎉 All tests passed! Q10 null preference is handled correctly.",
  );
  console.log("✅ Null preference = flexible (satisfied)");
  console.log("✅ Specific preference = evaluated based on partner's answer");
  console.log("✅ Asymmetric scoring works as expected");
} else {
  console.log("\n⚠️ Some tests failed. Review the directional scoring logic.");
}

console.log("\n");
