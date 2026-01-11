/**
 * Blossom Integration for V2 Matching Algorithm
 *
 * Integrates the Edmonds Blossom algorithm for maximum-weight perfect matching.
 * This ensures globally optimal matching rather than greedy local optimization.
 */

import Blossom from "edmonds-blossom";
import { PairScore, BlossomEdge } from "./algorithmV2";

export interface BlossomMatch {
  userA: string;
  userB: string;
  score: number;
}

/**
 * Run Edmonds Blossom maximum-weight matching algorithm
 *
 * @param edges - Array of edges with weights (from algorithmV2 blossomEdges)
 * @param userIds - Complete list of user IDs to match
 * @returns Array of matched pairs
 */
export function runBlossomMatching(
  edges: BlossomEdge[],
  userIds: string[]
): BlossomMatch[] {
  if (userIds.length === 0) {
    console.log("No users to match");
    return [];
  }

  if (edges.length === 0) {
    console.log("No eligible edges for matching");
    return [];
  }

  // Create mapping from user IDs to indices
  const userIdToIndex = new Map<string, number>();
  const indexToUserId = new Map<number, string>();

  userIds.forEach((id, index) => {
    userIdToIndex.set(id, index);
    indexToUserId.set(index, id);
  });

  // Convert edges to Blossom format: [indexA, indexB, weight]
  const blossomEdges: [number, number, number][] = edges
    .map((edge) => {
      const fromIdx = userIdToIndex.get(edge.from);
      const toIdx = userIdToIndex.get(edge.to);

      if (fromIdx === undefined || toIdx === undefined) {
        console.warn(
          `Edge references unknown user: ${edge.from} or ${edge.to}`
        );
        return null;
      }

      return [fromIdx, toIdx, edge.weight] as [number, number, number];
    })
    .filter((edge): edge is [number, number, number] => edge !== null);

  console.log(
    `Running Blossom algorithm with ${blossomEdges.length} edges and ${userIds.length} users`
  );

  // Run Blossom algorithm
  // Returns array where result[i] = j means user i is matched to user j
  // Returns -1 if user is unmatched
  const matching = Blossom(blossomEdges, true); // true = maximum weight

  // Convert Blossom result to matches
  const matches: BlossomMatch[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < matching.length; i++) {
    const j = matching[i];

    // Skip if unmatched or already processed
    if (j === -1 || processed.has(i)) continue;

    // Only process each pair once (i < j)
    if (i < j) {
      const userA = indexToUserId.get(i);
      const userB = indexToUserId.get(j);

      if (!userA || !userB) continue;

      // Find the original score for this pair
      const edge = edges.find(
        (e) =>
          (e.from === userA && e.to === userB) ||
          (e.from === userB && e.to === userA)
      );

      if (edge) {
        matches.push({
          userA,
          userB,
          score: edge.weight / 1000, // Convert back to 0-1 scale
        });
      }

      processed.add(i);
      processed.add(j);
    }
  }

  console.log(
    `Blossom matching complete: ${matches.length} matches created, ${userIds.length - matches.length * 2} users unmatched`
  );

  return matches;
}

/**
 * Run Blossom matching with fallback to top-N for unmatched users
 *
 * @param edges - Eligible edges from algorithmV2
 * @param eligiblePairs - All eligible pairs with scores
 * @param userIds - All user IDs
 * @param maxMatchesPerUser - Maximum matches per user (default 3)
 * @returns Array of matches
 */
export function runBlossomWithFallback(
  edges: BlossomEdge[],
  eligiblePairs: PairScore[],
  userIds: string[],
  maxMatchesPerUser: number = 3
): BlossomMatch[] {
  // Run Blossom for primary matches
  const blossomMatches = runBlossomMatching(edges, userIds);

  // Track matched users
  const matchedUsers = new Set<string>();
  const userMatchCounts = new Map<string, number>();

  blossomMatches.forEach((match) => {
    matchedUsers.add(match.userA);
    matchedUsers.add(match.userB);
    userMatchCounts.set(
      match.userA,
      (userMatchCounts.get(match.userA) || 0) + 1
    );
    userMatchCounts.set(
      match.userB,
      (userMatchCounts.get(match.userB) || 0) + 1
    );
  });

  const allMatches = [...blossomMatches];

  // Find unmatched or under-matched users
  const needsMoreMatches = userIds.filter(
    (userId) => (userMatchCounts.get(userId) || 0) < maxMatchesPerUser
  );

  if (needsMoreMatches.length > 0) {
    console.log(
      `${needsMoreMatches.length} users need additional matches (fallback to top-N)`
    );

    // For each user needing more matches, find their top-scoring eligible pairs
    for (const userId of needsMoreMatches) {
      const currentCount = userMatchCounts.get(userId) || 0;
      const needed = maxMatchesPerUser - currentCount;

      // Get all eligible pairs for this user, sorted by score
      const userPairs = eligiblePairs
        .filter(
          (pair) =>
            (pair.userA === userId || pair.userB === userId) &&
            !isAlreadyMatched(pair, allMatches)
        )
        .sort((a, b) => b.totalScore - a.totalScore);

      // Add top N pairs
      for (let i = 0; i < Math.min(needed, userPairs.length); i++) {
        const pair = userPairs[i];
        const otherUser = pair.userA === userId ? pair.userB : pair.userA;

        // Check if other user also needs matches
        const otherCount = userMatchCounts.get(otherUser) || 0;
        if (otherCount < maxMatchesPerUser) {
          allMatches.push({
            userA: userId,
            userB: otherUser,
            score: pair.totalScore,
          });

          userMatchCounts.set(userId, (userMatchCounts.get(userId) || 0) + 1);
          userMatchCounts.set(
            otherUser,
            (userMatchCounts.get(otherUser) || 0) + 1
          );
        }
      }
    }
  }

  console.log(`Total matches after fallback: ${allMatches.length}`);

  return allMatches;
}

/**
 * Check if a pair is already matched
 */
function isAlreadyMatched(pair: PairScore, matches: BlossomMatch[]): boolean {
  return matches.some(
    (m) =>
      (m.userA === pair.userA && m.userB === pair.userB) ||
      (m.userA === pair.userB && m.userB === pair.userA)
  );
}

/**
 * Get statistics about Blossom matching results
 */
export function getBlossomStats(
  matches: BlossomMatch[],
  totalUsers: number
): {
  totalMatches: number;
  matchedUsers: number;
  unmatchedUsers: number;
  averageScore: number;
  minScore: number;
  maxScore: number;
} {
  const matchedUsersSet = new Set<string>();
  matches.forEach((m) => {
    matchedUsersSet.add(m.userA);
    matchedUsersSet.add(m.userB);
  });

  const scores = matches.map((m) => m.score);
  const avgScore =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

  return {
    totalMatches: matches.length,
    matchedUsers: matchedUsersSet.size,
    unmatchedUsers: totalUsers - matchedUsersSet.size,
    averageScore: avgScore,
    minScore: scores.length > 0 ? Math.min(...scores) : 0,
    maxScore: scores.length > 0 ? Math.max(...scores) : 0,
  };
}
