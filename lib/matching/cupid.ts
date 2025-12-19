/**
 * Cupid System Module
 *
 * Handles:
 * 1. Assigning pairs to cupids for review
 * 2. Managing cupid decisions (approve/reject)
 * 3. Creating cupid-initiated matches
 * 4. Generating AI summaries for cupid review
 */

import { prisma } from "../prisma";
import { decryptJSON } from "../encryption";
import {
  CUPID_PAIRS_MIN,
  CUPID_PAIRS_MAX,
  MAX_CUPID_SENT_MATCHES,
  MAX_CUPID_RECEIVED_MATCHES,
  CURRENT_BATCH,
  TEST_MODE_REVEAL,
} from "./config";
import {
  DecryptedResponses,
  CupidDashboard,
  CupidPairAssignment,
  CupidProfileView,
} from "./types";
import { generateProfileSummary } from "./ai";

// ===========================================
// CUPID LOADING
// ===========================================

/**
 * Get all approved cupids
 */
export async function getApprovedCupids(): Promise<
  Array<{
    id: string;
    userId: string;
    cupidDisplayName: string | null;
    matchesCreated: number;
  }>
> {
  const cupids = await prisma.cupidProfile.findMany({
    where: { approved: true },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          cupidDisplayName: true,
        },
      },
    },
  });

  return cupids.map((c) => ({
    id: c.id,
    userId: c.userId,
    cupidDisplayName: c.user.cupidDisplayName || c.user.firstName,
    matchesCreated: c.matchesCreated,
  }));
}

// ===========================================
// PAIR ASSIGNMENT
// ===========================================

/**
 * Assign pairs to cupids for review
 *
 * Strategy:
 * 1. Get all scored pairs above minimum threshold
 * 2. Distribute pairs evenly among cupids
 * 3. Each cupid gets between CUPID_PAIRS_MIN and CUPID_PAIRS_MAX pairs
 * 4. Ensure cupids don't review pairs involving themselves
 */
export async function assignPairsToCupids(
  batchNumber: number = CURRENT_BATCH
): Promise<{
  totalPairs: number;
  totalCupids: number;
  pairsPerCupid: number;
}> {
  console.log(`Assigning pairs to cupids for batch ${batchNumber}...`);

  // Get approved cupids
  const cupids = await getApprovedCupids();

  if (cupids.length === 0) {
    console.log("No approved cupids available");
    return { totalPairs: 0, totalCupids: 0, pairsPerCupid: 0 };
  }

  // Get scored pairs that haven't been assigned yet
  // Get unique pairs (one direction only to avoid duplicates)
  const scoredPairs = await prisma.compatibilityScore.findMany({
    where: {
      batchNumber,
      bidirectionalScore: { not: null },
    },
    orderBy: {
      bidirectionalScore: "desc",
    },
    select: {
      userId: true,
      targetUserId: true,
      bidirectionalScore: true,
    },
  });

  // Deduplicate pairs (keep only one direction)
  const seenPairs = new Set<string>();
  const uniquePairs: typeof scoredPairs = [];

  for (const pair of scoredPairs) {
    const key1 = `${pair.userId}-${pair.targetUserId}`;
    const key2 = `${pair.targetUserId}-${pair.userId}`;

    if (!seenPairs.has(key1) && !seenPairs.has(key2)) {
      seenPairs.add(key1);
      uniquePairs.push(pair);
    }
  }

  // Calculate pairs per cupid
  const totalPairs = uniquePairs.length;
  const pairsPerCupid = Math.min(
    CUPID_PAIRS_MAX,
    Math.max(CUPID_PAIRS_MIN, Math.ceil(totalPairs / cupids.length))
  );

  console.log(
    `Distributing ${totalPairs} pairs among ${cupids.length} cupids (${pairsPerCupid} each)`
  );

  // Assign pairs round-robin style
  let cupidIndex = 0;

  for (const pair of uniquePairs) {
    // Find a cupid who isn't one of the users in this pair
    let assignedCupid = null;
    let attempts = 0;

    while (attempts < cupids.length) {
      const cupid = cupids[cupidIndex];

      // Check if cupid is one of the users
      if (cupid.userId !== pair.userId && cupid.userId !== pair.targetUserId) {
        assignedCupid = cupid;
        break;
      }

      cupidIndex = (cupidIndex + 1) % cupids.length;
      attempts++;
    }

    if (!assignedCupid) {
      console.warn(
        `Could not assign pair ${pair.userId}-${pair.targetUserId} - all cupids are involved`
      );
      continue;
    }

    // Create assignment
    await prisma.cupidAssignment.upsert({
      where: {
        cupidUserId_user1Id_user2Id_batchNumber: {
          cupidUserId: assignedCupid.userId,
          user1Id: pair.userId,
          user2Id: pair.targetUserId,
          batchNumber,
        },
      },
      create: {
        cupidUserId: assignedCupid.userId,
        user1Id: pair.userId,
        user2Id: pair.targetUserId,
        algorithmScore: pair.bidirectionalScore || 0,
        batchNumber,
      },
      update: {
        algorithmScore: pair.bidirectionalScore || 0,
      },
    });

    cupidIndex = (cupidIndex + 1) % cupids.length;
  }

  return {
    totalPairs,
    totalCupids: cupids.length,
    pairsPerCupid,
  };
}

