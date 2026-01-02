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
  PotentialMatch,
  CupidCandidateAssignment,
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
 * Assign candidates to cupids for match selection
 *
 * NEW STRATEGY:
 * 1. Each cupid is assigned ONE candidate
 * 2. For each candidate, we provide their top 5 compatible matches
 * 3. Cupid selects the BEST match for their assigned candidate
 * 4. If more candidates than cupids, some cupids get multiple candidates
 * 5. Candidates with fewer than 5 compatible matches are skipped
 */
export async function assignCandidatesToCupids(
  batchNumber: number = CURRENT_BATCH
): Promise<{
  totalCandidates: number;
  assignedCandidates: number;
  totalCupids: number;
  candidatesPerCupid: number;
  skippedCandidates: number;
  preferredAssignments: number;
}> {
  console.log(`Assigning candidates to cupids for batch ${batchNumber}...`);

  // Clear existing assignments for this batch to prevent duplicates
  const deletedCount = await prisma.cupidAssignment.deleteMany({
    where: { batchNumber },
  });
  console.log(`Cleared ${deletedCount.count} existing assignments for batch ${batchNumber}`);

  // Get ALL cupids: users with isCupid=true OR users with CupidProfile entries
  const usersWithIsCupid = await prisma.user.findMany({
    where: {
      isCupid: true,
      emailVerified: { not: null },
    },
    select: {
      id: true,
      preferredCandidateEmail: true,
    },
  });

  const usersWithCupidProfile = await prisma.cupidProfile.findMany({
    where: {
      user: {
        emailVerified: { not: null },
      },
    },
    select: {
      userId: true,
      user: {
        select: {
          preferredCandidateEmail: true,
        },
      },
    },
  });

  // Merge and deduplicate
  const cupidMap = new Map<string, string | null>();

  usersWithIsCupid.forEach((u) => {
    cupidMap.set(u.id, u.preferredCandidateEmail);
  });

  usersWithCupidProfile.forEach((cp) => {
    if (!cupidMap.has(cp.userId)) {
      cupidMap.set(cp.userId, cp.user.preferredCandidateEmail);
    }
  });

  // Ensure all have approved CupidProfile entries
  for (const userId of cupidMap.keys()) {
    const profile = await prisma.cupidProfile.findUnique({ where: { userId } });
    if (!profile) {
      await prisma.cupidProfile.create({
        data: { userId, approved: true },
      });
    } else if (!profile.approved) {
      await prisma.cupidProfile.update({
        where: { userId },
        data: { approved: true },
      });
    }
  }

  const cupids = Array.from(cupidMap.entries()).map(([userId, email]) => ({
    userId,
    user: { preferredCandidateEmail: email },
  }));

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

  // Get all candidates (users who are being matched and have completed questionnaire)
  const candidates = await prisma.user.findMany({
    where: {
      isBeingMatched: true,
      questionnaireResponse: {
        isSubmitted: true,
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  console.log(`Found ${candidates.length} candidates to assign`);

  let assignedCount = 0;
  let skippedCount = 0;
  let preferredCount = 0;
  const assignedCandidateIds = new Set<string>();

  // PHASE 1: Handle preferred candidate assignments
  console.log("Phase 1: Assigning preferred candidates...");
  for (const cupid of cupids) {
    const preferredEmail = cupid.user.preferredCandidateEmail;

    if (!preferredEmail) {
      continue;
    }

    // Find the preferred candidate
    const preferredCandidate = candidates.find(
      (c) => c.email.toLowerCase() === preferredEmail.toLowerCase()
    );

    if (!preferredCandidate) {
      console.log(
        `Cupid ${cupid.userId}'s preferred candidate (${preferredEmail}) not found or not eligible`
      );
      continue;
    }

    // Check if this candidate is already assigned
    if (assignedCandidateIds.has(preferredCandidate.id)) {
      console.log(
        `Preferred candidate ${preferredCandidate.id} already assigned to another cupid`
      );
      continue;
    }

    // Get top compatible matches for this candidate
    const topMatches = await prisma.compatibilityScore.findMany({
      where: {
        userId: preferredCandidate.id,
        batchNumber,
        bidirectionalScore: { not: null },
        targetUser: {
          questionnaireResponse: {
            isSubmitted: true,
          },
        },
      },
      orderBy: {
        bidirectionalScore: "desc",
      },
      take: 5,
      select: {
        targetUserId: true,
        bidirectionalScore: true,
      },
    });

    // Skip if no matches at all
    if (topMatches.length === 0) {
      console.log(
        `Skipping preferred candidate ${preferredCandidate.id} - has no compatible matches`
      );
      continue;
    }

    // Prepare potential matches data
    const potentialMatches = topMatches.map((match) => ({
      userId: match.targetUserId,
      score: match.bidirectionalScore || 0,
    }));

    // Create assignment
    await prisma.cupidAssignment.create({
      data: {
        cupidUserId: cupid.userId,
        candidateId: preferredCandidate.id,
        potentialMatches: potentialMatches,
        batchNumber,
      },
    });

    assignedCandidateIds.add(preferredCandidate.id);
    assignedCount++;
    preferredCount++;

    console.log(
      `✓ Assigned preferred candidate ${preferredCandidate.id} to cupid ${cupid.userId}`
    );
  }

  // PHASE 2: Round-robin assignment for remaining candidates
  console.log("Phase 2: Round-robin assignment for remaining candidates...");
  let cupidIndex = 0;

  for (const candidate of candidates) {
    // Skip if already assigned in Phase 1
    if (assignedCandidateIds.has(candidate.id)) {
      continue;
    }

    // Get top compatible matches for this candidate
    const topMatches = await prisma.compatibilityScore.findMany({
      where: {
        userId: candidate.id,
        batchNumber,
        bidirectionalScore: { not: null },
        targetUser: {
          questionnaireResponse: {
            isSubmitted: true,
          },
        },
      },
      orderBy: {
        bidirectionalScore: "desc",
      },
      take: 5,
      select: {
        targetUserId: true,
        bidirectionalScore: true,
      },
    });

    // Skip candidates with no compatible matches
    if (topMatches.length === 0) {
      console.log(
        `Skipping candidate ${candidate.id} - has no compatible matches`
      );
      skippedCount++;
      continue;
    }

    // Prepare potential matches data
    const potentialMatches = topMatches.map((match) => ({
      userId: match.targetUserId,
      score: match.bidirectionalScore || 0,
    }));

    // Find next cupid who doesn't already have an assignment
    let assignedToExistingCupid = false;
    for (let i = 0; i < cupids.length; i++) {
      const cupid = cupids[cupidIndex];

      // Check if this cupid already has an assignment
      const existingAssignment = await prisma.cupidAssignment.findFirst({
        where: {
          cupidUserId: cupid.userId,
          batchNumber,
        },
      });

      if (!existingAssignment) {
        // Assign to this cupid
        await prisma.cupidAssignment.create({
          data: {
            cupidUserId: cupid.userId,
            candidateId: candidate.id,
            potentialMatches: potentialMatches,
            batchNumber,
          },
        });

        console.log(
          `Assigned candidate ${candidate.id} to cupid ${cupid.userId}`
        );

        assignedCount++;
        assignedToExistingCupid = true;
        cupidIndex = (cupidIndex + 1) % cupids.length;
        break;
      }

      cupidIndex = (cupidIndex + 1) % cupids.length;
    }

    // If all cupids have assignments, we can still assign more (cupids can have multiple)
    if (!assignedToExistingCupid) {
      const cupid = cupids[cupidIndex];

      await prisma.cupidAssignment.create({
        data: {
          cupidUserId: cupid.userId,
          candidateId: candidate.id,
          potentialMatches: potentialMatches,
          batchNumber,
        },
      });

      console.log(
        `Assigned additional candidate ${candidate.id} to cupid ${cupid.userId}`
      );

      assignedCount++;
      cupidIndex = (cupidIndex + 1) % cupids.length;
    }
  }

  const candidatesPerCupid = Math.ceil(assignedCount / cupids.length);

  console.log(`\n=== Assignment Summary ===`);
  console.log(`Total candidates: ${candidates.length}`);
  console.log(`Assigned candidates: ${assignedCount}`);
  console.log(`  - Preferred assignments: ${preferredCount}`);
  console.log(`  - Regular assignments: ${assignedCount - preferredCount}`);
  console.log(`Skipped candidates: ${skippedCount}`);
  console.log(`Total cupids: ${cupids.length}`);
  console.log(`Candidates per cupid: ~${candidatesPerCupid}`);

  return {
    totalCandidates: candidates.length,
    assignedCandidates: assignedCount,
    totalCupids: cupids.length,
    candidatesPerCupid,
    skippedCandidates: skippedCount,
    preferredAssignments: preferredCount,
  };
}

// Keep old function name for backwards compatibility during transition
export const assignPairsToCupids = assignCandidatesToCupids;

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
      { selectedMatchId: "asc" }, // Pending first (null)
      { createdAt: "asc" },
    ],
  });

  // Calculate stats
  const total = assignments.length;
  const reviewed = assignments.filter((a) => a.selectedMatchId !== null).length;
  const pending = total - reviewed;

  // Get pending assignments with candidate and potential match details
  const pendingAssignments = assignments.filter(
    (a) => a.selectedMatchId === null
  );
  const pendingCandidateAssignments: CupidPairAssignment[] = [];

  for (const assignment of pendingAssignments) {
    const candidateAssignment = await getCandidateAssignmentDetails(
      assignment.id,
      assignment.candidateId,
      assignment.potentialMatches as { userId: string; score: number }[],
      cupidUserId
    );

    if (candidateAssignment) {
      pendingCandidateAssignments.push({
        ...candidateAssignment,
        selectedMatchId: assignment.selectedMatchId,
        selectionReason: assignment.selectionReason,
      });
    }
  }

  return {
    cupidId: cupidProfile.id,
    cupidName:
      cupidProfile.user.cupidDisplayName || cupidProfile.user.firstName,
    totalAssigned: total,
    reviewed,
    pending,
    pendingAssignments: pendingCandidateAssignments,
  };
}

