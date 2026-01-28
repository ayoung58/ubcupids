import { prisma } from "../lib/prisma";
import { runMatchingPipeline, MatchingUser } from "../lib/matching/v2";
import { calculateSimilarity } from "../lib/matching/v2/similarity";

async function diagnoseProductionScores() {
  try {
    console.log("🔍 Diagnosing Production User Scores\n");

    // Fetch production users with V2 questionnaires
    const usersRaw = await prisma.user.findMany({
      where: {
        isTestUser: false,
        questionnaireResponseV2: {
          isSubmitted: true,
        },
      },
      include: {
        questionnaireResponseV2: true,
      },
      take: 10, // Sample of 10 users
    });

    console.log(`📊 Found ${usersRaw.length} production users\n`);

    // Transform to MatchingUser format
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

    if (users.length < 2) {
      console.log("❌ Need at least 2 users for comparison");
      return;
    }

    // Analyze first two users in detail
    const userA = users[0];
    const userB = users[1];

    console.log("=== Analyzing Pair ===");
    console.log(`User A: ${userA.email}`);
    console.log(`User B: ${userB.email}`);
    console.log();

    // Calculate similarity with detailed output
    const similarities = calculateSimilarity(userA, userB);

    console.log("=== Question-by-Question Breakdown ===\n");

    // Get all questions from similarity map
    const questions = Object.entries(similarities).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    let totalScore = 0;
    let questionCount = 0;

    for (const [questionId, score] of questions) {
      const userAResp = userA.responses[questionId];
      const userBResp = userB.responses[questionId];

      console.log(`${questionId}:`);
      console.log(`  User A answer: ${JSON.stringify(userAResp?.answer)}`);
      console.log(`  User B answer: ${JSON.stringify(userBResp?.answer)}`);
      console.log(
        `  User A preference: ${JSON.stringify(userAResp?.preference)}`
      );
      console.log(
        `  User B preference: ${JSON.stringify(userBResp?.preference)}`
      );
      console.log(`  User A importance: ${userAResp?.importance || "N/A"}`);
      console.log(`  User B importance: ${userBResp?.importance || "N/A"}`);
      console.log(`  Similarity score: ${score.toFixed(3)}`);
      console.log();

      totalScore += score;
      questionCount++;
    }

    console.log("=== Summary ===");
    console.log(`Total questions compared: ${questionCount}`);
    console.log(
      `Average raw similarity: ${(totalScore / questionCount).toFixed(3)}`
    );
    console.log();

    // Run full matching pipeline for overview
    console.log("=== Running Full Pipeline ===\n");
    const result = runMatchingPipeline(users);

    console.log(`Users: ${result.diagnostics.totalUsers}`);
    console.log(
      `Pairs scored: ${result.diagnostics.phase2to6_pairScoresCalculated}`
    );
    console.log(
      `Average score: ${result.diagnostics.phase2to6_averageRawScore.toFixed(2)}/100`
    );
    console.log(`Eligible pairs: ${result.diagnostics.phase7_eligiblePairs}`);
    console.log(`Matches created: ${result.diagnostics.phase8_matchesCreated}`);
    console.log();

    // Show score distribution
    console.log("Score Distribution:");
    for (const { range, count } of result.diagnostics.scoreDistribution) {
      console.log(`  ${range}: ${count}`);
    }
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseProductionScores();
