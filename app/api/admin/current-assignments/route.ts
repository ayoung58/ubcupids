import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Get current cupid assignments with selection status
 * GET /api/admin/current-assignments?isTestUser=true|false
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameter for user type
    const searchParams = request.nextUrl.searchParams;
    const isTestUser = searchParams.get("isTestUser") === "true";

    // Get all cupid assignments
    const assignments = await prisma.cupidAssignment.findMany({
      where: {
        batchNumber: 1,
        cupidUser: {
          isTestUser,
        },
      },
      include: {
        cupidUser: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
        candidate: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        cupidUser: {
          email: "asc",
        },
      },
    });

    // Group by cupid
    const cupidMap = new Map<
      string,
      {
        cupidId: string;
        cupidEmail: string;
        cupidName: string;
        candidates: Array<{
          assignmentId: string;
          candidateId: string;
          candidateEmail: string;
          candidateName: string;
          isPreferred: boolean;
          hasSelection: boolean;
          selectedMatchId: string | null;
          selectedMatchEmail: string | null;
          selectedMatchName: string | null;
          selectionReason: string | null;
          potentialMatchCount: number;
          topMatches: Array<{
            userId: string;
            email: string;
            name: string;
            score: number;
            isInitiallyVisible: boolean;
          }>;
        }>;
      }
    >();

    // Process each assignment
    for (const assignment of assignments) {
      const cupidId = assignment.cupidUserId;

      if (!cupidMap.has(cupidId)) {
        cupidMap.set(cupidId, {
          cupidId,
          cupidEmail: assignment.cupidUser.email,
          cupidName:
            assignment.cupidUser.displayName ||
            `${assignment.cupidUser.firstName} ${assignment.cupidUser.lastName}`,
          candidates: [],
        });
      }

      const potentialMatches =
        (assignment.potentialMatches as Array<{
          userId: string;
          score: number;
        }>) || [];

      // Get user details for potential matches
      const matchUsers = await prisma.user.findMany({
        where: {
          id: {
            in: potentialMatches.map((m) => m.userId),
          },
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
        },
      });

      const matchUserMap = new Map(
        matchUsers.map((u) => [
          u.id,
          {
            email: u.email,
            name: u.displayName || `${u.firstName} ${u.lastName}`,
          },
        ]),
      );

      const topMatches = potentialMatches.map((match, index) => ({
        userId: match.userId,
        email: matchUserMap.get(match.userId)?.email || "Unknown",
        name: matchUserMap.get(match.userId)?.name || "Unknown",
        score: match.score,
        isInitiallyVisible: index < 5,
      }));

      // Get selected match details if exists
      let selectedMatchEmail: string | null = null;
      let selectedMatchName: string | null = null;
      if (assignment.selectedMatchId) {
        const selectedMatch = matchUserMap.get(assignment.selectedMatchId);
        if (selectedMatch) {
          selectedMatchEmail = selectedMatch.email;
          selectedMatchName = selectedMatch.name;
        }
      }

      cupidMap.get(cupidId)?.candidates.push({
        assignmentId: assignment.id,
        candidateId: assignment.candidateId,
        candidateEmail: assignment.candidate.email,
        candidateName:
          assignment.candidate.displayName ||
          `${assignment.candidate.firstName} ${assignment.candidate.lastName}`,
        isPreferred: false, // Will be determined by checking if candidate email matches cupid's preferred
        hasSelection: assignment.selectedMatchId !== null,
        selectedMatchId: assignment.selectedMatchId,
        selectedMatchEmail,
        selectedMatchName,
        selectionReason: assignment.selectionReason,
        potentialMatchCount: potentialMatches.length,
        topMatches,
      });
    }

    // Convert map to array
    const cupidAssignments = Array.from(cupidMap.values());

    // Calculate statistics
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(
      (a) => a.selectedMatchId !== null,
    ).length;
    const pendingAssignments = totalAssignments - completedAssignments;

    return NextResponse.json({
      cupidAssignments,
      totalCupids: cupidMap.size,
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      completionRate:
        totalAssignments > 0
          ? (completedAssignments / totalAssignments) * 100
          : 0,
    });
  } catch (error) {
    console.error("Error fetching current assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch current assignments" },
      { status: 500 },
    );
  }
}
