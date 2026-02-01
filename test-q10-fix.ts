import { calculateDirectionalScoreComplete } from "./lib/matching/v2";
import { DEFAULT_CONFIG } from "./lib/matching/v2/config";

const userA = {
  id: "user-a",
  email: "a@test.com",
  name: "User A",
  gender: "woman",
  interestedInGenders: ["men"],
  campus: "vancouver",
  okMatchingDifferentCampus: false,
  responseRecord: null,
  responses: {
    q10: {
      answer: 3,
      preference: null, // null preference
      importance: "not_important",
    },
  },
} as any;

const userB = {
  id: "user-b",
  email: "b@test.com",
  name: "User B",
  gender: "man",
  interestedInGenders: ["women"],
  campus: "vancouver",
  okMatchingDifferentCampus: false,
  responseRecord: null,
  responses: {
    q10: {
      answer: 4,
      preference: "more", // wants partner to exercise more
      importance: "important",
    },
  },
} as any;

const score = calculateDirectionalScoreComplete(userA, userB, DEFAULT_CONFIG);
console.log(`\nQ10 Test Case:`);
console.log(`User A: answer=3, preference=null, importance=not_important`);
console.log(`User B: answer=4, preference="more", importance=important`);
console.log(`\nDirectional Score A→B: ${score.toFixed(3)}`);
console.log(`Expected: 50.0 (0.5 * 100)`);
console.log(`Status: ${Math.abs(score - 50) < 10 ? "✓ PASS" : "❌ FAIL"}`);
