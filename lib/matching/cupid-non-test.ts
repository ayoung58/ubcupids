/**
 * Cupid Assignment for Non-Test (Production) Users Only
 */

import { prisma } from "../prisma";
import { CURRENT_BATCH } from "./config";

export async function assignCandidatesToCupidsForNonTestUsers(
  batchNumber: number = CURRENT_BATCH,
): Promise<{
  totalCandidates: number;
  assignedCandidates: number;
  totalCupids: number;
  candidatesPerCupid: number;
  skippedCandidates: number;
  preferredAssignments: number;
}> {
  console.log(
    `Assigning PRODUCTION candidates to cupids for batch ${batchNumber}...`,
  );

  // Clear existing assignments for non-test users
  const deletedCount = await prisma.cupidAssignment.deleteMany({
    where: {
      batchNumber,
      candidate: { isTestUser: false },
    },
  });
  console.log(
    `Cleared ${deletedCount.count} existing PRODUCTION user assignments`,
  );

  // Get PRODUCTION cupids only
  const cupids = await prisma.user.findMany({
    where: {
      isTestUser: false, // ONLY production cupids
      OR: [{ isCupid: true }, { cupidProfile: { isNot: null } }],
      emailVerified: { not: null },
    },
    select: {
      id: true,
      preferredCandidateEmail: true,
    },
  });

  if (cupids.length === 0) {
    console.log("No cupids available");
    return {
      totalCandidates: 0,
      assignedCandidates: 0,
      totalCupids: 0,
      candidatesPerCupid: 0,
      skippedCandidates: 0,
      preferredAssignments: 0,
    };
  }

  // Get PRODUCTION candidates only
  const candidates = await prisma.user.findMany({
    where: {
      isBeingMatched: true,
      isTestUser: false, // ONLY non-test users
      questionnaireResponseV2: {
        isSubmitted: true,
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  console.log(`Found ${candidates.length} PRODUCTION candidates to assign`);

  let assignedCount = 0;
  let skippedCount = 0;
  let preferredCount = 0;
  const assignedCandidateIds = new Set<string>();

  // PHASE 1: Handle preferred candidate assignments
  for (const cupid of cupids) {
    const preferredEmail = cupid.preferredCandidateEmail;
    if (!preferredEmail) continue;

    const preferredCandidate = candidates.find(
      (c) => c.email.toLowerCase() === preferredEmail.toLowerCase(),
    );

    if (
      !preferredCandidate ||
      assignedCandidateIds.has(preferredCandidate.id)
    ) {
      continue;
    }

    // Get top matches (only among non-test users)
    // Sort by candidate→match directional score
    const topMatches = await prisma.compatibilityScore.findMany({
      where: {
        userId: preferredCandidate.id,
        batchNumber,
        bidirectionalScore: { not: null },
        targetUser: {
          isTestUser: false, // Match only with non-test users
          questionnaireResponseV2: {
            isSubmitted: true,
          },
        },
      },
      orderBy: [
        { totalScore: "desc" }, // Sort by user→target score (candidate's preference)
        { bidirectionalScore: "desc" },
      ],
      take: 25,
      select: {
        targetUserId: true,
        bidirectionalScore: true,
        totalScore: true,
      },
    });

    if (topMatches.length === 0) {
      console.log(`Skipping preferred PRODUCTION candidate - no matches`);
      continue;
    }

    const potentialMatches = topMatches.map((match) => ({
      userId: match.targetUserId,
      score: match.bidirectionalScore || 0,
    }));

    await prisma.cupidAssignment.create({
      data: {
        cupidUserId: cupid.id,
        candidateId: preferredCandidate.id,
        potentialMatches: potentialMatches,
        batchNumber,
      },
    });

    assignedCandidateIds.add(preferredCandidate.id);
    assignedCount++;
    preferredCount++;
  }

  // PHASE 2: Round-robin for remaining production candidates
  let cupidIndex = 0;

  for (const candidate of candidates) {
    if (assignedCandidateIds.has(candidate.id)) continue;

    // Get top matches (only among non-test users)
    // Sort by candidate→match directional score
    const topMatches = await prisma.compatibilityScore.findMany({
      where: {
        userId: candidate.id,
        batchNumber,
        bidirectionalScore: { not: null },
        targetUser: {
          isTestUser: false, // Match only with non-test users
          questionnaireResponseV2: {
            isSubmitted: true,
          },
        },
      },
      orderBy: [
        { totalScore: "desc" }, // Sort by user→target score (candidate's preference)
        { bidirectionalScore: "desc" },
      ],
      take: 25,
      select: {
        targetUserId: true,
        bidirectionalScore: true,
        totalScore: true,
      },
    });

    if (topMatches.length === 0) {
      skippedCount++;
      continue;
    }

    const potentialMatches = topMatches.map((match) => ({
      userId: match.targetUserId,
      score: match.bidirectionalScore || 0,
    }));

    const cupid = cupids[cupidIndex];

    await prisma.cupidAssignment.create({
      data: {
        cupidUserId: cupid.id,
        candidateId: candidate.id,
        potentialMatches: potentialMatches,
        batchNumber,
      },
    });

    assignedCount++;
    cupidIndex = (cupidIndex + 1) % cupids.length;
  }

  const candidatesPerCupid =
    cupids.length > 0 ? Math.ceil(assignedCount / cupids.length) : 0;

  console.log(
    `PRODUCTION Assignment Summary: ${assignedCount} candidates assigned`,
  );

  return {
    totalCandidates: candidates.length,
    assignedCandidates: assignedCount,
    totalCupids: cupids.length,
    candidatesPerCupid,
    skippedCandidates: skippedCount,
    preferredAssignments: preferredCount,
  };
}
