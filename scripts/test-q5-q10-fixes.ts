/**
 * Quick test to verify Q5 and Q10 fixes
 */

import { calculateQuestionSimilarity } from "../lib/matching/v2/similarity";
import { MATCHING_CONFIG } from "../lib/matching/v2/config";
import type { MatchingUser, ResponseValue } from "../lib/matching/v2/types";

// Mock user creation helper
function createMockUser(
  id: string,
  responses: Record<string, ResponseValue>,
): MatchingUser {
  return {
    id,
    email: `${id}@test.com`,
    name: id,
    gender: "any",
    interestedInGenders: ["any"],
    campus: "Vancouver",
    okMatchingDifferentCampus: true,
    responses,
    responseRecord: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  };
}

console.log("🧪 Testing Q5 and Q10 Fixes\n");

// ========================================
// Test 1: Q5 Ethnicity with Preference
// ========================================
console.log(
  "=== Test 1: Q5 Ethnicity (Multi-Select with Array Preference) ===",
);
console.log("User A: answer=['southeast_asian', 'east_asian']");
console.log(
  "        preference=['east_asian', 'south_asian', 'southeast_asian', 'white']",
);
console.log("User B: answer=['south_asian', 'latin_american']");
console.log("        preference=['east_asian', 'latin_american', 'white']");
console.log("");

const userA_q5 = createMockUser("A", {
  q5: {
    answer: ["southeast_asian", "east_asian"],
    preference: ["east_asian", "south_asian", "southeast_asian", "white"],
    importance: 8,
  },
});

const userB_q5 = createMockUser("B", {
  q5: {
    answer: ["south_asian", "latin_american"],
    preference: ["east_asian", "latin_american", "white"],
    importance: 9,
  },
});

const q5Similarity = calculateQuestionSimilarity(
  "q5",
  userA_q5,
  userB_q5,
  "multi-select",
  MATCHING_CONFIG,
);

console.log(`Similarity Score: ${q5Similarity.toFixed(3)}`);
console.log("");
console.log("Expected Logic:");
console.log("  - User A preference includes B's ethnicity?");
console.log(
  "    A wants: ['east_asian', 'south_asian', 'southeast_asian', 'white']",
);
console.log("    B has: ['south_asian', 'latin_american']");
console.log(
  "    Match: YES (south_asian is in A's preference) → A satisfied = 1.0",
);
console.log("");
console.log("  - User B preference includes A's ethnicity?");
console.log("    B wants: ['east_asian', 'latin_american', 'white']");
console.log("    A has: ['southeast_asian', 'east_asian']");
console.log(
  "    Match: YES (east_asian is in B's preference) → B satisfied = 1.0",
);
console.log("");
console.log(`  Final: (1.0 + 1.0) / 2 = 1.0`);
console.log("");
console.log(
  `✅ Test 1 ${q5Similarity === 1.0 ? "PASSED" : `FAILED (got ${q5Similarity})`}\n`,
);

// ========================================
// Test 2: Q10 Exercise with Null Preference
// ========================================
console.log("=== Test 2: Q10 Exercise (Directional with Null Preference) ===");
console.log("User A: answer=3, preference=null, importance='not_important'");
console.log("User B: answer=4, preference='more', importance='important'");
console.log("");

const userA_q10 = createMockUser("A", {
  q10: {
    answer: 3,
    preference: null,
    importance: 3,
  },
});

const userB_q10 = createMockUser("B", {
  q10: {
    answer: 4,
    preference: "more",
    importance: 8,
  },
});

const q10Similarity = calculateQuestionSimilarity(
  "q10",
  userA_q10,
  userB_q10,
  "directional",
  MATCHING_CONFIG,
);

console.log(`Similarity Score: ${q10Similarity.toFixed(3)}`);
console.log("");
console.log("Expected Logic:");
console.log(
  "  - User A has null preference → A is satisfied with anything = 1.0",
);
console.log("  - User B wants 'more' (partner > 4):");
console.log("    A's answer: 3 (less than B's 4) → B NOT satisfied = 0.0");
console.log("");
console.log(`  Final: (1.0 + 0.0) / 2 = 0.5`);
console.log("");
console.log(
  `✅ Test 2 ${q10Similarity === 0.5 ? "PASSED" : `FAILED (got ${q10Similarity})`}\n`,
);

// ========================================
// Test 3: Q10 Both Have Null Preference
// ========================================
console.log("=== Test 3: Q10 Both with Null Preference ===");
console.log("User A: answer=3, preference=null");
console.log("User B: answer=4, preference=null");
console.log("");

const userA_q10_null = createMockUser("A", {
  q10: {
    answer: 3,
    preference: null,
    importance: 3,
  },
});

const userB_q10_null = createMockUser("B", {
  q10: {
    answer: 4,
    preference: null,
    importance: 3,
  },
});

const q10SimilarityBothNull = calculateQuestionSimilarity(
  "q10",
  userA_q10_null,
  userB_q10_null,
  "directional",
  MATCHING_CONFIG,
);

console.log(`Similarity Score: ${q10SimilarityBothNull.toFixed(3)}`);
console.log("");
console.log("Expected Logic:");
console.log("  - User A has null preference → A satisfied = 1.0");
console.log("  - User B has null preference → B satisfied = 1.0");
console.log("");
console.log(`  Final: (1.0 + 1.0) / 2 = 1.0`);
console.log("");
console.log(
  `✅ Test 3 ${q10SimilarityBothNull === 1.0 ? "PASSED" : `FAILED (got ${q10SimilarityBothNull})`}\n`,
);

// ========================================
// Summary
// ========================================
console.log("=== Summary ===");
const allPassed =
  q5Similarity === 1.0 &&
  q10Similarity === 0.5 &&
  q10SimilarityBothNull === 1.0;

if (allPassed) {
  console.log("🎉 All tests PASSED!");
} else {
  console.log("❌ Some tests FAILED");
  process.exit(1);
}
