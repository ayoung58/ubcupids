/**
 * Verify the specific Q6 example from the user request
 */

import { calculateSimilarity } from "./lib/matching/v2/similarity";
import type { MatchingUser } from "./lib/matching/v2/types";

function createMockUser(
  id: string,
  responses: Record<string, any>,
): MatchingUser {
  return {
    id,
    email: `${id}@test.com`,
    name: `User ${id}`,
    gender: "man",
    interestedInGenders: ["woman"],
    campus: "Vancouver",
    okMatchingDifferentCampus: true,
    responses: {
      q1: { answer: "man" },
      q2: { answer: ["woman"] },
      ...responses,
    },
    responseRecord: {} as any,
  };
}

// Test the specific case from the user request
const userA = createMockUser("a", {
  q6: {
    answer: ["atheist"],
    preference: "same",
    importance: "somewhat_important",
  },
});

const userB = createMockUser("b", {
  q6: {
    answer: ["agnostic", "atheist"],
    preference: "same",
    importance: "not_important",
  },
});

const similarities = calculateSimilarity(userA, userB);
console.log("User A: ['atheist'] (preference: 'same')");
console.log("User B: ['agnostic','atheist'] (preference: 'same')");
console.log("Result:", similarities.q6);
console.log("Expected: 0.9");
console.log("Match:", similarities.q6 === 0.9 ? "✅ PASS" : "❌ FAIL");
