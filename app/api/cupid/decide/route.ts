/**
 * Cupid Selection API
 *
 * POST /api/cupid/decide
 * Submit a match selection for an assigned candidate
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { submitCupidSelection } from "@/lib/matching/cupid";

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
    const { assignmentId, selectedMatchId, reason } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Missing assignmentId" },
        { status: 400 }
      );
    }

    if (!selectedMatchId) {
      return NextResponse.json(
        { error: "Missing selectedMatchId - must select a match" },
        { status: 400 }
      );
    }

    // Submit the selection
    const result = await submitCupidSelection(
      assignmentId,
      userId,
      selectedMatchId,
      reason
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error submitting cupid selection:", error);
    return NextResponse.json(
      { error: "Failed to submit selection" },
      { status: 500 }
    );
  }
}
