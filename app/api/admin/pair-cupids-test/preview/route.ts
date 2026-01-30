import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Preview Cupid Assignment for Test Users
 * POST /api/admin/pair-cupids-test/preview
 *
 * Shows what assignments would be made WITHOUT saving to database
 */
export async function POST() {
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

    const batchNumber = 1;

    // Check if compatibility scores exist for test users
    const scoreCount = await prisma.compatibilityScore.count({
      where: {
        batchNumber,
        bidirectionalScore: { not: null },
        user: { isTestUser: true },
        targetUser: { isTestUser: true },
      },
    });

    if (scoreCount === 0) {
      return NextResponse.json(
        {
          error:
            "No compatibility scores found for test users. Run the matching algorithm for test users first.",
        },
        { status: 400 },
      );
    }

    // Get TEST cupids only
    const cupids = await prisma.user.findMany({
      where: {
        isTestUser: true,
        OR: [{ isCupid: true }, { cupidProfile: { isNot: null } }],
        emailVerified: { not: null },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        preferredCandidateEmail: true,
      },
    });

    if (cupids.length === 0) {
      return NextResponse.json(
        { error: "No test cupids available" },
        { status: 400 },
      );
    }

    // Get TEST candidates only
    const candidates = await prisma.user.findMany({
      where: {
        isBeingMatched: true,
        isTestUser: true,
        questionnaireResponseV2: {
          isSubmitted: true,
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "No test candidates available" },
        { status: 400 },
      );
    }

    // Simulate assignment logic
    const assignments: Array<{
      cupidId: string;
      cupidEmail: string;
      cupidDisplayName: string | null;
      candidates: Array<{
        candidateId: string;
        candidateEmail: string;
        candidateDisplayName: string | null;
        isPreferred: boolean;
        top25Matches: Array<{
          userId: string;
          email: string;
          displayName: string | null;
          score: number;
          isInitiallyVisible: boolean;
        }>;
      }>;
    }> = [];

    const assignedCandidateIds = new Set<string>();
    let preferredCount = 0;

    // Phase 1: Preferred assignments
    for (const cupid of cupids) {
      if (!cupid.preferredCandidateEmail) continue;

      const preferredCandidate = candidates.find(
        (c) =>
          c.email.toLowerCase() ===
          cupid.preferredCandidateEmail!.toLowerCase(),
      );

      if (
        !preferredCandidate ||
        assignedCandidateIds.has(preferredCandidate.id)
      ) {
        continue;
      }

      // Get top 25 matches for this candidate
      const topMatches = await prisma.compatibilityScore.findMany({
        where: {
          userId: preferredCandidate.id,
          batchNumber,
          bidirectionalScore: { not: null },
          targetUser: {
            isTestUser: true,
            questionnaireResponseV2: {
              isSubmitted: true,
            },
          },
        },
        orderBy: [{ totalScore: "desc" }, { bidirectionalScore: "desc" }],
        take: 25,
        include: {
          targetUser: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      });

      if (topMatches.length === 0) continue;

      const potentialMatches = topMatches.map((match, index) => ({
        userId: match.targetUserId,
        email: match.targetUser.email,
        displayName: match.targetUser.displayName,
        score: match.bidirectionalScore || 0,
        isInitiallyVisible: index < 5, // First 5 are initially visible
      }));

      let cupidAssignment = assignments.find((a) => a.cupidId === cupid.id);
      if (!cupidAssignment) {
        cupidAssignment = {
          cupidId: cupid.id,
          cupidEmail: cupid.email,
          cupidDisplayName: cupid.displayName,
          candidates: [],
        };
        assignments.push(cupidAssignment);
      }

      cupidAssignment.candidates.push({
        candidateId: preferredCandidate.id,
        candidateEmail: preferredCandidate.email,
        candidateDisplayName: preferredCandidate.displayName,
        isPreferred: true,
        top25Matches: potentialMatches,
      });

      assignedCandidateIds.add(preferredCandidate.id);
      preferredCount++;
    }

    // Phase 2: Round-robin assignment
    let cupidIndex = 0;
    for (const candidate of candidates) {
      if (assignedCandidateIds.has(candidate.id)) continue;

      // Get top 25 matches
      const topMatches = await prisma.compatibilityScore.findMany({
        where: {
          userId: candidate.id,
          batchNumber,
          bidirectionalScore: { not: null },
          targetUser: {
            isTestUser: true,
            questionnaireResponseV2: {
              isSubmitted: true,
            },
          },
        },
        orderBy: [{ totalScore: "desc" }, { bidirectionalScore: "desc" }],
        take: 25,
        include: {
          targetUser: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      });

      if (topMatches.length === 0) continue;

      const potentialMatches = topMatches.map((match, index) => ({
        userId: match.targetUserId,
        email: match.targetUser.email,
        displayName: match.targetUser.displayName,
        score: match.bidirectionalScore || 0,
        isInitiallyVisible: index < 5,
      }));

      const cupid = cupids[cupidIndex];
      let cupidAssignment = assignments.find((a) => a.cupidId === cupid.id);
      if (!cupidAssignment) {
        cupidAssignment = {
          cupidId: cupid.id,
          cupidEmail: cupid.email,
          cupidDisplayName: cupid.displayName,
          candidates: [],
        };
        assignments.push(cupidAssignment);
      }

      cupidAssignment.candidates.push({
        candidateId: candidate.id,
        candidateEmail: candidate.email,
        candidateDisplayName: candidate.displayName,
        isPreferred: false,
        top25Matches: potentialMatches,
      });

      assignedCandidateIds.add(candidate.id);
      cupidIndex = (cupidIndex + 1) % cupids.length;
    }

    return NextResponse.json({
      preview: true,
      totalCandidates: candidates.length,
      assignedCandidates: assignedCandidateIds.size,
      totalCupids: cupids.length,
      candidatesPerCupid:
        cupids.length > 0
          ? Math.ceil(assignedCandidateIds.size / cupids.length)
          : 0,
      skippedCandidates: candidates.length - assignedCandidateIds.size,
      preferredAssignments: preferredCount,
      assignments,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 },
    );
  }
}
