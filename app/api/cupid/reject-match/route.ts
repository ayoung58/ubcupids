/**
 * Reject Match API
 *
 * POST /api/cupid/reject-match
 * Persists a rejected match for a cupid's assignment
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is an approved cupid
    const cupidProfile = await prisma.cupidProfile.findUnique({
      where: { userId },
      select: { approved: true },
    });

    if (!cupidProfile?.approved) {
      return NextResponse.json(
        { error: "Not an approved cupid" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { assignmentId, rejectedUserId } = body;

    if (!assignmentId || !rejectedUserId) {
      return NextResponse.json(
        { error: "Missing assignmentId or rejectedUserId" },
        { status: 400 }
      );
    }

    // Get the assignment
    const assignment = await prisma.cupidAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Verify this assignment belongs to the cupid
    if (assignment.cupidUserId !== userId) {
      return NextResponse.json(
        { error: "Not authorized for this assignment" },
        { status: 403 }
      );
    }

    // Get current rejected matches
    const currentRejected = (assignment.rejectedMatches as string[]) || [];

    // Add the new rejected userId if not already present
    if (!currentRejected.includes(rejectedUserId)) {
      const updatedRejected = [...currentRejected, rejectedUserId];

      // Update the assignment with the new rejected list
      await prisma.cupidAssignment.update({
        where: { id: assignmentId },
        data: {
          rejectedMatches: updatedRejected,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Match rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting match:", error);
    return NextResponse.json(
      { error: "Failed to reject match" },
      { status: 500 }
    );
  }
}
