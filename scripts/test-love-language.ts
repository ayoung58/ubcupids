import { calculateLoveLanguageCompatibility } from "../lib/matching/v2/special-cases/love-languages";
import { MATCHING_CONFIG } from "../lib/matching/v2/config";

// Test with identical arrays (what we see in production)
const userA = {
  show: ["quality_time", "physical_touch"],
  receive: ["quality_time", "physical_touch"],
};

const userB = {
  show: ["quality_time", "physical_touch"],
  receive: ["quality_time", "physical_touch"],
};

console.log("Testing Love Language Compatibility\n");
console.log("User A:", JSON.stringify(userA));
console.log("User B:", JSON.stringify(userB));
console.log();

const result = calculateLoveLanguageCompatibility(
  userA,
  userB,
  MATCHING_CONFIG
);

console.log("Result:");
console.log("  Show Compatibility:", result.showCompatibility);
console.log("  Receive Compatibility:", result.receiveCompatibility);
console.log("  Weighted Score:", result.weightedScore);
console.log("  Mutual Matches:", result.mutualMatches);
console.log();

console.log("Expected:");
console.log("  Show Compatibility: 1.0 (2/2 matches)");
console.log("  Receive Compatibility: 1.0 (2/2 matches)");
console.log("  Weighted Score: 1.0 (0.6 * 1.0 + 0.4 * 1.0)");
console.log("  Mutual Matches: 4");
