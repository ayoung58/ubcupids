/**
 * Cupid Decision API
 *
 * POST /api/cupid/decide
 * Submit a decision for an assigned pair
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { submitCupidDecision } from "@/lib/matching/cupid";

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
    const { assignmentId, decision, reason } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Missing assignmentId" },
        { status: 400 }
      );
    }

    if (decision !== "approve" && decision !== "reject") {
      return NextResponse.json(
        { error: 'Decision must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Submit the decision
    const result = await submitCupidDecision(
      assignmentId,
      userId,
      decision,
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
    console.error("Error submitting cupid decision:", error);
    return NextResponse.json(
      { error: "Failed to submit decision" },
      { status: 500 }
    );
  }
}
