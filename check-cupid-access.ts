import { prisma } from "./lib/prisma";

async function diagnoseCupidAccess() {
  try {
    // Count production cupids
    const prodCupids = await prisma.user.count({
      where: { isCupid: true, isTestUser: false },
    });
    console.log("✓ Production cupids:", prodCupids);

    // Count test cupids
    const testCupids = await prisma.user.count({
      where: { isCupid: true, isTestUser: true },
    });
    console.log("✓ Test cupids:", testCupids);

    // Count production cupid assignments (both cupid and candidate must be production)
    const prodAssignments = await prisma.cupidAssignment.count({
      where: {
        cupidUser: { isTestUser: false },
        candidate: { isTestUser: false },
      },
    });
    console.log(
      "✓ Production cupid assignments (prod cupid + prod candidate):",
      prodAssignments,
    );

    // Count test cupid assignments
    const testAssignments = await prisma.cupidAssignment.count({
      where: {
        cupidUser: { isTestUser: true },
        candidate: { isTestUser: true },
      },
    });
    console.log("✓ Test cupid assignments:", testAssignments);

    // Count ALL assignments
    const allAssignments = await prisma.cupidAssignment.count();
    console.log("✓ Total cupid assignments (all types):", allAssignments);

    // Check for mismatched assignments (prod cupid with test candidate or vice versa)
    const mismatchedAssignments = await prisma.cupidAssignment.count({
      where: {
        OR: [
          {
            cupidUser: { isTestUser: true },
            candidate: { isTestUser: false },
          },
          {
            cupidUser: { isTestUser: false },
            candidate: { isTestUser: true },
          },
        ],
      },
    });
    console.log("✓ Mismatched type assignments:", mismatchedAssignments);

    // Get production candidates
    const prodCandidates = await prisma.user.count({
      where: { isBeingMatched: true, isTestUser: false },
    });
    console.log("✓ Production candidates:", prodCandidates);

    // Get production candidates who completed Q2
    const prodCandidatesWithQ2 = await prisma.user.count({
      where: {
        isBeingMatched: true,
        isTestUser: false,
        questionnaireResponseV2: {
          isSubmitted: true,
        },
      },
    });
    console.log(
      "✓ Production candidates with completed Q2:",
      prodCandidatesWithQ2,
    );

    console.log("\n========== ANALYSIS ==========");
    if (prodAssignments === 0) {
      console.log("❌ ISSUE: No production cupid assignments found!");
      console.log(
        "   - Production cupids need BOTH cupid and candidate to have isTestUser=false",
      );
      if (allAssignments > 0 && prodAssignments === 0) {
        console.log(
          "   - All " +
            allAssignments +
            " assignments appear to be test-only or mismatched types",
        );
      }
    } else {
      console.log(
        "✅ GOOD: " + prodAssignments + " production cupid assignments found",
      );
    }

    if (prodCupids === 0) {
      console.log(
        "❌ ISSUE: No production cupids exist (isCupid=true, isTestUser=false)",
      );
    } else {
      console.log("✅ GOOD: " + prodCupids + " production cupids exist");
    }

    if (prodCandidates === 0) {
      console.log(
        "❌ ISSUE: No production candidates (isBeingMatched=true, isTestUser=false)",
      );
    } else {
      console.log(
        "✅ GOOD: " + prodCandidates + " production candidates exist",
      );
      if (prodCandidatesWithQ2 < prodCandidates) {
        console.log(
          "⚠️  WARNING: Only " +
            prodCandidatesWithQ2 +
            " have completed Q2 (out of " +
            prodCandidates +
            ")",
        );
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseCupidAccess();
