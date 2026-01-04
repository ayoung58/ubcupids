/**
 * Update Revealed Count API
 *
 * POST /api/cupid/update-revealed-count
 * Updates the number of revealed matches for a cupid's assignment
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
    const { assignmentId, revealedCount } = body;

    if (!assignmentId || typeof revealedCount !== "number") {
      return NextResponse.json(
        { error: "Missing assignmentId or revealedCount" },
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

    // Update the revealed count
    await prisma.cupidAssignment.update({
      where: { id: assignmentId },
      data: {
        revealedCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Revealed count updated successfully",
    });
  } catch (error) {
    console.error("Error updating revealed count:", error);
    return NextResponse.json(
      { error: "Failed to update revealed count" },
      { status: 500 }
    );
  }
}