/**
 * Get detailed view for a candidate assignment (candidate + their potential matches)
 */
async function getCandidateAssignmentDetails(
  assignmentId: string,
  candidateId: string,
  potentialMatchesData: { userId: string; score: number }[],
  cupidUserId: string
): Promise<Omit<
  CupidCandidateAssignment,
  "selectedMatchId" | "selectionReason"
> | null> {
  try {
    // Get candidate profile
    const candidateProfile = await getUserProfileForCupid(candidateId);
    if (!candidateProfile) {
      console.error(`Could not load candidate profile for ${candidateId}`);
      return null;
    }

    // Get profiles for all potential matches
    const potentialMatches: PotentialMatch[] = [];
    for (const matchData of potentialMatchesData) {
      const matchProfile = await getUserProfileForCupid(matchData.userId);
      if (matchProfile) {
        potentialMatches.push({
          userId: matchData.userId,
          score: matchData.score,
          profile: matchProfile,
        });
      } else {
        console.warn(
          `Could not load profile for potential match ${matchData.userId}`
        );
      }
    }

    if (potentialMatches.length === 0) {
      console.error(`No potential matches loaded for candidate ${candidateId}`);
      return null;
    }

    return {
      assignmentId,
      cupidUserId,
      candidate: candidateProfile,
      potentialMatches,
    };
  } catch (error) {
    console.error(`Error loading candidate assignment ${assignmentId}:`, error);
    return null;
  }
}

