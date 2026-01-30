import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import {
  runMatchingPipeline,
  MatchingUser,
  calculateDirectionalScoreComplete,
  calculatePairScore,
} from "@/lib/matching/v2";
import { MATCHING_CONFIG, type MatchingConfig } from "@/lib/matching/v2/config";
import { calculateSimilarity } from "@/lib/matching/v2/similarity";

/**
 * Calculate detailed section scores for saving to CompatibilityScore table
 */
function calculateSectionScoresDetailed(
  userA: MatchingUser,
  userB: MatchingUser,
  config: MatchingConfig,
): { section1: number; section2: number } {
  const similarities = calculateSimilarity(userA, userB, config);
  const questionIds = Object.keys(similarities);

  // Section 1: Lifestyle (q1-q20)
  const lifestyleQuestions = [
    "q1",
    "q2",
    "q3",
    "q4",
    "q5",
    "q6",
    "q7",
    "q8",
    "q9a",
    "q9b",
    "q10",
    "q11",
    "q12",
    "q13",
    "q14",
    "q15",
    "q16",
    "q17",
    "q18",
    "q19",
    "q20",
  ];

  // Hard filter questions excluded from scoring
  const HARD_FILTER_QUESTIONS = ["q1", "q2", "q4"];

  let lifestyleScore = 0;
  let lifestyleWeightSum = 0;
  let personalityScore = 0;
  let personalityWeightSum = 0;

  questionIds.forEach((qid) => {
    if (HARD_FILTER_QUESTIONS.includes(qid)) {
      return;
    }

    const rawSim = similarities[qid];
    const importanceStr = userA.responses[qid]?.importance;
    const importance = getImportanceWeight(importanceStr, config);

    if (importance === 0) {
      return;
    }

    const weighted = rawSim * importance;

    if (lifestyleQuestions.includes(qid)) {
      lifestyleScore += weighted;
      lifestyleWeightSum += importance;
    } else {
      personalityScore += weighted;
      personalityWeightSum += importance;
    }
  });

  const avgLifestyle =
    lifestyleWeightSum > 0 ? lifestyleScore / lifestyleWeightSum : 0;
  const avgPersonality =
    personalityWeightSum > 0 ? personalityScore / personalityWeightSum : 0;

  // Return section scores on 0-100 scale
  return {
    section1: avgLifestyle * 100,
    section2: avgPersonality * 100,
  };
}

/**
 * Convert importance string to numeric weight
 */
function getImportanceWeight(
  importance: string | undefined,
  config: MatchingConfig,
): number {
  if (!importance) return config.IMPORTANCE_WEIGHTS.NOT_IMPORTANT;

  const normalized = importance.toUpperCase();
  if (normalized === "NOT_IMPORTANT")
    return config.IMPORTANCE_WEIGHTS.NOT_IMPORTANT;
  if (normalized === "SOMEWHAT_IMPORTANT")
    return config.IMPORTANCE_WEIGHTS.SOMEWHAT_IMPORTANT;
  if (normalized === "IMPORTANT") return config.IMPORTANCE_WEIGHTS.IMPORTANT;
  if (normalized === "VERY_IMPORTANT")
    return config.IMPORTANCE_WEIGHTS.VERY_IMPORTANT;

  return config.IMPORTANCE_WEIGHTS.NOT_IMPORTANT;
}