// ===========================================
// CUPID DASHBOARD DATA
// ===========================================

/**
 * Get dashboard data for a specific cupid
 */
export async function getCupidDashboard(
  cupidUserId: string,
  batchNumber: number = CURRENT_BATCH
): Promise<CupidDashboard | null> {
  // Get cupid profile
  const cupidProfile = await prisma.cupidProfile.findUnique({
    where: { userId: cupidUserId },
    include: {
      user: {
        select: {
          firstName: true,
          cupidDisplayName: true,
        },
      },
    },
  });

  if (!cupidProfile) {
    return null;
  }

  // Get assignments for this cupid
  const assignments = await prisma.cupidAssignment.findMany({
    where: {
      cupidUserId,
      batchNumber,
    },
    orderBy: [
      { decision: "asc" }, // Pending first (null)
      { algorithmScore: "desc" },
    ],
  });

  // Calculate stats
  const total = assignments.length;
  const reviewed = assignments.filter((a) => a.decision !== null).length;
  const approved = assignments.filter((a) => a.decision === "approve").length;
  const rejected = assignments.filter((a) => a.decision === "reject").length;
  const pending = total - reviewed;

  // Get pending pairs with user details
  const pendingAssignments = assignments.filter((a) => a.decision === null);
  const pendingPairs: CupidPairAssignment[] = [];

  for (const assignment of pendingAssignments) {
    const pair = await getPairDetails(
      assignment.id,
      assignment.user1Id,
      assignment.user2Id,
      assignment.algorithmScore,
      cupidUserId
    );

    if (pair) {
      pendingPairs.push({
        ...pair,
        decision: assignment.decision as "approve" | "reject" | null,
        decisionReason: assignment.decisionReason,
      });
    }
  }

  return {
    cupidId: cupidProfile.id,
    cupidName:
      cupidProfile.user.cupidDisplayName || cupidProfile.user.firstName,
    totalAssigned: total,
    reviewed,
    approved,
    rejected,
    pending,
    pendingPairs,
  };
}

/**
 * Get detailed profile view for a pair
 */
async function getPairDetails(
  assignmentId: string,
  user1Id: string,
  user2Id: string,
  algorithmScore: number,
  cupidUserId: string
): Promise<Omit<CupidPairAssignment, "decision" | "decisionReason"> | null> {
  // Get both users with their questionnaire data
  const [user1, user2] = await Promise.all([
    getUserProfileForCupid(user1Id),
    getUserProfileForCupid(user2Id),
  ]);

  if (!user1 || !user2) {
    return null;
  }

  return {
    assignmentId,
    cupidUserId,
    user1,
    user2,
    algorithmScore,
  };
}