/**
 * Get detailed profile view for a user (for cupid review)
 * @deprecated Use getCandidateAssignmentDetails for new system
 */
async function getPairDetails(
  assignmentId: string,
  user1Id: string,
  user2Id: string,
  algorithmScore: number,
  cupidUserId: string
): Promise<{
  assignmentId: string;
  cupidUserId: string;
  user1: CupidProfileView;
  user2: CupidProfileView;
  algorithmScore: number;
} | null> {
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
      bio: true,
      interests: true,
      major: true,
      profilePicture: true,
      showBioToMatches: true,
      showInterestsToMatches: true,
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

  // Add bio and interests if available and visible
  profile.bio = user.showBioToMatches ? user.bio : null;
  profile.interests = user.showInterestsToMatches ? user.interests : null;
  profile.major = user.major;
  profile.profilePicture = user.profilePicture;

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
/**
 * Submit cupid's match selection for their assigned candidate
 */
export async function submitCupidSelection(
  assignmentId: string,
  cupidUserId: string,
  selectedMatchId: string,
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

  if (assignment.selectedMatchId !== null) {
    return { success: false, message: "Selection already submitted" };
  }

  // Verify the selected match is one of the potential matches
  const potentialMatches = assignment.potentialMatches as {
    userId: string;
    score: number;
  }[];
  const isValidSelection = potentialMatches.some(
    (m) => m.userId === selectedMatchId
  );

  if (!isValidSelection) {
    return {
      success: false,
      message: "Invalid selection - not in potential matches list",
    };
  }

  // Update assignment with selection
  await prisma.cupidAssignment.update({
    where: { id: assignmentId },
    data: {
      selectedMatchId,
      selectionReason: reason,
      decidedAt: new Date(),
    },
  });

  return {
    success: true,
    message:
      "Match selected! This pairing will be created when results are revealed.",
  };
}

// Keep old function name for backwards compatibility
export const submitCupidDecision = submitCupidSelection;

// ===========================================
// CUPID-INITIATED MATCHES
// ===========================================

/**
 * Create cupid-initiated matches from cupid selections
 *
 * This is called after cupid review period ends to create actual matches.
 */
export async function createCupidSelectedMatches(
  batchNumber: number = CURRENT_BATCH
): Promise<{
  created: number;
  skipped: number;
}> {
  console.log(
    `Creating matches from cupid selections for batch ${batchNumber}...`
  );

  const completedAssignments = await prisma.cupidAssignment.findMany({
    where: {
      batchNumber,
      selectedMatchId: { not: null },
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

  for (const assignment of completedAssignments) {
    const candidateId = assignment.candidateId;
    const selectedMatchId = assignment.selectedMatchId!;

    // Check if candidate hasn't exceeded their cupid match limits
    const candidateCupidMatches = await prisma.match.count({
      where: {
        userId: candidateId,
        batchNumber,
        matchType: { in: ["cupid_sent", "cupid_received"] },
      },
    });

    const selectedMatchCupidMatches = await prisma.match.count({
      where: {
        userId: selectedMatchId,
        batchNumber,
        matchType: { in: ["cupid_sent", "cupid_received"] },
      },
    });

    // Check limits
    if (
      candidateCupidMatches >=
        MAX_CUPID_SENT_MATCHES + MAX_CUPID_RECEIVED_MATCHES ||
      selectedMatchCupidMatches >=
        MAX_CUPID_SENT_MATCHES + MAX_CUPID_RECEIVED_MATCHES
    ) {
      skipped++;
      continue;
    }

    // Get compatibility score from the potential matches
    const potentialMatches = assignment.potentialMatches as {
      userId: string;
      score: number;
    }[];
    const matchData = potentialMatches.find(
      (m) => m.userId === selectedMatchId
    );
    const compatibilityScore = matchData?.score || 0;

    // Create matches (bidirectional)
    try {
      // Candidate -> Selected Match (cupid_sent from candidate's perspective)
      // Status: pending until the other person accepts
      await prisma.match.create({
        data: {
          userId: candidateId,
          matchedUserId: selectedMatchId,
          matchType: "cupid_sent",
          compatibilityScore,
          cupidId: assignment.cupidUserId,
          cupidComment: null, // Cupid can add comment later if needed
          batchNumber,
          status: "pending", // Cupid matches start as pending
          revealedAt,
        },
      });

      // Selected Match -> Candidate (cupid_received from selected match's perspective)
      // Status: pending until they accept/decline
      await prisma.match.create({
        data: {
          userId: selectedMatchId,
          matchedUserId: candidateId,
          matchType: "cupid_received",
          compatibilityScore,
          cupidId: assignment.cupidUserId,
          cupidComment: null, // Cupid can add comment later if needed
          batchNumber,
          status: "pending", // Cupid matches start as pending
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
        `Could not create cupid match for ${candidateId} - ${selectedMatchId}:`,
        error
      );
      skipped++;
    }
  }

  console.log(`Created ${created} cupid matches, skipped ${skipped}`);

  return { created, skipped };
}

// Keep old function name for backwards compatibility
export const createCupidApprovedMatches = createCupidSelectedMatches;

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
      // revealedAt: null,
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
        select: { selectedMatchId: true },
      });

      const reviewed = assignments.filter(
        (a) => a.selectedMatchId !== null
      ).length;

      return {
        cupidId: cupid.id,
        displayName: cupid.user.cupidDisplayName || cupid.user.firstName,
        matchesCreated: cupid.matchesCreated,
        assignmentsReviewed: reviewed,
        approvalRate: reviewed > 0 ? 100 : 0, // All reviewed assignments result in matches now
      };
    })
  );

  return stats.sort((a, b) => b.matchesCreated - a.matchesCreated);
}