/**
 * Run Matching Algorithm V2.2
 * POST /api/admin/matching/v2/run
 *
 * Runs the complete 8-phase matching algorithm:
 * 1. Hard Filtering (dealbreakers)
 * 2. Similarity Calculation
 * 3. Importance Weighting
 * 4. Directional Scoring
 * 5. Section Weighting
 * 6. Pair Score Construction
 * 7. Eligibility Thresholding
 * 8. Global Matching (Blossom)
 *
 * Request body:
 * - userIds: string[] (optional) - Specific users to match. If omitted, matches all eligible users.
 * - isTestUser: boolean (optional) - If true, matches test users (isTestUser=true). If false or omitted, matches production users (isTestUser=false).
 * - dryRun: boolean (optional) - If true, runs algorithm but doesn't save matches to database.
 * - includeDiagnostics: boolean (optional) - If true, returns detailed diagnostics.
 *
 * Response:
 * - runId: string - Unique ID for this matching run
 * - timestamp: string - ISO timestamp
 * - userCount: number - Number of users in matching pool
 * - pairScoresCalculated: number - Number of pair scores calculated (Phase 2-6)
 * - eligiblePairs: number - Number of pairs that passed Phase 7
 * - matchesCreated: number - Number of matches created
 * - unmatchedUsers: number - Number of users not matched
 * - diagnostics: object (optional) - Detailed phase-by-phase diagnostics
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      userIds,
      isTestUser = false, // Default to production users
      dryRun = false,
      includeDiagnostics = false,
    } = body;

    // Fetch users with questionnaire responses
    const usersQuery: any = {
      where: {
        isTestUser: isTestUser, // Filter by test/production users
        questionnaireResponseV2: {
          isSubmitted: true, // Only include users who submitted V2
        },
      },
      include: {
        questionnaireResponseV2: true, // Include full V2 response
      },
    };

    // Filter by specific user IDs if provided
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      usersQuery.where.id = { in: userIds };
    }

    const usersRaw = await prisma.user.findMany(usersQuery);

    // Transform users to MatchingUser format
    const users: MatchingUser[] = usersRaw
      .filter((u: any) => u.questionnaireResponseV2)
      .map((u: any) => {
        const responses = (u.questionnaireResponseV2?.responses as any) || {};
        const gender = responses.q1?.answer || "any";
        const interestedInGenders = responses.q2?.answer || ["any"];

        return {
          id: u.id,
          email: u.email,
          name: `${u.firstName} ${u.lastName}`,
          gender: String(gender),
          interestedInGenders: Array.isArray(interestedInGenders)
            ? interestedInGenders.map(String)
            : [String(interestedInGenders)],
          campus: u.campus || "Vancouver",
          okMatchingDifferentCampus: u.okMatchingDifferentCampus ?? true,
          responses,
          responseRecord: u.questionnaireResponseV2!,
        };
      });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No eligible users found with completed questionnaires" },
        { status: 400 },
      );
    }

    // Run matching algorithm
    console.log(
      `[Matching] Running pipeline for ${users.length} users (isTestUser: ${isTestUser})`,
    );
    const result = runMatchingPipeline(users);
    console.log(
      `[Matching] Pipeline complete: ${result.matches.length} matches, ${result.unmatched.length} unmatched`,
    );

    // Generate run ID
    const runId = `match-run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Save matches to database (unless dry run)
    if (!dryRun) {
      const batchNumber = 1; // Single batch system

      // Delete existing algorithm matches for matched users
      const matchedUserIds = new Set<string>();
      result.matches.forEach((m) => {
        matchedUserIds.add(m.userAId);
        matchedUserIds.add(m.userBId);
      });

      await prisma.match.deleteMany({
        where: {
          matchType: "algorithm",
          batchNumber,
          OR: [
            { userId: { in: Array.from(matchedUserIds) } },
            { matchedUserId: { in: Array.from(matchedUserIds) } },
          ],
        },
      });

      // Create new matches (bidirectional - one record per user)
      const matchRecords = [];
      for (const m of result.matches) {
        // Create match for userA -> userB
        matchRecords.push({
          userId: m.userAId,
          matchedUserId: m.userBId,
          matchType: "algorithm",
          compatibilityScore: m.pairScore,
          batchNumber,
          status: "accepted",
        });

        // Create match for userB -> userA
        matchRecords.push({
          userId: m.userBId,
          matchedUserId: m.userAId,
          matchType: "algorithm",
          compatibilityScore: m.pairScore,
          batchNumber,
          status: "accepted",
        });
      }

      await prisma.match.createMany({
        data: matchRecords,
      });

      // Save CompatibilityScore records for all eligible pairs
      console.log(
        `[Matching] Saving compatibility scores for ${result.eligiblePairs.length} eligible pairs...`,
      );

      // Delete existing compatibility scores for these users
      const allUserIds = new Set<string>();
      users.forEach((u) => allUserIds.add(u.id));

      await prisma.compatibilityScore.deleteMany({
        where: {
          batchNumber,
          userId: { in: Array.from(allUserIds) },
        },
      });

      // Create CompatibilityScore records (bidirectional - one record per direction)
      const scoreRecords = [];
      for (const pair of result.eligiblePairs) {
        const userA = users.find((u) => u.id === pair.userAId)!;
        const userB = users.find((u) => u.id === pair.userBId)!;

        // Calculate section scores for A→B direction
        const scoreAtoB = calculateDirectionalScoreComplete(
          userA,
          userB,
          MATCHING_CONFIG,
        );
        const sectionScoresAtoB = calculateSectionScoresDetailed(
          userA,
          userB,
          MATCHING_CONFIG,
        );

        // Calculate section scores for B→A direction
        const scoreBtoA = calculateDirectionalScoreComplete(
          userB,
          userA,
          MATCHING_CONFIG,
        );
        const sectionScoresBtoA = calculateSectionScoresDetailed(
          userB,
          userA,
          MATCHING_CONFIG,
        );

        // Bidirectional score (average of both directions)
        const bidirectionalScore = (scoreAtoB + scoreBtoA) / 2;

        // Create record for userA → userB
        scoreRecords.push({
          userId: pair.userAId,
          targetUserId: pair.userBId,
          section1Score: sectionScoresAtoB.section1,
          section2Score: sectionScoresAtoB.section2,
          section3Score: 0, // Not calculated in V2
          section5Score: 0, // Not calculated in V2
          totalScore: scoreAtoB,
          bidirectionalScore,
          batchNumber,
        });

        // Create record for userB → userA
        scoreRecords.push({
          userId: pair.userBId,
          targetUserId: pair.userAId,
          section1Score: sectionScoresBtoA.section1,
          section2Score: sectionScoresBtoA.section2,
          section3Score: 0, // Not calculated in V2
          section5Score: 0, // Not calculated in V2
          totalScore: scoreBtoA,
          bidirectionalScore,
          batchNumber,
        });
      }

      await prisma.compatibilityScore.createMany({
        data: scoreRecords,
      });

      console.log(
        `[Matching] Saved ${scoreRecords.length} compatibility score records`,
      );
    }

    // Prepare response
    const response: any = {
      runId,
      timestamp,
      dryRun,
      userCount: users.length,
      matchesCreated: result.diagnostics.phase8_matchesCreated,
      unmatchedCount: result.diagnostics.phase8_unmatchedUsers,
      executionTimeMs: result.diagnostics.executionTimeMs,
      pairScoresCalculated: result.diagnostics.phase2to6_pairScoresCalculated,
      eligiblePairs: result.diagnostics.phase7_eligiblePairs,
    };

    // Include diagnostics if requested
    if (includeDiagnostics) {
      // Convert scoreDistribution array to object for React rendering
      const scoreDistributionObj = result.diagnostics.scoreDistribution.reduce(
        (acc, { range, count }) => {
          acc[range] = count;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Generate detailed question-by-question breakdown for multiple random pairs
      const samplePairBreakdowns = [];
      const numSamples = Math.min(5, Math.floor(users.length / 2)); // Up to 5 pairs

      if (users.length >= 2 && numSamples > 0) {
        const usedUserIds = new Set<string>();

        for (let i = 0; i < numSamples; i++) {
          // Pick two random users that haven't been used yet
          const availableUsers = users.filter((u) => !usedUserIds.has(u.id));
          if (availableUsers.length < 2) break;

          const userA =
            availableUsers[Math.floor(Math.random() * availableUsers.length)];
          usedUserIds.add(userA.id);

          const remainingUsers = availableUsers.filter(
            (u) => u.id !== userA.id,
          );
          const userB =
            remainingUsers[Math.floor(Math.random() * remainingUsers.length)];
          usedUserIds.add(userB.id);

          // Calculate similarity scores for all questions
          const similarities = calculateSimilarity(
            userA,
            userB,
            MATCHING_CONFIG,
          );

          // Calculate the directional scores
          const scoreAtoB = calculateDirectionalScoreComplete(
            userA,
            userB,
            MATCHING_CONFIG,
          );
          const scoreBtoA = calculateDirectionalScoreComplete(
            userB,
            userA,
            MATCHING_CONFIG,
          );

          // Calculate final pair score using the pair score calculation
          const pairScoreResult = calculatePairScore(
            scoreAtoB,
            scoreBtoA,
            {},
            MATCHING_CONFIG,
          );

          // Build question breakdown
          const questionBreakdown = Object.entries(similarities)
            .sort((a, b) => {
              // Natural sort for question IDs (q1, q2, q3... q9a, q9b, q10...)
              const extractNum = (qid: string) => {
                const match = qid.match(/\d+/);
                return match ? parseInt(match[0], 10) : 0;
              };
              const numA = extractNum(a[0]);
              const numB = extractNum(b[0]);
              if (numA !== numB) return numA - numB;
              return a[0].localeCompare(b[0]); // For q9a vs q9b
            })
            .map(([questionId, score]) => {
              const userAResp = userA.responses[questionId];
              const userBResp = userB.responses[questionId];

              return {
                questionId,
                userA: {
                  answer: userAResp?.answer,
                  preference: userAResp?.preference,
                  importance: userAResp?.importance,
                },
                userB: {
                  answer: userBResp?.answer,
                  preference: userBResp?.preference,
                  importance: userBResp?.importance,
                },
                similarityScore: Math.round(score * 1000) / 1000,
              };
            });

          const avgSimilarity =
            questionBreakdown.reduce((sum, q) => sum + q.similarityScore, 0) /
            questionBreakdown.length;

          samplePairBreakdowns.push({
            userAId: userA.id,
            userAEmail: userA.email,
            userBId: userB.id,
            userBEmail: userB.email,
            averageSimilarity: Math.round(avgSimilarity * 1000) / 1000,
            finalPairScore: Math.round(pairScoreResult.pairScore * 100) / 100,
            scoreAtoB: Math.round(scoreAtoB * 100) / 100,
            scoreBtoA: Math.round(scoreBtoA * 100) / 100,
            questionCount: questionBreakdown.length,
            questions: questionBreakdown,
          });
        }
      }

      response.diagnostics = {
        executionTimeMs: result.diagnostics.executionTimeMs,

        // Flatten phase diagnostics to match client expectations
        phase1_filteredPairs: result.diagnostics.phase1_filteredPairs,
        phase1_dealbreakers: result.diagnostics.phase1_dealbreakers,

        phase2to6_pairScoresCalculated:
          result.diagnostics.phase2to6_pairScoresCalculated,
        phase2to6_averageRawScore:
          Math.round(result.diagnostics.phase2to6_averageRawScore * 100) / 100,
        scoreDistribution: scoreDistributionObj,

        phase7_eligiblePairs: result.diagnostics.phase7_eligiblePairs,
        phase7_failedAbsolute: result.diagnostics.phase7_failedAbsolute,
        phase7_failedRelativeA: result.diagnostics.phase7_failedRelativeA,
        phase7_failedRelativeB: result.diagnostics.phase7_failedRelativeB,
        phase7_perfectionists: result.diagnostics.phase7_perfectionists,

        phase8_matchesCreated: result.diagnostics.phase8_matchesCreated,
        phase8_unmatchedUsers: result.diagnostics.phase8_unmatchedUsers,
        phase8_averageMatchScore:
          Math.round(result.diagnostics.phase8_averageMatchScore * 100) / 100,
        phase8_medianMatchScore:
          Math.round(result.diagnostics.phase8_medianMatchScore * 100) / 100,
        phase8_minMatchScore:
          Math.round(result.diagnostics.phase8_minMatchScore * 100) / 100,
        phase8_maxMatchScore:
          Math.round(result.diagnostics.phase8_maxMatchScore * 100) / 100,

        unmatchedDetails: result.unmatched.map((u) => ({
          userId: u.userId,
          reason: u.reason,
          bestPossibleScore: u.bestPossibleScore
            ? Math.round(u.bestPossibleScore * 100) / 100
            : undefined,
          bestPossibleMatchId: u.bestPossibleMatchId,
        })),

        // Sample pair breakdowns for manual verification
        samplePairBreakdowns,

        // Actual matches created with detailed breakdowns
        actualMatches: result.matches.map((match) => {
          const userA = users.find((u) => u.id === match.userAId);
          const userB = users.find((u) => u.id === match.userBId);

          if (!userA || !userB) {
            return {
              userAId: match.userAId,
              userAEmail: "unknown",
              userBId: match.userBId,
              userBEmail: "unknown",
              pairScore: Math.round(match.pairScore * 100) / 100,
              scoreAtoB: 0,
              scoreBtoA: 0,
              averageSimilarity: 0,
              questionCount: 0,
              questions: [],
            };
          }

          // Calculate similarities and scores for this match
          const similarities = calculateSimilarity(
            userA,
            userB,
            MATCHING_CONFIG,
          );
          const scoreAtoB = calculateDirectionalScoreComplete(
            userA,
            userB,
            MATCHING_CONFIG,
          );
          const scoreBtoA = calculateDirectionalScoreComplete(
            userB,
            userA,
            MATCHING_CONFIG,
          );

          // Build question breakdown for this match
          const questionBreakdown = Object.entries(similarities)
            .sort((a, b) => {
              const extractNum = (qid: string) => {
                const match = qid.match(/\d+/);
                return match ? parseInt(match[0], 10) : 0;
              };
              const numA = extractNum(a[0]);
              const numB = extractNum(b[0]);
              if (numA !== numB) return numA - numB;
              return a[0].localeCompare(b[0]);
            })
            .map(([questionId, score]) => {
              const userAResp = userA.responses[questionId];
              const userBResp = userB.responses[questionId];

              return {
                questionId,
                userA: {
                  answer: userAResp?.answer,
                  preference: userAResp?.preference,
                  importance: userAResp?.importance,
                },
                userB: {
                  answer: userBResp?.answer,
                  preference: userBResp?.preference,
                  importance: userBResp?.importance,
                },
                similarityScore: Math.round(score * 1000) / 1000,
              };
            });

          const avgSimilarity =
            questionBreakdown.reduce((sum, q) => sum + q.similarityScore, 0) /
            questionBreakdown.length;

          return {
            userAId: userA.id,
            userAEmail: userA.email,
            userBId: userB.id,
            userBEmail: userB.email,
            pairScore: Math.round(match.pairScore * 100) / 100,
            scoreAtoB: Math.round(scoreAtoB * 100) / 100,
            scoreBtoA: Math.round(scoreBtoA * 100) / 100,
            averageSimilarity: Math.round(avgSimilarity * 1000) / 1000,
            questionCount: questionBreakdown.length,
            questions: questionBreakdown,
          };
        }),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error running matching algorithm:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to run matching algorithm",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