/**
 * Get user profile with AI summary for cupid review
 */
async function getUserProfileForCupid(
  userId: string
): Promise<CupidProfileView | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      age: true,
      questionnaireResponse: {
        select: {
          responses: true,
        },
      },
    },
  });

  if (!user || !user.questionnaireResponse || !user.age) {
    return null;
  }

  // Decrypt responses
  let responses: DecryptedResponses;
  try {
    responses = decryptJSON<DecryptedResponses>(
      user.questionnaireResponse.responses
    );
  } catch (error) {
    console.error(`Error decrypting responses for user ${userId}:`, error);
    return null;
  }

  // Generate or get cached AI summary
  const profile = await generateProfileSummary(
    userId,
    responses,
    user.firstName,
    user.age
  );

  if (!profile) {
    return null;
  }

  // Add question highlights
  profile.highlights = getQuestionHighlights(responses);

  return profile;
}

/**
 * Get key question/answer highlights for cupid review
 */
function getQuestionHighlights(responses: DecryptedResponses): Array<{
  questionId: string;
  question: string;
  answer: string;
}> {
  const highlights: Array<{
    questionId: string;
    question: string;
    answer: string;
  }> = [];

  // Key questions to highlight
  const highlightQuestions = [
    { id: "Q33", question: "What are you looking for?" },
    { id: "Q60", question: "Non-negotiable in a relationship" },
    { id: "Q61", question: "Hidden passion" },
    { id: "Q62", question: "What matches should know" },
  ];

  for (const q of highlightQuestions) {
    const answer = responses[q.id];
    if (answer) {
      highlights.push({
        questionId: q.id,
        question: q.question,
        answer: typeof answer === "string" ? answer : JSON.stringify(answer),
      });
    }
  }

  return highlights;
}

// ===========================================
// CUPID DECISIONS
// ===========================================

/**
 * Submit cupid's decision for a pair
 */
export async function submitCupidDecision(
  assignmentId: string,
  cupidUserId: string,
  decision: "approve" | "reject",
  reason?: string
): Promise<{ success: boolean; message: string }> {
  // Verify the assignment belongs to this cupid
  const assignment = await prisma.cupidAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    return { success: false, message: "Assignment not found" };
  }

  if (assignment.cupidUserId !== cupidUserId) {
    return { success: false, message: "Unauthorized - not your assignment" };
  }

  if (assignment.decision !== null) {
    return { success: false, message: "Decision already submitted" };
  }

  // Update assignment
  await prisma.cupidAssignment.update({
    where: { id: assignmentId },
    data: {
      decision,
      decisionReason: reason,
      decidedAt: new Date(),
    },
  });

  // If approved, the match will be created when matches are revealed
  // (handled separately to batch cupid approvals)

  return {
    success: true,
    message:
      decision === "approve"
        ? "Pair approved! Match will be created when results are revealed."
        : "Pair rejected.",
  };
}

// ===========================================
// CUPID-INITIATED MATCHES
// ===========================================

/**
 * Create cupid-initiated matches from approved assignments
 *
 * This is called after cupid review period ends to create actual matches.
 */
export async function createCupidApprovedMatches(
  batchNumber: number = CURRENT_BATCH
): Promise<{
  created: number;
  skipped: number;
}> {
  console.log(
    `Creating matches from cupid approvals for batch ${batchNumber}...`
  );

  const approvedAssignments = await prisma.cupidAssignment.findMany({
    where: {
      batchNumber,
      decision: "approve",
    },
    include: {
      cupidUser: {
        select: { id: true },
      },
    },
  });

  let created = 0;
  let skipped = 0;

  const revealedAt = TEST_MODE_REVEAL ? new Date() : null;

  for (const assignment of approvedAssignments) {
    // Check if users haven't exceeded their cupid match limits
    const user1CupidMatches = await prisma.match.count({
      where: {
        userId: assignment.user1Id,
        batchNumber,
        matchType: { in: ["cupid_sent", "cupid_received"] },
      },
    });

    const user2CupidMatches = await prisma.match.count({
      where: {
        userId: assignment.user2Id,
        batchNumber,
        matchType: { in: ["cupid_sent", "cupid_received"] },
      },
    });

    // Check limits
    if (
      user1CupidMatches >=
        MAX_CUPID_SENT_MATCHES + MAX_CUPID_RECEIVED_MATCHES ||
      user2CupidMatches >= MAX_CUPID_SENT_MATCHES + MAX_CUPID_RECEIVED_MATCHES
    ) {
      skipped++;
      continue;
    }

    // Create matches (bidirectional)
    try {
      // User1 -> User2 (cupid_sent from User1's perspective)
      await prisma.match.create({
        data: {
          userId: assignment.user1Id,
          matchedUserId: assignment.user2Id,
          matchType: "cupid_sent",
          compatibilityScore: assignment.algorithmScore,
          cupidId: assignment.cupidUserId,
          batchNumber,
          revealedAt,
        },
      });

      // User2 -> User1 (cupid_received from User2's perspective)
      await prisma.match.create({
        data: {
          userId: assignment.user2Id,
          matchedUserId: assignment.user1Id,
          matchType: "cupid_received",
          compatibilityScore: assignment.algorithmScore,
          cupidId: assignment.cupidUserId,
          batchNumber,
          revealedAt,
        },
      });

      created++;

      // Update cupid's match count
      await prisma.cupidProfile.update({
        where: { userId: assignment.cupidUserId },
        data: { matchesCreated: { increment: 1 } },
      });
    } catch (error) {
      // Match might already exist (duplicate)
      console.warn(
        `Could not create cupid match for ${assignment.user1Id} - ${assignment.user2Id}:`,
        error
      );
      skipped++;
    }
  }

  console.log(`Created ${created} cupid matches, skipped ${skipped}`);

  return { created, skipped };
}

// ===========================================
// MATCH REVEAL
// ===========================================

/**
 * Reveal all matches for a batch
 *
 * Sets revealedAt timestamp on all matches
 */
export async function revealMatches(
  batchNumber: number = CURRENT_BATCH
): Promise<number> {
  console.log(`Revealing matches for batch ${batchNumber}...`);

  const result = await prisma.match.updateMany({
    where: {
      batchNumber,
      revealedAt: null,
    },
    data: {
      revealedAt: new Date(),
    },
  });

  // Update batch status
  await prisma.matchingBatch.update({
    where: { batchNumber },
    data: {
      status: "completed",
      revealedAt: new Date(),
    },
  });

  console.log(`Revealed ${result.count} matches`);
  return result.count;
}

// ===========================================
// CUPID STATS
// ===========================================

/**
 * Get cupid leaderboard/stats
 */
export async function getCupidStats(): Promise<
  Array<{
    cupidId: string;
    displayName: string;
    matchesCreated: number;
    assignmentsReviewed: number;
    approvalRate: number;
  }>
> {
  const cupids = await prisma.cupidProfile.findMany({
    where: { approved: true },
    include: {
      user: {
        select: {
          firstName: true,
          cupidDisplayName: true,
        },
      },
    },
  });

  const stats = await Promise.all(
    cupids.map(async (cupid) => {
      const assignments = await prisma.cupidAssignment.findMany({
        where: { cupidUserId: cupid.userId },
        select: { decision: true },
      });

      const reviewed = assignments.filter((a) => a.decision !== null).length;
      const approved = assignments.filter(
        (a) => a.decision === "approve"
      ).length;

      return {
        cupidId: cupid.id,
        displayName: cupid.user.cupidDisplayName || cupid.user.firstName,
        matchesCreated: cupid.matchesCreated,
        assignmentsReviewed: reviewed,
        approvalRate: reviewed > 0 ? (approved / reviewed) * 100 : 0,
      };
    })
  );

  return stats.sort((a, b) => b.matchesCreated - a.matchesCreated);
}
